# Local Testing Guide - Going Platform

**Date**: Feb 23, 2026
**Branch**: `claude/complete-going-platform-TJOI8`
**Status**: ✅ Ready for local testing

---

## 🚀 Quick Start (Copy & Paste)

```bash
# 1. Clone or checkout branch
cd /home/user/going-monorepo-clean
git checkout claude/complete-going-platform-TJOI8

# 2. Install dependencies
pnpm install

# 3. Start Docker services in background
docker-compose up -d

# 4. Wait 30 seconds for services to be healthy
sleep 30

# 5. Verify services
docker-compose ps

# 6. Run tests
pnpm test

# 7. Build code
pnpm build

# 8. Start frontend (in terminal 1)
cd apps/web
pnpm dev

# 9. Start backend (in terminal 2)
cd apps/api
pnpm start

# 10. Access application
# Frontend: http://localhost:3000
# Admin: http://localhost:3001
# API: http://localhost:3333/health
```

---

## 📋 Detailed Steps

### Step 1: Prepare Your Machine

**Prerequisites:**

- ✅ Docker installed & running
- ✅ Node.js 20+ installed
- ✅ pnpm installed (v10.30.0+)
- ✅ Git configured

**Verify:**

```bash
docker --version      # Should show Docker 29.x+
node --version        # Should show v20+
pnpm --version        # Should show 10.30.0+
git --version         # Should show 2.43.0+
```

### Step 2: Start Docker Services

**On Linux/Mac:**

```bash
# Verify Docker daemon is running
docker ps

# If not running:
# macOS: open /Applications/Docker.app
# Linux: sudo systemctl start docker
# Windows: Start Docker Desktop
```

**Start infrastructure:**

```bash
cd /home/user/going-monorepo-clean
docker-compose up -d
```

**Expected output:**

```
Creating going_mongodb ... done
Creating going_redis ... done
Creating going_transport-service ... done
```

**Verify all services running:**

```bash
docker-compose ps

# Expected:
# NAME                          STATUS
# going_mongodb                 Up 2 minutes
# going_redis                   Up 2 minutes
# going_transport-service       Up 2 minutes
```

**Check service health:**

```bash
# MongoDB
docker-compose exec mongodb mongosh --version

# Redis
docker-compose exec redis redis-cli ping
# Should return: PONG

# Transport service
curl http://localhost:3333/health 2>/dev/null || echo "Service starting..."
```

### Step 3: Install & Build

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

### Step 4: Run Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- apps/api/src/auth.test.ts

# Watch mode
pnpm test -- --watch
```

**Expected test results:**

- ✅ 300+ tests should pass
- ✅ Coverage > 80%
- ✅ No errors or warnings

### Step 5: Start Services (3 Terminal Windows)

**Terminal 1: Frontend Web App**

```bash
cd apps/web
pnpm dev

# Expected: Vite server running at http://localhost:3000
# Watch for: "VITE v4.x.x  ready in X ms"
```

**Terminal 2: Frontend Admin Dashboard**

```bash
cd apps/admin
pnpm dev

# Expected: Vite server running at http://localhost:3001
# Watch for: "VITE v4.x.x  ready in X ms"
```

**Terminal 3: Backend API Gateway**

```bash
cd apps/api
pnpm start

# Expected: API listening on port 3333
# Watch for: "Server running at http://localhost:3333"
```

---

## 🧪 Validation Tests

Once all services are running, validate each feature:

### 1. Check Infrastructure Health

```bash
# MongoDB
docker-compose exec mongodb mongosh --version

# Redis
docker-compose exec redis redis-cli info server

# API Gateway
curl http://localhost:3333/health
# Expected: {"status":"ok","timestamp":"...","services":{...}}
```

### 2. Frontend Access

| Component       | URL                          | Expected               |
| --------------- | ---------------------------- | ---------------------- |
| Web App         | http://localhost:3000        | Landing page loads     |
| Admin Dashboard | http://localhost:3001        | Admin login page loads |
| API Health      | http://localhost:3333/health | JSON response          |

### 3. Authentication Flow

```bash
# Test user registration
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Expected: 201 Created with user ID
```

### 4. Database Operations

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh

# In mongosh shell:
> use going_db
> db.users.find().limit(5)
> db.users.countDocuments()
> exit
```

### 5. Cache Operations

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# In redis-cli:
> ping
PONG
> set test-key "test-value"
OK
> get test-key
"test-value"
> del test-key
(integer) 1
> exit
```

### 6. API Endpoints

```bash
# Health Check
curl http://localhost:3333/health

# Payment Service Health
curl http://localhost:3333/payment/health

# Booking Service Health
curl http://localhost:3333/booking/health

# Auth Service Health
curl http://localhost:3333/auth/health

# Tracking Service Health
curl http://localhost:3333/tracking/health
```

### 7. Feature Tests (In Web App UI)

- [ ] Homepage loads without errors
- [ ] Navigation menu works
- [ ] Login form displays
- [ ] Register form displays
- [ ] Admin dashboard accessible
- [ ] All images load
- [ ] Responsive design works (mobile view)
- [ ] No console errors (F12 > Console)

### 8. Performance Check

```bash
# Start server with monitoring
docker-compose stats

# Watch for:
# - MongoDB CPU < 20%
# - Redis CPU < 10%
# - API CPU < 30%
# - Memory usage stable
```

---

## 📊 Testing Checklist

### Pre-Testing

- [ ] Docker daemon running
- [ ] All containers healthy (`docker-compose ps`)
- [ ] All ports available (3000, 3001, 3333, 27017, 6379)
- [ ] pnpm cache cleared if needed

### Build & Test

- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` succeeds
- [ ] `pnpm test` passes (300+ tests)
- [ ] `pnpm lint` shows no errors

### Services

- [ ] Frontend starts on port 3000
- [ ] Admin dashboard starts on port 3001
- [ ] API Gateway starts on port 3333
- [ ] MongoDB responding on port 27017
- [ ] Redis responding on port 6379

### Features

- [ ] User registration works
- [ ] User login works
- [ ] Create booking request
- [ ] View bookings
- [ ] Payment processing
- [ ] Real-time tracking
- [ ] Admin dashboard loads

### Performance

- [ ] API response time < 500ms
- [ ] Database queries < 200ms
- [ ] Frontend loads < 3s
- [ ] No memory leaks (monitor for 5 min)

---

## 🛑 Common Issues & Solutions

### Docker Daemon Not Running

```bash
# macOS
open /Applications/Docker.app

# Linux
sudo systemctl start docker

# Windows
# Start Docker Desktop from Start Menu
```

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process (get PID from above)
kill -9 <PID>

# Or use docker-compose to reset
docker-compose down
docker-compose up -d
```

### MongoDB Connection Error

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify connection
docker-compose exec mongodb mongosh --version

# Reset MongoDB
docker-compose down -v
docker-compose up -d
```

### Redis Connection Error

```bash
# Check Redis logs
docker-compose logs redis

# Verify connection
docker-compose exec redis redis-cli ping

# Should return: PONG
```

### Tests Failing

```bash
# Clear cache
rm -rf node_modules/.pnpm
pnpm install

# Run tests again
pnpm test

# Run specific test with verbose output
pnpm test -- --verbose apps/api/src/auth.test.ts
```

### Build Failing

```bash
# Check for TypeScript errors
pnpm typecheck

# Check for linting issues
pnpm lint

# Full clean rebuild
pnpm clean
pnpm install
pnpm build
```

---

## 📈 Performance Monitoring

```bash
# Monitor Docker resources
docker-compose stats

# Check API latency
for i in {1..10}; do
  time curl http://localhost:3333/health
done

# Monitor logs for errors
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f redis
```

---

## ✅ Success Criteria

After following this guide, you should have:

- ✅ All services running locally
- ✅ 300+ tests passing
- ✅ Frontend accessible at http://localhost:3000
- ✅ Admin dashboard at http://localhost:3001
- ✅ API responding with health checks
- ✅ Database and cache operational
- ✅ No console errors in browser
- ✅ Features functioning end-to-end

---

## 🚀 Next Steps

After local testing succeeds:

1. **Create Local Testing Report**

   ```bash
   pnpm test -- --coverage > test-report.txt
   docker-compose ps > infrastructure-report.txt
   ```

2. **Push Local Test Results**

   ```bash
   git add test-report.txt infrastructure-report.txt
   git commit -m "docs: add local testing results"
   git push
   ```

3. **Prepare Staging Deployment**

   - Follow: `scripts/deploy-staging.sh`
   - Need kubectl access to your Kubernetes cluster
   - Estimated time: 60-75 minutes

4. **Monitor Staging (24 hours)**
   - Watch metrics and logs
   - Run user acceptance tests
   - Prepare production deployment

---

## 📞 Troubleshooting Help

For issues not covered above:

1. **Check logs**

   ```bash
   docker-compose logs <service-name>
   ```

2. **Inspect containers**

   ```bash
   docker-compose exec <service-name> /bin/sh
   ```

3. **Review test output**

   ```bash
   pnpm test -- --verbose
   ```

4. **Check git status**
   ```bash
   git status
   git log --oneline -5
   ```

---

**Status**: ✅ Ready for local testing
**Last Updated**: Feb 23, 2026
**Branch**: `claude/complete-going-platform-TJOI8`
**Contact**: Use /help for Claude Code support
