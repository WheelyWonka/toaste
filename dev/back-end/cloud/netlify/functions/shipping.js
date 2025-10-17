// ChitChats API shipping calculation
const https = require('https');
const { withCors, createCorsResponse } = require('./cors');
const { log, validateAddress } = require('./utils');

// Make request to ChitChats API
function requestShippingRate(addressData, numberOfCovers = 1, totalPrice = 40) {
  return new Promise((resolve, reject) => {
    // Use provided values or defaults
    const covers = numberOfCovers || 1;
    const price = totalPrice || 40;
    const weight = 100 * covers; // 100g per cover
    const size_z = 3 + (0.5 * covers); // 3cm base + 0.5cm per cover
    
    log('INFO', 'Preparing ChitChats API request', {
      covers,
      price,
      weight,
      size_z,
      addressData
    });
    
    const postData = JSON.stringify({
      package_contents: "gift",
      name: addressData.name,
      address_1: addressData.address_1,
      city: addressData.city,
      country_code: addressData.country_code,
      description: `Bike wheel covers`,
      value: price, // Total price of the order
      value_currency: "cad",
      package_type: "parcel",
      weight_unit: "g",
      weight: weight,
      size_unit: "cm",
      size_x: 63,
      size_y: 63,
      size_z: size_z,
      postage_type: "unknown", // Default to Canada tracked
      ship_date: "today",
      cheapest_postage_type_requested: "yes",
      ...(addressData.province_code && { province_code: addressData.province_code }),
      ...(addressData.postal_code && { postal_code: addressData.postal_code })
    });

    const options = {
      hostname: 'chitchats.com',
      port: 443,
      path: `/api/v1/clients/${process.env.CHITCHATS_CLIENT_ID}/shipments`,
      method: 'POST',
      headers: {
        'Authorization': process.env.CHITCHATS_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    log('INFO', 'Making HTTPS request to ChitChats API', {
      url: options.hostname + options.path,
      method: options.method,
      hasAuth: !!process.env.CHITCHATS_ACCESS_TOKEN
    });

    const req = https.request(options, (res) => {
      let data = '';

      log('INFO', 'ChitChats API response received', {
        statusCode: res.statusCode,
        headers: res.headers
      });

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          log('INFO', 'ChitChats API response body', { data });
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            log('INFO', 'ChitChats API request successful', { response });
            resolve(response);
          } else {
            log('ERROR', 'ChitChats API returned error status', {
              statusCode: res.statusCode,
              data
            });
            reject(new Error(`ChitChats API error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          log('ERROR', 'Failed to parse ChitChats response', {
            error: error.message,
            data
          });
          reject(new Error(`Failed to parse ChitChats response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      log('ERROR', 'ChitChats API request failed', {
        error: error.message,
        code: error.code
      });
      reject(new Error(`ChitChats API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Main shipping calculation handler
async function shippingHandler(event) {
  log('INFO', 'Shipping calculation request received', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? 'Present' : 'Missing'
  });

  if (event.httpMethod !== 'POST') {
    log('WARN', 'Invalid HTTP method', { method: event.httpMethod });
    return createCorsResponse(405, event, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body);
    const { address, numberOfCovers, totalPrice } = body;
    
    log('INFO', 'Request body parsed', {
      hasAddress: !!address,
      numberOfCovers,
      totalPrice,
      addressKeys: address ? Object.keys(address) : []
    });

    if (!address) {
      return createCorsResponse(400, event, { error: 'Address is required' });
    }

    // Use the structured address data directly
    const addressData = {
      name: address.name || '',
      address_1: address.address_1 || '',
      city: address.city || '',
      province_code: address.province_code || '',
      postal_code: address.postal_code || '',
      country_code: address.country_code || 'CA'
    };

    // Validate required fields
    try {
      validateAddress(addressData);
    } catch (error) {
      log('WARN', 'Address validation failed', { addressData, error: error.message });
      return createCorsResponse(400, event, { error: error.message });
    }

    log('INFO', 'Requesting shipping rate from ChitChats', {
      addressData,
      numberOfCovers,
      totalPrice: totalPrice?.total
    });

    // Request shipping rate from ChitChats
    const shippingResponse = await requestShippingRate(addressData, numberOfCovers, totalPrice?.total);

    log('INFO', 'ChitChats API response received', {
      hasShipment: !!shippingResponse.shipment,
      hasPostageFee: !!(shippingResponse.shipment?.postage_fee || shippingResponse.postage_fee),
      hasId: !!(shippingResponse.shipment?.id || shippingResponse.id)
    });

    // Extract shipping cost and shipment ID from response
    const shippingCost = shippingResponse.shipment?.postage_fee || shippingResponse.postage_fee || 0;
    const shipmentId = shippingResponse.shipment?.id || shippingResponse.id;

    log('INFO', 'Shipping calculation successful', {
      shippingCost,
      shipmentId,
      currency: 'CAD'
    });

    return createCorsResponse(200, event, {
      success: true,
      shippingCost: parseFloat(shippingCost),
      shipmentId: shipmentId,
      currency: 'CAD',
      address: addressData,
      service: shippingResponse.shipment?.postage_description || shippingResponse.postage_description || 'Standard Shipping'
    });

  } catch (error) {
    log('ERROR', 'Shipping calculation failed', {
      error: error.message,
      stack: error.stack
    });
    
    return createCorsResponse(500, event, {
      error: 'Failed to calculate shipping cost',
      details: error.message
    });
  }
}

// Export handler with CORS middleware
exports.handler = withCors(shippingHandler);
