#!/bin/bash

# Test script specifically for orders function
BASE_URL="http://localhost:8889/.netlify/functions"

echo "📋 Testing Orders Function Only"
echo "==============================="
echo ""

# Test with complete order data
echo "📦 Testing complete order submission..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "products": [
      {
        "spokeCount": 32,
        "wheelSize": "26",
        "quantity": 2
      },
      {
        "spokeCount": 36,
        "wheelSize": "700c",
        "quantity": 1
      }
    ],
    "customerName": "William Test",
    "customerEmail": "william@example.com",
    "shippingAddress": {
      "name": "William Test",
      "address_1": "2035 saint hubert",
      "city": "Montréal",
      "province_code": "QC",
      "postal_code": "H1L 3Z6",
      "country_code": "CA"
    },
    "notes": "Test order with multiple products",
    "language": "en",
    "shippingFee": 15.50,
    "shipmentId": "TEST-SHIPMENT-123"
  }' \
  "$BASE_URL/orders"

echo ""
echo ""

# Test with single product
echo "📦 Testing single product order..."
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
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "shippingAddress": {
      "name": "John Doe",
      "address_1": "123 Main Street",
      "city": "New York",
      "province_code": "NY",
      "postal_code": "10001",
      "country_code": "US"
    },
    "notes": "Single product test",
    "language": "en",
    "shippingFee": 12.00,
    "shipmentId": "TEST-SHIPMENT-456"
  }' \
  "$BASE_URL/orders"

echo ""
echo ""

# Test with French language
echo "🇫🇷 Testing French language order..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "products": [
      {
        "spokeCount": 36,
        "wheelSize": "700c",
        "quantity": 1
      }
    ],
    "customerName": "Marie Dubois",
    "customerEmail": "marie@example.com",
    "shippingAddress": {
      "name": "Marie Dubois",
      "address_1": "456 rue de la Paix",
      "city": "Montréal",
      "province_code": "QC",
      "postal_code": "H2X 1Y2",
      "country_code": "CA"
    },
    "notes": "Commande de test en français",
    "language": "fr",
    "shippingFee": 15.50,
    "shipmentId": "TEST-SHIPMENT-789"
  }' \
  "$BASE_URL/orders"

echo ""
echo "✅ Orders tests completed!"
