# DNS Configuration for Toasté Bike Polo

## Overview
Toasté Bike Polo supports both `.com` and `.ca` domains for international and Canadian markets.

## Required DNS Records

### For toastebikepolo.com:

```
Type: CNAME
Name: api
Content: your-toaste-tunnel-id.cfargotunnel.com
Proxy: Enabled (orange cloud)
TTL: Auto
```

### For toastebikepolo.ca:

```
Type: CNAME
Name: api
Content: your-toaste-tunnel-id.cfargotunnel.com
Proxy: Enabled (orange cloud)
TTL: Auto
```

## Cloudflare Tunnel Configuration

In your Cloudflare dashboard, configure the tunnel with these rules:

```yaml
ingress:
  # Toasté Bike Polo API (.com)
  - hostname: api.toastebikepolo.com
    service: http://api:3000
    
  # Toasté Bike Polo API (.ca)
  - hostname: api.toastebikepolo.ca
    service: http://api:3000
    
  # Toasté Bike Polo PocketBase Admin (.com)
  - hostname: api.toastebikepolo.com
    path: /pb/*
    service: http://pocketbase:8090
    
  # Toasté Bike Polo PocketBase Admin (.ca)
  - hostname: api.toastebikepolo.ca
    path: /pb/*
    service: http://pocketbase:8090
    
  # Catch-all rule (must be last)
  - service: http_status:404
```

## Frontend Configuration

The frontend automatically detects the domain and uses the appropriate API endpoint:

- **toastebikepolo.com** → `https://api.toastebikepolo.com/api`
- **toastebikepolo.ca** → `https://api.toastebikepolo.ca/api`
- **localhost** → `http://localhost:3001/api` (development)

## Testing Both Domains

After setup, test both domains:

```bash
# Test .com domain
curl https://api.toastebikepolo.com/health

# Test .ca domain  
curl https://api.toastebikepolo.ca/health
```

## Benefits of Dual Domain Setup

1. **International Reach**: `.com` for global audience
2. **Canadian Market**: `.ca` for Canadian customers
3. **SEO Benefits**: Both domains can be optimized
4. **Brand Protection**: Prevents competitors from using similar domains
5. **Flexibility**: Can redirect one to the other if needed

## SSL Certificates

Cloudflare automatically provides SSL certificates for both domains when they're proxied (orange cloud enabled).

## Domain Redirects (Optional)

If you want to redirect one domain to the other, you can set up a redirect in Cloudflare:

1. Go to **Rules → Redirect Rules**
2. Create a redirect from `toastebikepolo.ca/*` to `https://toastebikepolo.com/$1`
3. Or vice versa, depending on your preference
