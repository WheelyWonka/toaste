// Generate unique order ID for new orders
const Airtable = require('airtable');
const { withCors, createCorsResponse } = require('./cors');
const { log, generateOrderCode, handleAsyncError } = require('./utils');

// Initialize Airtable
function getAirtableBase() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_PAT
  }).base(process.env.AIRTABLE_BASE_ID);
}

// Check if order code already exists in Airtable
async function orderCodeExists(orderCode) {
  return new Promise((resolve, reject) => {
    getAirtableBase()('Orders').select({
      filterByFormula: `{Order Code} = "${orderCode}"`,
      maxRecords: 1
    }).firstPage((err, records) => {
      if (err) {
        log('ERROR', 'Failed to check order code existence', { error: err.message, orderCode });
        reject(err);
      } else {
        resolve(records.length > 0);
      }
    });
  });
}

// Generate a unique order code
async function generateUniqueOrderCode() {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const orderCode = generateOrderCode();
    
    try {
      const exists = await orderCodeExists(orderCode);
      if (!exists) {
        log('INFO', 'Unique order code generated', { orderCode, attempts: attempts + 1 });
        return orderCode;
      }
      log('WARN', 'Order code collision detected, generating new one', { orderCode, attempts: attempts + 1 });
    } catch (error) {
      log('ERROR', 'Error checking order code uniqueness', { error: error.message, orderCode });
      throw error;
    }
    
    attempts++;
  }
  
  throw new Error(`Failed to generate unique order code after ${maxAttempts} attempts`);
}

// Main handler
async function generateOrderIdHandler(event, context) {
  log('INFO', 'Generate order ID request received', {
    method: event.httpMethod,
    headers: event.headers
  });

  if (event.httpMethod !== 'POST') {
    log('WARN', 'Invalid HTTP method for order ID generation', { method: event.httpMethod });
    return createCorsResponse(405, event, { error: 'Method not allowed' });
  }

  try {
    const orderCode = await generateUniqueOrderCode();
    
    log('INFO', 'Order ID generated successfully', { orderCode });
    
    return createCorsResponse(200, event, {
      success: true,
      orderId: orderCode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return handleAsyncError(error, event, 'Order ID generation');
  }
}

// Export handler with CORS middleware
exports.handler = withCors(generateOrderIdHandler);
