# Cloudflare Tunnel Configuration for Toasté Bike Polo

## Overview
Toasté Bike Polo uses its own dedicated Cloudflare tunnel container, completely separate from your existing infrastructure.

## Architecture

```
Internet → Cloudflare → Toasté Tunnel → Toasté Services
```

## Setup Instructions

### 1. Create Cloudflare Tunnel

1. **Log into Cloudflare Dashboard** (Toasté account)
2. **Go to Zero Trust → Access → Tunnels**
3. **Create a new tunnel**:
   - Name: `toaste-bike-polo`
   - Subdomain: `api` (will create `api.toastebikepolo.com` and `api.toastebikepolo.ca`)

### 2. Configure Tunnel

In your Cloudflare dashboard, configure the tunnel with these rules:

```yaml
# Cloudflare Tunnel Config (config.yml)
tunnel: your-toaste-tunnel-id
credentials-file: /root/.cloudflared/your-toaste-tunnel-id.json

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

### 3. Get Tunnel Token

1. **Copy the tunnel token** from Cloudflare dashboard
2. **Add to your `.env` file**:
   ```bash
   TOASTE_CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token-here
   ```

## DNS Configuration

DNS is automatically configured when you create the tunnel in Cloudflare dashboard. The tunnel will create:

```
Type: CNAME
Name: api
Content: your-toaste-tunnel-id.cfargotunnel.com
Proxy: Enabled (orange cloud)
```

## Service URLs

After configuration, your services will be available at:

**International (.com):**
- **API**: https://api.toastebikepolo.com
- **PocketBase Admin**: https://api.toastebikepolo.com/pb/_/
- **Health Check**: https://api.toastebikepolo.com/health

**Canadian (.ca):**
- **API**: https://api.toastebikepolo.ca
- **PocketBase Admin**: https://api.toastebikepolo.ca/pb/_/
- **Health Check**: https://api.toastebikepolo.ca/health

## Testing

1. Deploy Toasté services: `./deploy.sh --all`
2. Test local access: `curl http://localhost:3001/health`
3. Test public access: 
   - `curl https://api.toastebikepolo.com/health`
   - `curl https://api.toastebikepolo.ca/health`

## Troubleshooting

### If services are not accessible:

1. **Check container status**: `docker-compose -p toaste ps`
2. **Check logs**: `docker-compose -p toaste logs -f`
3. **Check tunnel logs**: `docker-compose -p toaste logs cloudflared`
4. **Verify tunnel config**: Check Cloudflare dashboard tunnel status

### Common Issues:

- **Port conflicts**: Ensure ports 3001 and 8091 are not used by other services
- **Network issues**: Verify containers are on the `toaste-network`
- **Tunnel token**: Ensure `TOASTE_CLOUDFLARE_TUNNEL_TOKEN` is correct
- **DNS propagation**: Wait 5-10 minutes for DNS changes to propagate

## Security Notes

- PocketBase admin is accessible at `/pb/_/` - consider adding authentication
- API has rate limiting (100 requests per 15 minutes per IP)
- CORS is configured for `https://toastebikepolo.ca` only
