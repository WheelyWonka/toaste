// ChitChats API shipping calculation
const https = require('https');
const { withCors, createCorsResponse } = require('./cors');


// Parse address string into components
function parseAddress(addressString) {
  // Basic address parsing - this could be enhanced with a proper address parser
  const lines = addressString.split('\n').map(line => line.trim()).filter(line => line);
  
  // Assume first line is street address
  const street = lines[0] || '';
  
  // Look for city, province, postal code in remaining lines
  let city = '';
  let province = '';
  let postalCode = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for postal code pattern (Canadian: A1A 1A1, US: 12345 or 12345-6789)
    const postalMatch = line.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)|(\d{5}(-\d{4})?)/i);
    if (postalMatch) {
      postalCode = postalMatch[0].toUpperCase();
      continue;
    }
    
    // Check for province/state (2-3 letter codes)
    const provinceMatch = line.match(/\b([A-Z]{2,3})\b/);
    if (provinceMatch) {
      province = provinceMatch[1].toUpperCase();
      continue;
    }
    
    // If no postal code or province found, assume it's city
    if (!city) {
      city = line;
    }
  }
  
  return { street, city, province, postalCode };
}

// Determine country from postal code
function getCountryFromPostalCode(postalCode) {
  if (!postalCode) return 'CA'; // Default to Canada
  
  // Canadian postal code pattern: A1A 1A1
  if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postalCode)) {
    return 'CA';
  }
  
  // US ZIP code pattern: 12345 or 12345-6789
  if (/^\d{5}(-\d{4})?$/.test(postalCode)) {
    return 'US';
  }
  
  return 'CA'; // Default to Canada
}

// Make request to ChitChats API
function requestShippingRate(addressData, orderId = null) {
  return new Promise((resolve, reject) => {
    // Calculate required fields automatically
    const numberOfCovers = 1; // Default to 1 cover for shipping calculation
    const weight = 100 * numberOfCovers; // 100g per cover
    const size_z = 3 + (0.5 * numberOfCovers); // 3cm base + 0.5cm per cover
    const price = 40 * numberOfCovers;
    
    const postData = JSON.stringify({
      name: addressData.name,
      address_1: addressData.address_1,
      city: addressData.city,
      country_code: addressData.country_code,
      description: orderId ? `Order ${orderId}` : "Bike wheel covers",
      value: price, // Base price per cover
      value_currency: "cad",
      package_type: "large_flat_rate_box",
      weight_unit: "g",
      weight: weight.toString(),
      size_unit: "cm",
      size_x: 63,
      size_y: 63,
      size_z: size_z,
      postage_type: "chit_chats_canada_tracked", // Default to Canada tracked
      ship_date: "today",
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

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            resolve(response);
          } else {
            reject(new Error(`ChitChats API error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse ChitChats response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`ChitChats API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

// Main shipping calculation handler
async function shippingHandler(event) {
  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, event, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body);
    const { address, orderId } = body;

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
    if (!addressData.name || !addressData.address_1 || !addressData.city || !addressData.country_code) {
      return createCorsResponse(400, event, { 
        error: 'Incomplete address. Please provide name, address, city, and country.' 
      });
    }

    // Request shipping rate from ChitChats
    const shippingResponse = await requestShippingRate(addressData, orderId);

    // Extract shipping cost from response
    const shippingCost = shippingResponse.postage_cost || 0;

    return createCorsResponse(200, event, {
      success: true,
      shippingCost: parseFloat(shippingCost),
      currency: 'CAD',
      address: addressData,
      service: shippingResponse.postage_description || 'Standard Shipping'
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    
    return createCorsResponse(500, event, {
      error: 'Failed to calculate shipping cost',
      details: error.message
    });
  }
}

// Export handler with CORS middleware
exports.handler = withCors(shippingHandler);
