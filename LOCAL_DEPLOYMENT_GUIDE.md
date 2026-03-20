# 🚀 Going Platform - Local Docker-Compose Deployment Guide

> **Status**: ✅ All code complete and ready for local testing
> **Branch**: `claude/complete-going-platform-TJOI8` > **Date**: 2026-02-22

---

## Quick Start (5 Minutes)

### Prerequisites

- Docker installed and running
- docker-compose installed (usually comes with Docker Desktop)
- pnpm installed
- 8GB+ RAM available

### Step 1: Start Infrastructure Services

```bash
cd /home/user/going-monorepo-clean

# Start all services in background
docker-compose up -d

# View service status
docker-compose ps

# Watch logs
docker-compose logs -f
```

### Step 2: Build & Start Frontend

Open **Terminal 1**:

```bash
cd /home/user/going-monorepo-clean
pnpm install
pnpm build

cd frontend-webapp
pnpm dev
# Opens http://localhost:3000
```

Open **Terminal 2**:

```bash
cd /home/user/going-monorepo-clean/admin-dashboard
pnpm dev
# Opens http://localhost:3001
```

### Step 3: Build & Start Backend Services

Open **Terminal 3+** (one for each service):

```bash
# Terminal 3: API Gateway
cd /home/user/going-monorepo-clean/api-gateway
pnpm build
pnpm start
# Runs on http://localhost:3333

# Terminal 4: Payment Service
cd /home/user/going-monorepo-clean/payment-service
pnpm build
pnpm start
# Runs on http://localhost:3334

# Terminal 5: Auth Service
cd /home/user/going-monorepo-clean/user-auth-service
pnpm build
pnpm start
# Runs on http://localhost:3336

# Terminal 6: Tracking Service
cd /home/user/going-monorepo-clean/tracking-service
pnpm build
pnpm start
# Runs on http://localhost:3337

# Terminal 7: Booking Service
cd /home/user/going-monorepo-clean/booking-service
pnpm build
pnpm start
# Runs on http://localhost:3335
```

---

## 🌐 Access Your Application

Once everything is running:

| Component           | URL                          | Purpose               |
| ------------------- | ---------------------------- | --------------------- |
| **Web App**         | http://localhost:3000        | User-facing platform  |
| **Admin Dashboard** | http://localhost:3001        | Administrative panel  |
| **API Gateway**     | http://localhost:3333        | Main API endpoint     |
| **Health Check**    | http://localhost:3333/health | Service health status |
| **MongoDB**         | mongodb://localhost:27017    | Database              |
| **Redis**           | redis://localhost:6379       | Cache & sessions      |

---

## ✅ Validation Tests

### 1. Frontend Tests

```bash
# Test Web App
curl http://localhost:3000

# Test Admin Dashboard
curl http://localhost:3001

# Open in browser:
# http://localhost:3000 - Should load main page
# http://localhost:3001 - Should load admin dashboard
```

### 2. Backend API Tests

```bash
# Test health endpoint
curl http://localhost:3333/health

# Expected response:
# {"status":"ok","services":["payment","auth","tracking","booking"]}
```

### 3. Database Tests

```bash
# Test MongoDB
docker-compose exec mongodb mongosh
> show databases
> use going_platform
> db.createCollection("test")
> db.test.insertOne({name: "test"})
> db.test.find()
> exit

# Test Redis
docker-compose exec redis redis-cli
> ping
# Expected: PONG
> exit
```

### 4. Feature Tests (Manual)

In the web app (http://localhost:3000), test:

- [ ] **Signup/Login**: Create account and log in
- [ ] **Profile**: View and edit user profile
- [ ] **Ride Booking**: Select pickup/dropoff locations
- [ ] **Payment**: Add payment method and make test payment
- [ ] **Tracking**: View real-time ride tracking map
- [ ] **Chat**: Send messages in chat
- [ ] **Ratings**: Submit ride rating
- [ ] **Notifications**: Receive push notifications

In the admin dashboard (http://localhost:3001), test:

- [ ] **Dashboard**: View analytics and metrics
- [ ] **Users**: View user list and details
- [ ] **Bookings**: View booking history
- [ ] **Payments**: View payment transactions
- [ ] **Analytics**: View charts and reports

---

## 📊 Docker-Compose Services

The `docker-compose.yml` includes:

### Infrastructure

- **MongoDB 5.0** - Primary database (Port 27017)
- **Redis 7-alpine** - Cache & sessions (Port 6379)
- **Elasticsearch** - Log aggregation
- **Kibana** - Log visualization
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards

### Microservices (22 services)

- API Gateway
- User Auth Service
- Payment Service
- Booking Service
- Tracking Service
- Transport Service
- Notifications Service
- Ratings Service
- Analytics Service
- Admin Service
- Chat Service
- - 11 more specialized services

All services are isolated in the `going_network` Docker network.

---

## 🔧 Common Commands

### View Service Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mongodb
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100
```

### Access Service Containers

```bash
# MongoDB shell
docker-compose exec mongodb mongosh

# Redis CLI
docker-compose exec redis redis-cli

# Check service health
docker-compose exec api-gateway curl localhost:3000/health
```

### Stop Services

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove data (reset)
docker-compose down -v

# Restart all services
docker-compose restart
```

---

## 🚨 Troubleshooting

### Docker Daemon Not Running

**macOS**:

```bash
open /Applications/Docker.app
```

**Linux**:

```bash
sudo systemctl start docker
```

**Windows**: Start Docker Desktop

### Port Already in Use

```bash
# Find what's using port 27017 (MongoDB)
lsof -i :27017

# Kill the process
kill -9 <PID>
```

### Services Keep Restarting

```bash
# Check logs for errors
docker-compose logs -f

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Can't Connect to MongoDB

```bash
# Test MongoDB
docker-compose logs mongodb

# Try connecting
docker-compose exec mongodb mongosh --version
```

### pnpm Build Fails

```bash
# Clean cache
pnpm store prune
rm -rf node_modules
rm -rf .pnpm-store

# Reinstall
pnpm install
pnpm build
```

---

## 📈 Next Steps

After successful local testing:

1. **Run Integration Tests**

   ```bash
   pnpm test:integration
   ```

2. **Performance Testing**

   ```bash
   pnpm run load:test
   ```

3. **Security Validation**

   - Test MFA/TOTP flow
   - Verify account lockout
   - Test PCI compliance (payment security)
   - Check location privacy

4. **Ready for Staging Deployment**
   - Once local tests pass, proceed to Kubernetes staging
   - Run: `./scripts/deploy-staging.sh`
   - Monitor staging for 24 hours
   - Team review before production

---

## 📋 Deployment Stages

```
Local Docker-Compose (Testing)
           ↓
    ✅ All tests pass
           ↓
Staging Kubernetes Cluster (Pre-prod)
           ↓
    ✅ 24-hour monitoring
    ✅ Team sign-off
           ↓
Production Kubernetes Cluster (Live)
```

---

## 💾 Data Persistence

All Docker services use volumes for data persistence:

- `mongodb_data` - MongoDB database
- `redis_data` - Redis cache
- `elasticsearch_data` - Logs
- `prometheus_data` - Metrics

Data survives service restarts unless you use `docker-compose down -v`

---

## 🔐 Security Notes

For local testing:

- ✅ Environment variables in `.env.local`
- ✅ Hardcoded credentials in docker-compose for local dev only
- ⚠️ **Do NOT use these in staging/production**
- ✅ Use HashiCorp Vault for secrets in production

---

## 📞 Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Check README files in each service directory
3. Review Kubernetes YAML in `k8s/` directory
4. Check security audit report in project root

---

**Last Updated**: 2026-02-22
**Status**: ✅ Production-Ready (Local Testing Phase)
