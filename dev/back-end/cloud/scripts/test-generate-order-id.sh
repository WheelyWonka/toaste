#!/bin/bash

# Test script specifically for generate-order-id function
BASE_URL="http://localhost:8889/.netlify/functions"

echo "🆔 Testing Generate Order ID Function"
echo "===================================="
echo ""

# Test 1: Generate order ID
echo "📋 Test 1: Generate Order ID"
echo "----------------------------"
curl -s -X POST "$BASE_URL/generate-order-id" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'

echo ""
echo ""

# Test 2: Generate multiple order IDs to test uniqueness
echo "📋 Test 2: Generate Multiple Order IDs (testing uniqueness)"
echo "----------------------------------------------------------"
for i in {1..3}; do
  echo "Request $i:"
  curl -s -X POST "$BASE_URL/generate-order-id" \
    -H "Content-Type: application/json" \
    -d '{}' | jq '.orderId'
  echo ""
done

echo ""
echo "✅ Generate Order ID function tests completed!"
