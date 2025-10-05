# Toasté Bike Polo - Cloud Solution (Netlify + Airtable)

A serverless order management system using Netlify Functions and Airtable for Toasté Bike Polo wheel covers.

## 🏗️ Architecture

```
Frontend (GitHub Pages) → Netlify Functions → Airtable API → Database
```

**Note**: This is an API-only deployment. The frontend is hosted separately on GitHub Pages.

## 🚀 Quick Setup Guide

### Step 1: Airtable Configuration

#### 1.1 Create Airtable Base
1. **Log into Airtable** (your existing account)
2. **Create new base**: `Toasté Bike Polo Orders`
3. **Set up tables** as described below

#### 1.2 Create Orders Table
Create a table named `Orders` with these fields:

| Field Name | Field Type | Required | Options |
|------------|------------|----------|---------|
| Order Code | Single line text | ✅ | Unique |
| Customer Name | Single line text | ✅ | - |
| Customer Email | Email | ✅ | - |
| Shipping Address | Long text | ✅ | - |
| Notes | Long text | ❌ | - |
| Order Date | Date | ✅ | - |
| Status | Single select | ✅ | waiting_for_payment, to_produce, to_send, done, cancelled, refunded |
| Total Price CAD | Currency | ✅ | CAD |
| Tax Amount CAD | Currency | ✅ | CAD |

#### 1.3 Create Order Items Table
Create a table named `Order Items` with these fields:

| Field Name | Field Type | Required | Options |
|------------|------------|----------|---------|
| Order | Link to another record | ✅ | Link to Orders table |
| Spoke Count | Number | ✅ | - |
| Wheel Size | Single line text | ✅ | - |
| Quantity | Number | ✅ | - |
| Unit Price CAD | Currency | ✅ | CAD |

#### 1.4 Get API Credentials
1. **Go to**: https://airtable.com/account
2. **Create Personal Access Token**:
   - Name: `Toasté Bike Polo Orders`
   - Scopes: `data.records:write`, `data.records:read`
   - Bases: Select your `Toasté Bike Polo Orders` base
3. **Copy the token** (starts with `pat` - you won't see it again!)
4. **Get Base ID**: https://airtable.com/api → Select your base → Copy Base ID

### Step 2: Netlify Configuration

#### 2.1 Deploy to Netlify
1. **Push code to GitHub** (or GitLab)
2. **Connect to Netlify**:
   - Go to https://netlify.com
   - Click "New site from Git"
   - Connect your repository
   - Set build settings:
     - Build command: `npm run build` (or leave empty)
     - Publish directory: `public`

#### 2.2 Configure Environment Variables
In Netlify Dashboard → Site settings → Environment variables:

```
AIRTABLE_PAT=your-personal-access-token-here
AIRTABLE_BASE_ID=your-base-id-here
NODE_ENV=production
```

#### 2.3 Custom Domain Setup
1. **Add API subdomains**:
   - `api.toastebikepolo.com`
   - `api.toastebikepolo.ca`
2. **Configure DNS**:
   - Add CNAME records for `api` subdomain pointing to your Netlify site
   - Keep main domains (`toastebikepolo.com`, `toastebikepolo.ca`) pointing to GitHub Pages
   - Enable SSL (automatic with Netlify)

### Step 3: Test the Setup

#### 3.1 Test API Endpoints
```bash
# Test health endpoint
curl https://your-site.netlify.app/.netlify/functions/health

# Test order creation
curl -X POST https://your-site.netlify.app/.netlify/functions/orders \
  -H "Content-Type: application/json" \
  -d '{
    "spokeCount": "32",
    "wheelSize": "26",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "shippingAddress": "123 Test St, Test City, TC 12345",
    "quantity": 1
  }'
```

#### 3.2 Test Frontend
1. Visit your custom domain
2. Fill out the order form
3. Submit an order
4. Check Airtable to verify the order was created

## 📁 Project Structure

```
cloud/
├── netlify.toml              # Netlify configuration
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── netlify/
│   └── functions/
│       ├── orders.js         # Order management API
│       └── health.js         # Health check endpoint
└── public/
    ├── index.html            # Frontend
    ├── script.js             # Frontend JavaScript
    ├── config.js             # Domain configuration
    └── assets/               # Static assets
```

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Test locally
curl http://localhost:8888/.netlify/functions/health
```

### Deployment
```bash
# Deploy to production
npm run deploy
```

## 📊 API Endpoints

### Orders
- `POST /.netlify/functions/orders` - Create new order
- `GET /.netlify/functions/orders?orderCode=ABC123` - Get order by code

### Health
- `GET /.netlify/functions/health` - API health check

## 💰 Pricing Logic

- Base price: $40 CAD per cover
- Tax rate: 15% (Quebec)
- Discount: 5% for pairs (2+ covers of same configuration)

## 🌐 Production URLs

**International (.com):**
- Frontend: https://toastebikepolo.com (GitHub Pages)
- API: https://api.toastebikepolo.com/.netlify/functions/orders (Netlify)

**Canadian (.ca):**
- Frontend: https://toastebikepolo.ca (GitHub Pages)
- API: https://api.toastebikepolo.ca/.netlify/functions/orders (Netlify)

## 🔒 Security Features

- CORS protection for both domains
- Input validation on all endpoints
- Rate limiting (Netlify default)
- Automatic HTTPS
- Environment variable protection

## 📈 Benefits of Cloud Solution

- ✅ **No server maintenance**
- ✅ **Automatic scaling**
- ✅ **Free hosting** (Netlify free tier)
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Easy deployment** (Git push)
- ✅ **Built-in monitoring**

## 🆚 vs Self-Hosted

| Feature | Cloud (Netlify) | Self-Hosted |
|---------|----------------|-------------|
| Maintenance | None | High |
| Cost | Free | Free (after setup) |
| Scaling | Automatic | Manual |
| HTTPS | Automatic | Manual |
| Deployment | Git push | Docker commands |
| Monitoring | Built-in | Manual setup |

## 🚨 Important Notes

1. **Airtable Personal Access Token**: Keep your PAT secure (starts with `pat`)
2. **Rate Limits**: Airtable free tier has 5 requests/second limit
3. **Cold Starts**: First request to functions may be slow
4. **Environment Variables**: Never commit tokens to git
5. **Token Security**: PATs are more secure than old API keys

## 🔧 Troubleshooting

### Common Issues

1. **Function not found**: Check `netlify.toml` configuration
2. **CORS errors**: Verify domain configuration in functions
3. **Airtable errors**: Check API key and base ID
4. **Build failures**: Check Node.js version in `netlify.toml`

### Debug Commands

```bash
# Check function logs
netlify functions:list

# Test function locally
netlify functions:invoke orders --payload '{"test": true}'

# Check environment variables
netlify env:list
```
