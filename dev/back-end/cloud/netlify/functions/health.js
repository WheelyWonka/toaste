exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': 'https://toastebikepolo.com, https://toastebikepolo.ca',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'toaste-bike-polo-cloud',
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0'
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({
      error: 'Method not allowed'
    })
  };
};
