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
function requestShippingRate(addressData, orderId = null, numberOfCovers = 1, totalPrice = 40) {
  return new Promise((resolve, reject) => {
    // Use provided values or defaults
    const covers = numberOfCovers || 1;
    const price = totalPrice || 40;
    const weight = 100 * covers; // 100g per cover
    const size_z = 3 + (0.5 * covers); // 3cm base + 0.5cm per cover
    
    const postData = JSON.stringify({
      package_contents: "gift",
      name: addressData.name,
      address_1: addressData.address_1,
      city: addressData.city,
      country_code: addressData.country_code,
      description: orderId ? `Order ${orderId}` : "Bike wheel covers",
      value: price.toString(), // Total price of the order
      value_currency: "cad",
      package_type: "parcel",
      weight_unit: "g",
      weight: weight.toString(),
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
    const { address, orderId, numberOfCovers, totalPrice } = body;

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
    const shippingResponse = await requestShippingRate(addressData, orderId, numberOfCovers, totalPrice);

    // Extract shipping cost and shipment ID from response
    const shippingCost = shippingResponse.shipment?.postage_fee || shippingResponse.postage_fee || 0;
    const shipmentId = shippingResponse.shipment?.id || shippingResponse.id;

    return createCorsResponse(200, event, {
      success: true,
      shippingCost: parseFloat(shippingCost),
      shipmentId: shipmentId,
      currency: 'CAD',
      address: addressData,
      service: shippingResponse.shipment?.postage_description || shippingResponse.postage_description || 'Standard Shipping'
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
