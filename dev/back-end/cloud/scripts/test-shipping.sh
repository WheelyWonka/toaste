#!/bin/bash

# Test script specifically for shipping function
BASE_URL="http://localhost:8889/.netlify/functions"

echo "📦 Testing Shipping Function Only"
echo "================================"
echo ""

# Test with Canadian address
echo "🇨🇦 Testing with Canadian address..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "address": {
      "name": "William Test",
      "address_1": "2035 saint hubert",
      "city": "Montréal",
      "province_code": "QC",
      "postal_code": "H1L 3Z6",
      "country_code": "CA"
    },
    "numberOfCovers": 2,
    "totalPrice": 90.00
  }' \
  "$BASE_URL/shipping"

echo ""
echo ""

# Test with US address
echo "🇺🇸 Testing with US address..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "address": {
      "name": "John Doe",
      "address_1": "123 Main Street",
      "city": "New York",
      "province_code": "NY",
      "postal_code": "10001",
      "country_code": "US"
    },
    "numberOfCovers": 1,
    "totalPrice": 45.00
  }' \
  "$BASE_URL/shipping"

echo ""
echo ""

# Test with minimal required fields
echo "🔍 Testing with minimal required fields..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "address": {
      "name": "Test User",
      "address_1": "123 Test Street",
      "city": "Montreal",
      "country_code": "CA"
    },
    "numberOfCovers": 1,
    "totalPrice": 45.00
  }' \
  "$BASE_URL/shipping"

echo ""
echo "✅ Shipping tests completed!"
