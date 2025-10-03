# Toasté Bike Polo API

A lightweight Node.js REST API with PocketBase backend for managing bike polo wheel cover orders.

## 🏗️ Architecture

```
Frontend (toastebikepolo.ca) → API (api.toastebikepolo.ca) → PocketBase → SQLite
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Raspberry Pi (or any Linux server)

### 1. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required environment variables:
- `PB_ENCRYPTION_KEY`: 32-character encryption key for PocketBase
- `POCKETBASE_ADMIN_EMAIL`: Admin email for PocketBase
- `POCKETBASE_ADMIN_PASSWORD`: Admin password for PocketBase

### 2. Deploy

```bash
# Make scripts executable
chmod +x deploy.sh manage.sh

# Deploy to your Raspberry Pi
./deploy.sh
```

### 3. Container Management

```bash
# Start services
./manage.sh start

# Stop services
./manage.sh stop

# Check status
./manage.sh status

# View logs
./manage.sh logs

# Clean up everything (with confirmation)
./manage.sh clean

# Verify isolation (safety check)
./verify-isolation.sh
```

### 4. Verify

- API Health: http://localhost:3001/health
- PocketBase Admin: http://localhost:8091/_/
- Production API: https://api.toastebikepolo.ca
- Production PocketBase: https://api.toastebikepolo.ca/pb/_/

## 📡 API Endpoints

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:orderCode` - Get order by code
- `PUT /api/orders/:orderCode/status` - Update order status

### Health

- `GET /health` - API health check

## 🗄️ Database Schema

### Orders Table
- `order_code` (text, unique)
- `customer_name` (text)
- `customer_email` (email)
- `shipping_address` (text)
- `notes` (text, optional)
- `order_date` (date)
- `status` (select: waiting_for_payment, to_produce, to_send, done, cancelled, refunded)
- `total_price_cad` (number)
- `tax_amount_cad` (number)

### Order Items Table
- `order` (relation to Orders)
- `spoke_count` (number: 32 or 36)
- `wheel_size` (text: 26, 650b, 700)
- `quantity` (number)
- `unit_price_cad` (number)

## 💰 Pricing Logic

- Base price: $40 CAD per cover
- Tax rate: 15% (Quebec)
- Discount: 5% for pairs (2+ covers of same configuration)

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## 📊 Monitoring

```bash
# View logs
./manage.sh logs

# Check container status
./manage.sh status

# Restart services
./manage.sh restart

# Or use docker-compose directly with project name
docker-compose -p toaste logs -f
docker-compose -p toaste ps
docker-compose -p toaste restart
```

## 🏷️ Project Isolation

All Toasté Bike Polo containers are isolated under the project name `toaste`:

- **Container Names**: `toaste-api`, `toaste-pocketbase`
- **Network**: `toaste-network`
- **Volume**: `toaste_pocketbase_data`
- **Labels**: All resources tagged with `com.toaste.project=toaste`

This ensures complete separation from other Docker Compose projects on your Raspberry Pi.

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet security headers
- Input validation
- Error handling

## 🌐 Production URLs

**International (.com):**
- Frontend: https://toastebikepolo.com
- API: https://api.toastebikepolo.com
- PocketBase Admin: https://api.toastebikepolo.com/pb/_/

**Canadian (.ca):**
- Frontend: https://toastebikepolo.ca
- API: https://api.toastebikepolo.ca
- PocketBase Admin: https://api.toastebikepolo.ca/pb/_/

## 🔗 Integration with Existing Infrastructure

This setup is completely isolated from your existing Raspberry Pi infrastructure:

### Port Conflicts Resolved
- **API**: Changed from port 3000 → 3001 (avoid conflicts)
- **PocketBase**: Changed from port 8090 → 8091 (avoid conflict with qBittorrent)

### Dedicated Cloudflare Tunnel
- **Own tunnel container**: `toaste-cloudflared`
- **Separate Cloudflare account**: Complete isolation
- **Direct routing**: No dependency on existing infrastructure

### Project Isolation
- All containers prefixed with `toaste-`
- Isolated network: `toaste-network`
- Isolated volume: `toaste_pocketbase_data`
- **No conflicts** with existing services
- **Independent deployment** and management

### Safety Features
- **Container isolation**: Only affects containers with `toaste-` prefix
- **Safety checks**: Scripts verify isolation before operations
- **Confirmation prompts**: Destructive operations require confirmation
- **Transparency**: Shows what other containers are running
- **Verification script**: `./verify-isolation.sh` to check isolation
