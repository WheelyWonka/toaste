const { withCors, createCorsResponse } = require('./cors');
const { log } = require('./utils');

// Health check handler (simplified)
async function healthHandler(event, context) {
  log('INFO', 'Health check request received', {
    method: event.httpMethod,
    headers: event.headers
  });

  if (event.httpMethod === 'GET') {
    const healthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'toaste-bike-polo-cloud',
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0'
    };
    
    log('INFO', 'Health check successful', healthResponse);
    return createCorsResponse(200, event, healthResponse);
  }

  log('WARN', 'Health check invalid method', { method: event.httpMethod });
  return createCorsResponse(405, event, { error: 'Method not allowed' });
}

// Export handler with CORS middleware
exports.handler = withCors(healthHandler);
