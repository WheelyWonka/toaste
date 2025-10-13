const Airtable = require('airtable');

// Initialize Airtable (moved inside handler to avoid issues with OPTIONS requests)
function getAirtableBase() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_PAT
  }).base(process.env.AIRTABLE_BASE_ID);
}

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
    'Access-Control-Allow-Origin': 'https://preprod.toastebikepolo.ca',
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
  // Handle CORS preflight first (before any other processing)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://preprod.toastebikepolo.ca',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // Handle CORS for other methods
  const corsHeaders = handleCORS(event);

  try {
    if (event.httpMethod === 'POST') {
      // Create new order
      const body = JSON.parse(event.body);
      const {
        products, // Array of {spokeCount, wheelSize, quantity}
        customerName,
        customerEmail,
        shippingAddress,
        notes,
        language = 'en', // Default to English if not provided
        shippingFee = 0 // Default to 0 if not provided
      } = body;

      // Validate required fields
      if (!products || !Array.isArray(products) || products.length === 0 || !customerName || !customerEmail || !shippingAddress) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Missing required fields',
            required: ['products', 'customerName', 'customerEmail', 'shippingAddress']
          })
        };
      }

      // Validate each product
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.spokeCount || !product.wheelSize || !product.quantity) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: `Product ${i + 1} is missing required fields`,
              required: ['spokeCount', 'wheelSize', 'quantity']
            })
          };
        }

        // Validate spoke count
        if (!['32', '36'].includes(product.spokeCount.toString())) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: `Product ${i + 1}: Invalid spoke count`,
              validValues: ['32', '36']
            })
          };
        }

        // Validate wheel size
        if (!['26', '650b', '700'].includes(product.wheelSize)) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: `Product ${i + 1}: Invalid wheel size`,
              validValues: ['26', '650b', '700']
            })
          };
        }

        // Validate quantity
        if (product.quantity < 1 || product.quantity > 10) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: `Product ${i + 1}: Invalid quantity`,
              validRange: '1-10'
            })
          };
        }
      }

      // Generate order code
      const orderCode = generateOrderCode();
      
      // Calculate total pricing for all products
      let totalQuantity = 0;
      let totalSubtotal = 0;
      const productDetails = [];

      for (const product of products) {
        const quantity = parseInt(product.quantity);
        const pricing = calculatePricing(quantity);
        totalQuantity += quantity;
        totalSubtotal += pricing.subtotal;
        productDetails.push({
          spokeCount: product.spokeCount,
          wheelSize: product.wheelSize,
          quantity: quantity,
          unitPrice: pricing.basePrice,
          subtotal: pricing.subtotal
        });
      }

      // Calculate final tax and total
      const taxRate = 0.15; // 15% Quebec tax
      const totalTaxAmount = totalSubtotal * taxRate;
      const totalPrice = totalSubtotal + totalTaxAmount + parseFloat(shippingFee);

      // Generate product summary for easy reading in Airtable
      const productSummaryLines = productDetails.map(product => 
        `• ${product.quantity}x Wheel Cover (${product.spokeCount} spokes, ${product.wheelSize}")`
      );
      const productSummary = productSummaryLines.join('\n') + `\n\nTOTAL: ${totalQuantity} covers`;

      // Create order record
      const orderRecord = {
        'Order Code': orderCode,
        'Customer Name': customerName,
        'Customer Email': customerEmail,
        'Shipping Address': shippingAddress,
        'Notes': notes || '',
        'Order Date': new Date().toISOString().split('T')[0],
        'Status': 'waiting_for_payment',
        'Total Price CAD': totalPrice,
        'Tax Amount CAD': totalTaxAmount,
        'Shipping Fee CAD': parseFloat(shippingFee),
        'Product Summary': productSummary
      };

      // Create order in Airtable
      const orderResult = await new Promise((resolve, reject) => {
        getAirtableBase()('Orders').create(orderRecord, (err, record) => {
          if (err) reject(err);
          else resolve(record);
        });
      });

      // Create order items in Airtable
      const orderItems = [];
      for (const product of productDetails) {
        const orderItemRecord = {
          'Order': [orderResult.id],
          'Spoke Count': parseInt(product.spokeCount),
          'Wheel Size': product.wheelSize,
          'Quantity': product.quantity,
          'Unit Price CAD': product.unitPrice
        };

        const orderItemResult = await new Promise((resolve, reject) => {
          getAirtableBase()('Order Items').create(orderItemRecord, (err, record) => {
            if (err) reject(err);
            else resolve(record);
          });
        });

        orderItems.push({
          spokeCount: product.spokeCount,
          wheelSize: product.wheelSize,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          subtotal: product.subtotal
        });
      }

      // Send email notifications
      try {
        console.log('=== PREPARING EMAIL NOTIFICATIONS ===');
        const emailData = {
          orderCode: orderCode,
          customerName: customerName,
          customerEmail: customerEmail,
          customerAddress: shippingAddress,
          customerNotes: notes || '',
          language: language,
          products: productDetails.map(product => ({
            quantity: product.quantity,
            spokeCount: product.spokeCount,
            wheelSize: product.wheelSize,
            price: product.quantity * product.unitPrice
          })),
          subtotal: totalSubtotal,
          taxes: totalTaxAmount,
          shippingFee: parseFloat(shippingFee),
          total: totalPrice
        };
        
        console.log('Email data prepared:', JSON.stringify(emailData, null, 2));

        // Send customer confirmation email
        console.log('Sending customer confirmation email...');
        const customerEmailResponse = await fetch(`${process.env.URL || 'https://toastebikepolo.netlify.app'}/.netlify/functions/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderData: emailData,
            emailType: 'customer'
          })
        });
        
        const customerEmailResult = await customerEmailResponse.json();
        console.log('Customer email response:', customerEmailResult);

        // Send owner notification email
        console.log('Sending owner notification email...');
        const ownerEmailResponse = await fetch(`${process.env.URL || 'https://toastebikepolo.netlify.app'}/.netlify/functions/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderData: emailData,
            emailType: 'owner'
          })
        });
        
        const ownerEmailResult = await ownerEmailResponse.json();
        console.log('Owner email response:', ownerEmailResult);
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Don't fail the order if email fails
      }

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
            totalPrice: totalPrice,
            taxAmount: totalTaxAmount,
            status: 'waiting_for_payment',
            orderDate: new Date().toISOString().split('T')[0],
            items: orderItems,
            summary: {
              totalQuantity: totalQuantity,
              subtotal: totalSubtotal,
              taxAmount: totalTaxAmount,
              totalPrice: totalPrice
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
        getAirtableBase()('Orders').select({
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
        getAirtableBase()('Order Items').select({
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
