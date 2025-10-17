#!/bin/bash

# Toasté Backend Development Setup Script
echo "🚀 Setting up Toasté Backend Development Environment..."
echo "====================================================="
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
    echo "✅ Netlify CLI installed"
else
    echo "✅ Netlify CLI already installed"
fi

# Check if .env.local exists
if [ ! -f "../.env.local" ]; then
    echo "⚠️  .env.local not found. Please create it with your API keys."
    echo "   Copy from .env and update with your actual values."
    echo ""
    echo "   Required variables:"
    echo "   - CHITCHATS_ACCESS_TOKEN"
    echo "   - CHITCHATS_CLIENT_ID"
    echo "   - AIRTABLE_API_KEY"
    echo "   - AIRTABLE_BASE_ID"
    echo ""
else
    echo "✅ .env.local found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd .. && npm install
echo "✅ Dependencies installed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys"
echo "2. Run: ./scripts/start-dev.sh"
echo "3. Test with: ./scripts/test-functions.sh"
echo ""
