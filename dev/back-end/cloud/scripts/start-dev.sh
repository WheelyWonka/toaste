#!/bin/bash

# Toasté Backend Local Development Server
echo "🚀 Starting Toasté Backend Local Development Server..."
echo "📁 Working directory: $(pwd)"
echo "🌐 Server will be available at: http://localhost:8889"
echo "📡 Functions will be available at: http://localhost:8889/.netlify/functions/"
echo ""
echo "Available endpoints:"
echo "  - http://localhost:8889/.netlify/functions/shipping"
echo "  - http://localhost:8889/.netlify/functions/orders"
echo "  - http://localhost:8889/.netlify/functions/send-email"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Netlify dev server
netlify dev
