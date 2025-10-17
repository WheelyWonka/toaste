#!/bin/bash

# Test script for local Netlify functions
BASE_URL="http://localhost:8889/.netlify/functions"

echo "🧪 Testing Toasté Backend Functions"
echo "=================================="
echo ""

# Test shipping function
echo "📦 Testing Shipping Function..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "address": {
      "name": "Test User",
      "address_1": "123 Test Street",
      "city": "Montreal",
      "province_code": "QC",
      "postal_code": "H1A 1A1",
      "country_code": "CA"
    },
    "numberOfCovers": 1,
    "totalPrice": 45.00
  }' \
  "$BASE_URL/shipping"

echo ""
echo ""

# Test orders function
echo "📋 Testing Orders Function..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "products": [
      {
        "spokeCount": 32,
        "wheelSize": "26",
        "quantity": 1
      }
    ],
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "shippingAddress": {
      "name": "Test User",
      "address_1": "123 Test Street",
      "city": "Montreal",
      "province_code": "QC",
      "postal_code": "H1A 1A1",
      "country_code": "CA"
    },
    "notes": "Test order",
    "language": "en",
    "shippingFee": 15.50,
    "shipmentId": "TEST123"
  }' \
  "$BASE_URL/orders"

echo ""
echo "✅ Tests completed!"
