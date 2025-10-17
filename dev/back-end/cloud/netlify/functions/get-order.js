// Retrieve order details by order ID from Airtable
const Airtable = require('airtable');
const { withCors, createCorsResponse } = require('./cors');
const { log, handleAsyncError } = require('./utils');

// Initialize Airtable
function getAirtableBase() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_PAT
  }).base(process.env.AIRTABLE_BASE_ID);
}

// Retrieve order by order ID
async function getOrderByOrderId(orderId) {
  return new Promise((resolve, reject) => {
    getAirtableBase()('Orders').select({
      filterByFormula: `{Order Code} = "${orderId}"`,
      maxRecords: 1
    }).firstPage(async (err, records) => {
      if (err) {
        log('ERROR', 'Failed to retrieve order from Airtable', { error: err.message, orderId });
        reject(err);
      } else if (records.length === 0) {
        log('WARN', 'Order not found', { orderId });
        resolve(null);
      } else {
        const record = records[0];
        
        // Get order items from the Order Items table
        const orderItems = await getOrderItems(record.id);
        
        const orderData = {
          id: record.id,
          orderCode: record.get('Order Code'),
          customerName: record.get('Customer Name'),
          customerEmail: record.get('Customer Email'),
          shippingAddress: record.get('Shipping Address'),
          products: orderItems,
          productSummary: record.get('Product Summary') || '',
          subtotal: record.get('Subtotal CAD') || 0,
          taxes: record.get('Tax Amount CAD') || 0,
          shippingFee: record.get('Shipping Fee CAD') || 0,
          totalPrice: record.get('Total Price CAD') || 0,
          orderStatus: record.get('Status') || 'Pending',
          orderDate: record.get('Order Date'),
          notes: record.get('Notes') || ''
        };
        log('INFO', 'Order retrieved successfully', { orderId, orderStatus: orderData.orderStatus, productCount: orderItems.length });
        resolve(orderData);
      }
    });
  });
}

// Retrieve order items for an order
async function getOrderItems(orderId) {
  return new Promise((resolve, reject) => {
    getAirtableBase()('Order Items').select({
      filterByFormula: `FIND("${orderId}", ARRAYJOIN({Order})) > 0`
    }).firstPage((err, records) => {
      if (err) {
        log('ERROR', 'Failed to retrieve order items', { error: err.message, orderId });
        reject(err);
      } else {
        const products = records.map(record => ({
          spokeCount: record.get('Spoke Count'),
          wheelSize: record.get('Wheel Size'),
          quantity: record.get('Quantity'),
          price: record.get('Unit Price CAD') * record.get('Quantity')
        }));
        log('INFO', 'Order items retrieved', { orderId, itemCount: products.length });
        resolve(products);
      }
    });
  });
}

// Main handler
async function getOrderHandler(event, context) {
  log('INFO', 'Get order request received', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers
  });

  if (event.httpMethod !== 'GET') {
    log('WARN', 'Invalid HTTP method for order retrieval', { method: event.httpMethod });
    return createCorsResponse(405, event, { error: 'Method not allowed' });
  }

  try {
    // Extract order ID from path
    const pathParts = event.path.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    if (!orderId) {
      log('WARN', 'No order ID provided in path', { path: event.path });
      return createCorsResponse(400, event, { error: 'Order ID is required' });
    }

    log('INFO', 'Retrieving order', { orderId });

    const order = await getOrderByOrderId(orderId);
    
    if (!order) {
      log('WARN', 'Order not found', { orderId });
      return createCorsResponse(404, event, { error: 'Order not found' });
    }

    log('INFO', 'Order retrieved successfully', { orderId, orderStatus: order.orderStatus });
    
    return createCorsResponse(200, event, {
      success: true,
      order: order
    });

  } catch (error) {
    return handleAsyncError(error, event, 'Order retrieval');
  }
}

// Export handler with CORS middleware
exports.handler = withCors(getOrderHandler);
