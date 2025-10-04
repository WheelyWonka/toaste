#!/bin/bash

# Toasté Bike Polo Cloud Deployment Script
# This script helps deploy the Netlify + Airtable solution

echo "🚀 Toasté Bike Polo Cloud Deployment"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml not found. Please run this script from the cloud/ directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your Airtable credentials:"
    echo "   - AIRTABLE_PAT=your-personal-access-token (starts with 'pat')"
    echo "   - AIRTABLE_BASE_ID=your-base-id (starts with 'app')"
    echo ""
    read -p "Press ENTER after configuring .env file..."
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify..."
    netlify login
fi

echo "🔍 Checking current status..."
netlify status

echo ""
echo "🚀 Deploying to Netlify..."
echo ""

# Deploy to production
netlify deploy --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site is now live at:"
netlify open --site

echo ""
echo "📋 Next steps:"
echo "1. Configure custom domains in Netlify dashboard"
echo "2. Set up DNS records for your domains"
echo "3. Test the API endpoints"
echo "4. Test the frontend order form"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: netlify functions:list"
echo "   - Test functions: netlify functions:invoke orders"
echo "   - Open site: netlify open"
echo "   - Check status: netlify status"
