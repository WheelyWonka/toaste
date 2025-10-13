// Shared CORS utility for all Netlify functions

// Define allowed origins
const ALLOWED_ORIGINS = [
  'https://preprod.toastebikepolo.ca',
  'https://toastebikepolo.ca',
  'http://localhost:8000'
];

/**
 * Get the appropriate origin for CORS headers based on the request
 * @param {Object} event - The Netlify function event object
 * @returns {string} - The allowed origin to use in CORS headers
 */
function getAllowedOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin;
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

/**
 * Get CORS headers for responses
 * @param {Object} event - The Netlify function event object
 * @returns {Object} - CORS headers object
 */
function getCorsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handle CORS preflight OPTIONS request
 * @param {Object} event - The Netlify function event object
 * @returns {Object} - Response object for OPTIONS request
 */
function handleCorsPreflight(event) {
  return {
    statusCode: 200,
    headers: getCorsHeaders(event),
    body: ''
  };
}

/**
 * Create a CORS-enabled response
 * @param {number} statusCode - HTTP status code
 * @param {Object} event - The Netlify function event object
 * @param {Object|string} body - Response body
 * @returns {Object} - Response object with CORS headers
 */
function createCorsResponse(statusCode, event, body) {
  return {
    statusCode,
    headers: getCorsHeaders(event),
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

/**
 * Middleware function to handle CORS for Netlify functions
 * @param {Function} handler - The main function handler
 * @returns {Function} - Wrapped handler with CORS support
 */
function withCors(handler) {
  return async (event, context) => {
    // Handle CORS preflight first
    if (event.httpMethod === 'OPTIONS') {
      return handleCorsPreflight(event);
    }

    // Call the original handler and ensure CORS headers are added
    try {
      const result = await handler(event, context);
      
      // If the result doesn't have CORS headers, add them
      if (result && !result.headers['Access-Control-Allow-Origin']) {
        result.headers = { ...getCorsHeaders(event), ...result.headers };
      }
      
      return result;
    } catch (error) {
      console.error('Handler error:', error);
      return createCorsResponse(500, event, {
        error: 'Internal server error',
        details: error.message
      });
    }
  };
}

module.exports = {
  ALLOWED_ORIGINS,
  getAllowedOrigin,
  getCorsHeaders,
  handleCorsPreflight,
  createCorsResponse,
  withCors
};
