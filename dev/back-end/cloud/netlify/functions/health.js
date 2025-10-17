// Logging helper
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

exports.handler = async (event, context) => {
  log('INFO', 'Health check request received', {
    method: event.httpMethod,
    headers: event.headers
  });

  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': 'https://toastebikepolo.com, https://toastebikepolo.ca',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') {
    log('INFO', 'Health check OPTIONS request handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'GET') {
    const healthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'toaste-bike-polo-cloud',
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0'
    };
    
    log('INFO', 'Health check successful', healthResponse);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthResponse)
    };
  }

  log('WARN', 'Health check invalid method', { method: event.httpMethod });
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      error: 'Method not allowed'
    })
  };
};
