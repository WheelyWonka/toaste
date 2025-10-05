# Toasté Bike Polo - Step-by-Step Setup Guide

## 🎯 Overview
This guide will walk you through setting up the Toasté Bike Polo order system using Netlify Functions and Airtable.

## 📋 Prerequisites
- ✅ Airtable account created
- ✅ Netlify account created
- ✅ GitHub repository ready

---

## Step 1: Airtable Setup

### 1.1 Create the Base
1. **Log into Airtable**: https://airtable.com
2. **Click "Add a base"** → **"Start from scratch"**
3. **Name it**: `Toasté Bike Polo Orders`
4. **Click "Create base"**

### 1.2 Set Up Orders Table
1. **Rename the default table** to `Orders`
2. **Delete the default "Name" field**
3. **Add these fields** (in this order):

| Field Name | Field Type | Required | Options |
|------------|------------|----------|---------|
| Order Code | Single line text | ✅ | - |
| Customer Name | Single line text | ✅ | - |
| Customer Email | Email | ✅ | - |
| Shipping Address | Long text | ✅ | - |
| Notes | Long text | ❌ | - |
| Order Date | Date | ✅ | - |
| Status | Single select | ✅ | waiting_for_payment, to_produce, to_send, done, cancelled, refunded |
| Total Price CAD | Currency | ✅ | CAD |
| Tax Amount CAD | Currency | ✅ | CAD |

### 1.3 Create Order Items Table
1. **Click "+" next to Orders table**
2. **Name it**: `Order Items`
3. **Add these fields**:

| Field Name | Field Type | Required | Options |
|------------|------------|----------|---------|
| Order | Link to another record | ✅ | Link to Orders table |
| Spoke Count | Number | ✅ | - |
| Wheel Size | Single line text | ✅ | - |
| Quantity | Number | ✅ | - |
| Unit Price CAD | Currency | ✅ | CAD |

### 1.4 Get API Credentials
1. **Go to**: https://airtable.com/account
2. **Scroll to "Personal access tokens"**
3. **Click "Create new token"**
4. **Configure token**:
   - **Name**: `Toasté Bike Polo Orders`
   - **Scopes**: Check `data.records:write` and `data.records:read`
   - **Bases**: Select your `Toasté Bike Polo Orders` base
5. **Click "Create token"**
6. **Copy the Personal Access Token** (starts with `pat` - you won't see it again!)
7. **Important**: This replaces the old API keys (deprecated February 2024)

### 1.5 Get Base ID
1. **Go to**: https://airtable.com/api
2. **Select your base**: `Toasté Bike Polo Orders`
3. **Copy the Base ID** (starts with `app`)

---

## Step 2: Netlify Setup

### 2.1 Prepare Your Code
1. **Copy the cloud folder** to your GitHub repository
2. **Make sure you have**:
   - `netlify.toml`
   - `package.json`
   - `netlify/functions/` folder
   - `public/` folder

### 2.2 Deploy to Netlify
1. **Go to**: https://netlify.com
2. **Click "New site from Git"**
3. **Connect your Git provider** (GitHub/GitLab)
4. **Select your repository**
5. **Configure build settings**:
   - **Build command**: Leave empty or `npm run build`
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
6. **Click "Deploy site"**

### 2.3 Configure Environment Variables
1. **In Netlify Dashboard** → **Site settings** → **Environment variables**
2. **Add these variables**:

```
AIRTABLE_PAT=your-personal-access-token-here
AIRTABLE_BASE_ID=your-base-id-here
NODE_ENV=production
```

3. **Click "Save"**

### 2.4 Set Up Custom Domains
1. **In Netlify Dashboard** → **Domain settings**
2. **Add custom domain**: `api.toastebikepolo.com`
3. **Add custom domain**: `api.toastebikepolo.ca`
4. **Configure DNS** (see DNS setup below)

---

## Step 3: DNS Configuration

### 3.1 For api.toastebikepolo.com
In your Cloudflare DNS settings:

```
Type: CNAME
Name: api
Target: your-site-name.netlify.app
Proxy status: ✅ Proxied (Orange cloud)
TTL: Auto
```

### 3.2 For api.toastebikepolo.ca
In your Cloudflare DNS settings:

```
Type: CNAME
Name: api
Target: your-site-name.netlify.app
Proxy status: ✅ Proxied (Orange cloud)
TTL: Auto
```

### 3.3 Frontend Domains (GitHub Pages)
Your main frontend domains should point to GitHub Pages:

```
# For toastebikepolo.com (GitHub Pages)
Type: CNAME
Name: @
Target: your-username.github.io
Proxy status: ✅ Proxied (Orange cloud)

Type: CNAME
Name: www
Target: your-username.github.io
Proxy status: ✅ Proxied (Orange cloud)

# For toastebikepolo.ca (GitHub Pages)
Type: CNAME
Name: @
Target: your-username.github.io
Proxy status: ✅ Proxied (Orange cloud)

Type: CNAME
Name: www
Target: your-username.github.io
Proxy status: ✅ Proxied (Orange cloud)
```

---

## Step 4: Testing

### 4.1 Test API Health
```bash
# Test via Netlify URL
curl https://your-site-name.netlify.app/.netlify/functions/health

# Test via custom domain
curl https://api.toastebikepolo.com/.netlify/functions/health
curl https://api.toastebikepolo.ca/.netlify/functions/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "toaste-bike-polo-cloud",
  "environment": "production",
  "version": "1.0.0"
}
```

### 4.2 Test Order Creation
```bash
# Test via custom domain
curl -X POST https://api.toastebikepolo.com/.netlify/functions/orders \
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

### 4.3 Test Frontend Integration
1. **Visit your frontend**: https://toastebikepolo.com (GitHub Pages)
2. **Fill out the form**
3. **Submit an order** (will call api.toastebikepolo.com)
4. **Check Airtable** to verify the order was created

---

## Step 5: Verification Checklist

### ✅ Airtable Setup
- [ ] Base created with correct name
- [ ] Orders table with all required fields
- [ ] Order Items table with all required fields
- [ ] Personal Access Token created (starts with `pat`)
- [ ] Base ID copied (starts with `app`)

### ✅ Netlify Setup
- [ ] Site deployed successfully
- [ ] Environment variables configured
- [ ] API subdomains added (api.toastebikepolo.com, api.toastebikepolo.ca)
- [ ] DNS configured correctly
- [ ] SSL certificates active

### ✅ Testing
- [ ] Health endpoint responds on API subdomains
- [ ] Order creation works via API subdomains
- [ ] Frontend loads correctly on main domains (GitHub Pages)
- [ ] Orders appear in Airtable
- [ ] Both API subdomains work (.com and .ca)

---

## 🚨 Troubleshooting

### Common Issues

**1. Function not found (404)**
- Check `netlify.toml` configuration
- Verify functions are in `netlify/functions/` folder
- Redeploy the site

**2. CORS errors**
- Check domain configuration in functions
- Verify API subdomains are set up correctly
- Ensure frontend domains are configured for GitHub Pages

**3. Airtable errors**
- Verify Personal Access Token is correct (starts with `pat`)
- Check Base ID is correct (starts with `app`)
- Ensure tables exist with correct names
- Verify PAT has correct scopes (data.records:read, data.records:write)

**4. Domain/DNS issues**
- **API subdomain not working**: Check DNS propagation (can take 24 hours)
- **SSL issues**: Ensure DNS is pointing to Netlify for API subdomains
- **Frontend not loading**: Ensure main domains point to GitHub Pages
- **Mixed content errors**: Ensure both frontend and API use HTTPS


### Getting Help

1. **Check Netlify logs**: Site settings → Functions → View logs
2. **Check Airtable API**: https://airtable.com/api
3. **Test locally**: `npm run dev` and test functions

---

## 🎉 Success!

Once everything is working, you'll have:
- ✅ **Free hosting** on Netlify
- ✅ **Automatic HTTPS** for both domains
- ✅ **Serverless API** with Netlify Functions
- ✅ **Database** managed by Airtable
- ✅ **No server maintenance** required

Your Toasté Bike Polo order system is now live and ready for customers! 🚀
