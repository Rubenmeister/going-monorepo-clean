# Pre-Production Checklist

## ✅ Already Completed

- [x] CI/CD pipeline configured
- [x] Environment configs created
- [x] RBAC system implemented
- [x] API client with interceptors
- [x] PWA icons and offline cache
- [x] Error boundaries
- [x] 3 apps structured (marketplace, admin, enterprise)

## 🔧 Action Items Before Launch

### 1. Secrets Configuration

- [ ] Update `config/.env.production` with real values
- [ ] Set up secrets in deployment platform (Vercel/AWS/GCP)
- [ ] Configure real JWT_SECRET (use `openssl rand -base64 32`)
- [ ] Set real DATABASE_URL for production DB

### 2. Database

- [ ] Run `npm run prisma:migrate:prod` on production DB
- [ ] Verify all migrations applied correctly
- [ ] Set up database backups

### 3. Observability

- [ ] Configure Jaeger/OTLP endpoint in production
- [ ] Set up alerts for health check failures
- [ ] Create basic monitoring dashboard

### 4. Manual Testing

- [ ] Test login flow end-to-end
- [ ] Test role-based access (customer vs provider)
- [ ] Test PWA installation on mobile
- [ ] Verify offline functionality

### 5. Deployment

- [ ] Build and deploy api-gateway
- [ ] Build and deploy frontend-webapp
- [ ] Verify health endpoints respond
- [ ] Test CORS with production domain

## 📋 Quick Commands

```bash
# Build all services
npx nx run-many -t build --all

# Run E2E tests
npx nx e2e frontend-webapp-e2e

# Deploy Prisma migrations to production
npm run prisma:migrate:prod

# Generate new JWT secret
openssl rand -base64 32
```
