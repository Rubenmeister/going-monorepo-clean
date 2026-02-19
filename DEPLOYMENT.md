# Going Platform - Deployment Guide

## Overview

This guide covers deployment of the Going Platform across different environments:
- **Development**: Docker Compose (local)
- **Staging**: Kubernetes (cloud)
- **Production**: Kubernetes (cloud)

## Local Development with Docker Compose

### Prerequisites
- Docker & Docker Compose 2.0+
- Node.js 18+ (for hot reload)

### Quick Start
```bash
# 1. Create .env file with secrets
cp .env.example .env
# Edit .env and set:
# - MONGO_ADMIN_PASSWORD=<strong_password>
# - REDIS_PASSWORD=<strong_password>
# - JWT_SECRET=<32+ character secret>

# 2. Start services
docker-compose up -d

# 3. Services available at:
# - API Gateway: http://localhost:3000
# - API Docs: http://localhost:3000/docs
# - MongoDB: localhost:27017 (auth required)
# - Redis: localhost:6379 (password required)

# 4. Stop services
docker-compose down -v
```

### Service-Specific Database Access
```bash
# Connect to MongoDB with auth
mongosh "mongodb://admin:<password>@localhost:27017/admin"

# Switch to service database
use user_db
db.auth('user_service', '<password>')

# Connect to Redis
redis-cli
> AUTH <password>
```

## Environment Configuration

### Required Environment Variables

**All Services:**
```env
NODE_ENV=development|staging|production
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug|info|warn|error
```

**Authentication:**
```env
JWT_SECRET=your_32_character_minimum_secret_key_here
JWT_EXPIRES_IN=24h
```

**Database (Service-Specific):**
```env
# Format: mongodb://username:password@host:port/database?authSource=admin
USER_DB_URL=mongodb://user_service:password@mongodb:27017/user_db?authSource=admin
PAYMENT_DB_URL=mongodb://payment_service:password@mongodb:27017/payment_db?authSource=admin
# ... etc for other services
```

**Redis (Tracking & Transport Services):**
```env
REDIS_URL=redis://:password@localhost:6379
```

**External Services:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Secure Secrets Management

In production, use one of:
1. **Kubernetes Secrets** (built-in)
2. **HashiCorp Vault** (recommended)
3. **AWS Secrets Manager**
4. **Google Secret Manager**

### Environment-Specific Configuration

```
/
├── .env                          # Development (git ignored)
├── .env.example                  # Template only
├── .env.schema.json              # Schema validation
├── k8s/
│   ├── base/                     # Base manifests
│   ├── overlays/
│   │   ├── development/          # Dev-specific overrides
│   │   ├── staging/              # Staging overrides
│   │   └── production/           # Prod-specific overrides
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes 1.24+ cluster
- kubectl configured
- Container registry access (Docker Hub, ECR, GCR, etc.)
- kustomize (for templating)

### Step 1: Build & Push Docker Images

```bash
# Build images (locally or in CI/CD)
docker build -t docker.io/yourorg/api-gateway:v1.0.0 api-gateway/
docker build -t docker.io/yourorg/user-auth-service:v1.0.0 user-auth-service/
# ... repeat for other services

# Push to registry
docker push docker.io/yourorg/api-gateway:v1.0.0
docker push docker.io/yourorg/user-auth-service:v1.0.0
# ... etc
```

### Step 2: Prepare Secrets

```bash
# Create namespace
kubectl create namespace going-production

# Create secrets for each service
kubectl create secret generic api-gateway-secrets \
  --from-literal=jwt-secret='your-32-char-secret' \
  --from-literal=db-url='mongodb://...' \
  -n going-production

# Or use a Vault integration
```

### Step 3: Deploy to Kubernetes

```bash
# Deploy using kustomize overlays
kubectl apply -k k8s/overlays/production/

# Verify deployments
kubectl get deployments -n going-production
kubectl get pods -n going-production
kubectl get services -n going-production

# Check logs
kubectl logs deployment/api-gateway -n going-production
kubectl logs deployment/user-auth-service -n going-production

# Port forward for testing
kubectl port-forward svc/api-gateway 3000:80 -n going-production
# Access: http://localhost:3000/docs
```

### Step 4: Set Up Ingress & TLS

```bash
# Install cert-manager (if not present)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Ingress
kubectl apply -f k8s/base/ingress.yaml -n going-production

# Verify TLS certificate
kubectl describe certificate going-tls -n going-production
```

## Database Migrations

### Mongoose Schema Migrations

```bash
# View pending migrations
npm run migrate:status -- user-auth-service

# Run migrations
npm run migrate:up -- user-auth-service

# Rollback migrations
npm run migrate:down -- user-auth-service
```

## Monitoring & Observability

### Health Checks

```bash
# Service health
curl http://localhost:3000/health

# Service readiness
curl http://localhost:3000/readiness

# Swagger docs
curl http://localhost:3000/docs
```

### Logs

```bash
# Docker Compose logs
docker-compose logs -f api-gateway

# Kubernetes logs
kubectl logs -f deployment/api-gateway -n going-production

# Streamed logs (all containers)
kubectl logs -f deployments --all-namespaces
```

### Metrics

(Optional - Prometheus setup):
```bash
# Metrics endpoint
curl http://localhost:3000/metrics
```

## Troubleshooting

### Services can't connect to MongoDB
```bash
# Check MongoDB health
docker-compose ps mongodb
docker-compose logs mongodb

# Verify auth credentials
docker-compose exec mongodb mongosh --authenticationDatabase admin
> db.auth('admin', 'your_password')
```

### Kubernetes pods in CrashLoopBackOff
```bash
# Check pod logs
kubectl describe pod <pod-name> -n going-production
kubectl logs <pod-name> -n going-production

# Check resource limits
kubectl describe deployment <service> -n going-production

# Check environment variables
kubectl exec <pod-name> -n going-production -- env | grep DB_URL
```

### High latency or timeouts
```bash
# Check service endpoints
kubectl get endpoints -n going-production

# Test service connectivity
kubectl run -it debug --image=curlimages/curl --restart=Never -- \
  curl http://api-gateway.going-production.svc.cluster.local/health
```

## Rollback Procedures

### Kubernetes Rollback
```bash
# View deployment history
kubectl rollout history deployment/api-gateway -n going-production

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n going-production

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway --to-revision=2 -n going-production
```

## Security Checklist

- [ ] All services use HTTPS in production
- [ ] CORS is restricted to known domains
- [ ] JWT secrets rotated regularly
- [ ] Database credentials stored in secrets manager
- [ ] Network policies restrict inter-service traffic
- [ ] Pod security policies enforced
- [ ] RBAC configured per service
- [ ] Audit logging enabled
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting configured

## Additional Resources

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/security/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [MongoDB Production Checklist](https://docs.mongodb.com/manual/administration/production-checklist-standalone/)
- [Docker Security](https://docs.docker.com/engine/security/)
