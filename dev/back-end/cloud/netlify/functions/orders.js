const Airtable = require('airtable');

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_PAT
}).base(process.env.AIRTABLE_BASE_ID);

// Generate random order code
function generateOrderCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Calculate pricing
function calculatePricing(quantity) {
  const basePrice = 40; // $40 CAD per cover
  const taxRate = 0.15; // 15% Quebec tax
  
  // Apply 5% discount for pairs (2+ covers of same configuration)
  const discountRate = quantity >= 2 ? 0.05 : 0;
  const subtotal = basePrice * quantity * (1 - discountRate);
  const taxAmount = subtotal * taxRate;
  const totalPrice = subtotal + taxAmount;
  
  return {
    basePrice,
    subtotal,
    taxAmount,
    totalPrice,
    discountApplied: discountRate > 0
  };
}

// Handle CORS preflight
function handleCORS(event) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://toastebikepolo.com, https://toastebikepolo.ca, https://preprod.toastebikepolo.ca',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  return headers;
}

exports.handler = async (event, context) => {
  // Handle CORS
  const corsHeaders = handleCORS(event);
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Create new order
      const body = JSON.parse(event.body);
      const {
        spokeCount,
        wheelSize,
        customerName,
        customerEmail,
        shippingAddress,
        notes,
        quantity = 1
      } = body;

      // Validate required fields
      if (!spokeCount || !wheelSize || !customerName || !customerEmail || !shippingAddress) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Missing required fields',
            required: ['spokeCount', 'wheelSize', 'customerName', 'customerEmail', 'shippingAddress']
          })
        };
      }

      // Validate spoke count
      if (!['32', '36'].includes(spokeCount.toString())) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid spoke count',
            validValues: ['32', '36']
          })
        };
      }

      // Validate wheel size
      if (!['26', '650b', '700'].includes(wheelSize)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid wheel size',
            validValues: ['26', '650b', '700']
          })
        };
      }

      // Validate quantity
      if (quantity < 1 || quantity > 10) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Invalid quantity',
            validRange: '1-10'
          })
        };
      }

      // Generate order code
      const orderCode = generateOrderCode();
      
      // Calculate pricing
      const pricing = calculatePricing(quantity);

      // Create order record
      const orderRecord = {
        'Order Code': orderCode,
        'Customer Name': customerName,
        'Customer Email': customerEmail,
        'Shipping Address': shippingAddress,
        'Notes': notes || '',
        'Order Date': new Date().toISOString().split('T')[0],
        'Status': 'waiting_for_payment',
        'Total Price CAD': pricing.totalPrice,
        'Tax Amount CAD': pricing.taxAmount
      };

      // Create order in Airtable
      const orderResult = await new Promise((resolve, reject) => {
        base('Orders').create(orderRecord, (err, record) => {
          if (err) reject(err);
          else resolve(record);
        });
      });

      // Create order item record
      const orderItemRecord = {
        'Order': [orderResult.id],
        'Spoke Count': parseInt(spokeCount),
        'Wheel Size': wheelSize,
        'Quantity': quantity,
        'Unit Price CAD': pricing.basePrice
      };

      // Create order item in Airtable
      const orderItemResult = await new Promise((resolve, reject) => {
        base('Order Items').create(orderItemRecord, (err, record) => {
          if (err) reject(err);
          else resolve(record);
        });
      });

      // Return success response
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          order: {
            id: orderResult.id,
            orderCode: orderCode,
            customerName: customerName,
            customerEmail: customerEmail,
            totalPrice: pricing.totalPrice,
            taxAmount: pricing.taxAmount,
            status: 'waiting_for_payment',
            orderDate: new Date().toISOString().split('T')[0],
            item: {
              spokeCount: parseInt(spokeCount),
              wheelSize: wheelSize,
              quantity: quantity,
              unitPrice: pricing.basePrice
            },
            pricing: {
              basePrice: pricing.basePrice,
              subtotal: pricing.subtotal,
              taxAmount: pricing.taxAmount,
              totalPrice: pricing.totalPrice,
              discountApplied: pricing.discountApplied
            }
          }
        })
      };

    } else if (event.httpMethod === 'GET') {
      // Get order by order code
      const { orderCode } = event.queryStringParameters || {};

      if (!orderCode) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Order code is required'
          })
        };
      }

      // Find order by order code
      const orders = await new Promise((resolve, reject) => {
        base('Orders').select({
          filterByFormula: `{Order Code} = "${orderCode}"`
        }).firstPage((err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });

      if (orders.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Order not found',
            orderCode
          })
        };
      }

      const order = orders[0];

      // Get order items
      const orderItems = await new Promise((resolve, reject) => {
        base('Order Items').select({
          filterByFormula: `{Order} = "${order.id}"`
        }).firstPage((err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          order: {
            id: order.id,
            orderCode: order.fields['Order Code'],
            customerName: order.fields['Customer Name'],
            customerEmail: order.fields['Customer Email'],
            shippingAddress: order.fields['Shipping Address'],
            notes: order.fields['Notes'],
            orderDate: order.fields['Order Date'],
            status: order.fields['Status'],
            totalPrice: order.fields['Total Price CAD'],
            taxAmount: order.fields['Tax Amount CAD'],
            items: orderItems.map(item => ({
              spokeCount: item.fields['Spoke Count'],
              wheelSize: item.fields['Wheel Size'],
              quantity: item.fields['Quantity'],
              unitPrice: item.fields['Unit Price CAD']
            }))
          }
        })
      };

    } else {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Method not allowed'
        })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      })
    };
  }
};
