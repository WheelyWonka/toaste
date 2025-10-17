const Airtable = require('airtable');
const { withCors, createCorsResponse } = require('./cors');
const { 
  log, 
  validateRequiredFields, 
  validateAddress, 
  validateProduct, 
  generateOrderCode, 
  calculatePricing, 
  formatAddress, 
  createAirtableRecord,
  handleAsyncError 
} = require('./utils');

// Initialize Airtable
function getAirtableBase() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_PAT
  }).base(process.env.AIRTABLE_BASE_ID);
}

// Send email notifications (simplified)
async function sendEmailNotifications(orderData) {
  const emailData = {
    orderCode: orderData.orderCode,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerAddress: orderData.formattedAddress,
    customerNotes: orderData.notes || '',
    language: orderData.language,
    products: orderData.products.map(product => ({
      quantity: product.quantity,
      spokeCount: product.spokeCount,
      wheelSize: product.wheelSize,
      price: product.quantity * product.unitPrice
    })),
    subtotal: orderData.totalSubtotal,
    taxes: orderData.totalTaxAmount,
    shippingFee: parseFloat(orderData.shippingFee),
    total: orderData.totalPrice,
    chitChatLink: orderData.chitChatLink
  };

  const baseUrl = process.env.URL || 'https://toastebikepolo.netlify.app';
  
  // Send both emails in parallel
  await Promise.all([
    fetch(`${baseUrl}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderData: emailData, emailType: 'customer' })
    }),
    fetch(`${baseUrl}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderData: emailData, emailType: 'owner' })
    })
  ]);
}

// Main orders handler
async function ordersHandler(event, context) {
  log('INFO', 'Order request received', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? 'Present' : 'Missing'
  });

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
        shippingFee = 0, // Default to 0 if not provided
        shipmentId = null, // Default to null if not provided
        orderId = null // Default to null if not provided
      } = body;

      log('INFO', 'Order request body parsed', {
        hasProducts: !!products,
        productCount: products?.length,
        hasCustomerName: !!customerName,
        hasCustomerEmail: !!customerEmail,
        hasShippingAddress: !!shippingAddress,
        shippingFee,
        shipmentId,
        orderId,
        language
      });

      // Validate required fields
      try {
        validateRequiredFields(body, ['products', 'customerName', 'customerEmail', 'shippingAddress'], 'order');
        if (!Array.isArray(products) || products.length === 0) {
          throw new Error('Products must be a non-empty array');
        }
        validateAddress(shippingAddress);
        
        // Validate each product
        products.forEach(validateProduct);
      } catch (error) {
        log('WARN', 'Validation failed', { error: error.message });
        return createCorsResponse(400, event, { error: error.message });
      }

      // Format address for storage
      const formattedAddress = formatAddress(shippingAddress);

      // Use provided order ID or generate a new one
      const orderCode = orderId || generateOrderCode();
      
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
      // Create ChitChat link if shipmentId is provided
      const chitChatLink = shipmentId ? `https://chitchats.com/clients/${process.env.CHITCHATS_CLIENT_ID}/shipments/${shipmentId}` : '';

      const orderRecord = {
        'Order Code': orderCode,
        'Customer Name': customerName,
        'Customer Email': customerEmail,
        'Shipping Address': formattedAddress,
        'Notes': notes || '',
        'Order Date': new Date().toISOString().split('T')[0],
        'Status': 'waiting_for_payment',
        'Total Price CAD': totalPrice,
        'Tax Amount CAD': totalTaxAmount,
        'Shipping Fee CAD': parseFloat(shippingFee),
        'Product Summary': productSummary,
        'ChitChat Link': chitChatLink
      };

      // Create order in Airtable
      const orderResult = await createAirtableRecord(getAirtableBase(), 'Orders', orderRecord);

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

        await createAirtableRecord(getAirtableBase(), 'Order Items', orderItemRecord);
        orderItems.push({
          spokeCount: product.spokeCount,
          wheelSize: product.wheelSize,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          subtotal: product.subtotal
        });
      }

      // Send email notifications (non-blocking)
      sendEmailNotifications({
        orderCode, customerName, customerEmail, formattedAddress, notes, language,
        products: productDetails, totalSubtotal, totalTaxAmount, shippingFee, totalPrice,
        chitChatLink
      }).catch(error => {
        log('WARN', 'Email notifications failed', { error: error.message });
        // Don't fail the order if email fails
      });

      // Return success response
      return createCorsResponse(201, event, {
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
      });

    } else {
      return createCorsResponse(405, event, {
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    return handleAsyncError(error, event, 'Order processing');
  }
}

// Export handler with CORS middleware
exports.handler = withCors(ordersHandler);
