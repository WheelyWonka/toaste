#!/bin/bash

# Test script specifically for get-order function
BASE_URL="http://localhost:8889/.netlify/functions"

echo "📋 Testing Get Order Function"
echo "============================="
echo ""

# Test 1: Get order with valid order ID (replace with actual order ID from your Airtable)
echo "📋 Test 1: Get Order with Valid ID"
echo "----------------------------------"
echo "Note: Replace 'YOUR_ORDER_ID' with an actual order ID from your Airtable"
curl -s -X GET "$BASE_URL/get-order/YOUR_ORDER_ID" | jq '.'

echo ""
echo ""

# Test 2: Get order with invalid order ID
echo "📋 Test 2: Get Order with Invalid ID"
echo "------------------------------------"
curl -s -X GET "$BASE_URL/get-order/INVALID123" | jq '.'

echo ""
echo ""

# Test 3: Get order with empty order ID
echo "📋 Test 3: Get Order with Empty ID"
echo "----------------------------------"
curl -s -X GET "$BASE_URL/get-order/" | jq '.'

echo ""
echo "✅ Get Order function tests completed!"
echo ""
echo "💡 To test with a real order ID:"
echo "1. Create an order using the orders endpoint"
echo "2. Copy the order ID from the response"
echo "3. Replace 'YOUR_ORDER_ID' in this script with the actual order ID"
echo "4. Run the test again"
