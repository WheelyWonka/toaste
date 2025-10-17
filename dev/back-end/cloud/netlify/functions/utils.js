// Shared utilities for all Netlify functions

/**
 * Logging helper with consistent format
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const separator = '='.repeat(60);
  
  console.log(`\n${separator}`);
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  console.log(separator);
}

/**
 * Validate required fields in an object
 */
function validateRequiredFields(obj, requiredFields, fieldName = 'object') {
  const missing = requiredFields.filter(field => !obj[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required ${fieldName} fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate address structure
 */
function validateAddress(address) {
  validateRequiredFields(address, ['name', 'address_1', 'city', 'country_code'], 'address');
}

/**
 * Validate product structure
 */
function validateProduct(product, index) {
  const required = ['spokeCount', 'wheelSize', 'quantity'];
  validateRequiredFields(product, required, `product ${index + 1}`);
  
  if (!['32', '36'].includes(product.spokeCount.toString())) {
    throw new Error(`Product ${index + 1}: Invalid spoke count. Valid values: 32, 36`);
  }
  
  if (!['26', '650b', '700'].includes(product.wheelSize)) {
    throw new Error(`Product ${index + 1}: Invalid wheel size. Valid values: 26, 650b, 700`);
  }
  
  if (product.quantity < 1 || product.quantity > 10) {
    throw new Error(`Product ${index + 1}: Invalid quantity. Valid range: 1-10`);
  }
}

/**
 * Generate random order code
 */
function generateOrderCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => 
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
}

/**
 * Calculate pricing for a quantity
 */
function calculatePricing(quantity) {
  const basePrice = 40;
  const taxRate = 0.15;
  const discountRate = quantity >= 2 ? 0.05 : 0;
  
  const subtotal = basePrice * quantity * (1 - discountRate);
  const taxAmount = subtotal * taxRate;
  const totalPrice = subtotal + taxAmount;
  
  return { basePrice, subtotal, taxAmount, totalPrice, discountApplied: discountRate > 0 };
}

/**
 * Format address for storage
 */
function formatAddress(address) {
  let formatted = `${address.address_1}, ${address.city}`;
  if (address.province_code) formatted += `, ${address.province_code}`;
  if (address.postal_code) formatted += `, ${address.postal_code}`;
  formatted += `, ${address.country_code}`;
  return formatted;
}

/**
 * Create Airtable record with error handling
 */
function createAirtableRecord(base, tableName, record) {
  return new Promise((resolve, reject) => {
    base(tableName).create(record, (err, result) => {
      if (err) {
        log('ERROR', `Failed to create ${tableName} record`, { error: err.message, record });
        reject(err);
      } else {
        log('INFO', `${tableName} record created successfully`, { id: result.id });
        resolve(result);
      }
    });
  });
}

/**
 * Handle async errors consistently
 */
function handleAsyncError(error, event, context = 'Operation') {
  log('ERROR', `${context} failed`, {
    error: error.message,
    stack: error.stack
  });
  
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: `${context} failed`,
      details: error.message
    })
  };
}

module.exports = {
  log,
  validateRequiredFields,
  validateAddress,
  validateProduct,
  generateOrderCode,
  calculatePricing,
  formatAddress,
  createAirtableRecord,
  handleAsyncError
};
