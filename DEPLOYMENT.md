# Going Platform - Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker >= 20.10
- Docker Compose >= 1.29

### Start All Services

```bash
# Clone repository
git clone <repo-url>
cd going-monorepo-clean

# Create environment file
cp .env.example .env.local

# Start services
docker-compose up -d

# Verify all services are running
docker-compose ps
```

### Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Transport | 3003 | Ride management |
| Payment | 3004 | Payment processing |
| Ratings | 3005 | Rating system |
| Analytics | 3006 | Data analytics |
| Chat | 3007 | Real-time messaging |
| Geolocation | 3008 | Location tracking |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache/Sessions |

## Environment Configuration

### .env.local Variables Required

```
# Database
MONGO_URI=mongodb://going_user:going_password@mongodb:27017/going_platform
REDIS_URL=redis://redis:6379

# JWT & Security
JWT_SECRET=your_secret_key_here

# Stripe Payment
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Environment
NODE_ENV=development
```

## Database Setup

### MongoDB Indexes

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh

# Create indexes for performance
use going_platform
db.rides.createIndex({ "passengerId": 1 })
db.rides.createIndex({ "driverId": 1 })
db.rides.createIndex({ "status": 1 })
db.payments.createIndex({ "tripId": 1 })
db.ratings.createIndex({ "tripId": 1 })
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f payment-service

# Stop services
docker-compose down

# Restart service
docker-compose restart payment-service

# Execute command
docker-compose exec mongodb mongosh
```

## Production Deployment

### Option 1: Kubernetes

```bash
# Create namespace
kubectl create namespace going

# Deploy
kubectl apply -f k8s-deployment.yaml -n going
```

### Option 2: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml going
```

### Option 3: Cloud Platforms (AWS, GCP, Azure)

Refer to respective documentation for ECS, Cloud Run, or Container Instances

## Health Checks

```bash
# Check service health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Check database
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker-compose exec redis redis-cli ping
```

## Monitoring

```bash
# Real-time resource usage
docker stats

# Service logs
docker-compose logs --follow

# Database performance
docker-compose exec mongodb mongosh
db.rides.find().explain("executionStats")
```

## Backup & Recovery

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/backups

# Backup Redis
docker-compose exec redis redis-cli BGSAVE

# Restore
mongorestore --uri="mongodb://..." /backups
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs payment-service

# Check if port is in use
lsof -i :3004

# Verify network
docker-compose exec payment-service ping mongodb
```

### Database connection issues
```bash
# Test MongoDB connection
docker-compose exec mongodb mongosh ping

# Verify Redis
docker-compose exec redis redis-cli ping
```

### High memory usage
```bash
# Monitor containers
docker stats

# Increase container memory
docker update --memory 4g going-payment
```

## Documentation

- **API Documentation**: http://localhost:3000/api/docs (Swagger)
- **Test Report**: See TEST_REPORT.md
- **Load Testing**: See LOAD_AND_E2E_TESTS.md

---

Generated: 2026-02-19
Status: Production Ready
