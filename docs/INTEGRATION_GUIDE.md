# Going Platform - Integration Guide

Complete guide for integrating all advanced features into your deployment.

---

## 1. Services Integration

### 1.1 Add AdvancedFeaturesModule to App

```typescript
// api-gateway/src/app.module.ts

import { Module } from '@nestjs/common';
import AdvancedFeaturesModule from './advanced-features.module';

@Module({
  imports: [
    AdvancedFeaturesModule, // Add this
    // ... other modules
  ],
})
export class AppModule {}
```

### 1.2 Initialize Sentry in Main

```typescript
// api-gateway/src/main.ts

import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Initialize Sentry
  if (configService.get('SENTRY_ENABLED')) {
    Sentry.init({
      dsn: configService.get('SENTRY_DSN'),
      environment: configService.get('SENTRY_ENVIRONMENT'),
      tracesSampleRate: 0.1,
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.errorHandler());
  }

  const port = configService.get('API_GATEWAY_PORT', 3000);
  await app.listen(port);
}

bootstrap();
```

---

## 2. Environment Configuration

### 2.1 Copy Environment Template

```bash
# Copy .env.example to .env files for each environment
cp .env.example .env.production
cp .env.example .env.staging
cp .env.example .env.development

# Edit each file with real values
nano .env.production
```

### 2.2 Generate Secrets

```bash
#!/bin/bash
# generate-secrets.sh

# JWT Secret (min 32 chars)
JWT_SECRET=$(openssl rand -base64 48)
echo "JWT_SECRET=$JWT_SECRET"

# MongoDB Password
MONGODB_PASSWORD=$(openssl rand -base64 32)
echo "MONGODB_PASSWORD=$MONGODB_PASSWORD"

# Redis Password
REDIS_PASSWORD=$(openssl rand -base64 32)
echo "REDIS_PASSWORD=$REDIS_PASSWORD"

# Sentry Release
SENTRY_RELEASE=$(git rev-parse --short HEAD)
echo "SENTRY_RELEASE=$SENTRY_RELEASE"
```

### 2.3 Key Integrations to Configure

#### Sentry

1. Create account at sentry.io
2. Create project for your organization
3. Get DSN from Settings → Projects → [Your Project]
4. Set `SENTRY_DSN` in .env.production

#### PagerDuty

1. Create account at pagerduty.com
2. Create Service for your team
3. Get API Key from User Settings → API Access Keys
4. Get Service ID from Service Settings
5. Create Escalation Policy and get ID
6. Set these in .env.production:
   ```
   PAGERDUTY_API_KEY=your_api_key
   PAGERDUTY_SERVICE_ID=your_service_id
   PAGERDUTY_ESCALATION_POLICY_ID=your_escalation_policy_id
   ```

#### Slack

1. Create workspace at slack.com
2. Create bot at api.slack.com/apps
3. Enable Bot Token Scopes:
   - chat:write
   - channels:manage
   - users:read
   - reactions:write
4. Install bot to workspace
5. Get tokens:
   - Slack Bot Token (xoxb-)
   - Slack App Token (xapp-)
   - Signing Secret from Settings
6. Set these in .env.production:
   ```
   SLACK_BOT_TOKEN=xoxb-your-token
   SLACK_APP_TOKEN=xapp-your-token
   SLACK_SIGNING_SECRET=your_signing_secret
   ```

#### Snyk

1. Create account at snyk.io
2. Connect GitHub/GitLab
3. Get API token from Account Settings
4. Set `SNYK_TOKEN` in .env.production

#### SonarQube

1. Deploy SonarQube server
2. Create project and get token
3. Set in .env.production:
   ```
   SONAR_HOST_URL=http://sonarqube:9000
   SONAR_LOGIN=your_token
   ```

---

## 3. Docker Compose Setup

### 3.1 Add Services to docker-compose.yml

```yaml
version: '3.8'

services:
  # API Gateway with advanced features
  api-gateway:
    image: going-platform:latest
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - MONGODB_URL=mongodb://admin:password@mongodb:27017/going-platform
      - SENTRY_ENABLED=true
      - RATE_LIMIT_ENABLED=true
      - CACHE_ENABLED=true
    depends_on:
      - mongodb
      - redis
      - prometheus
      - grafana

  # Existing services...
  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3100:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
```

### 3.2 Start Services

```bash
# Start all services
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check logs
docker-compose logs -f api-gateway
docker-compose logs -f redis
docker-compose logs -f mongodb
```

---

## 4. API Gateway Middleware Configuration

### 4.1 Rate Limiting Middleware

```typescript
// Automatically applied when RATE_LIMIT_ENABLED=true
// Request headers modified:
// - X-RateLimit-Limit: max requests
// - X-RateLimit-Remaining: requests left
// - X-RateLimit-Reset: reset timestamp
// - X-RateLimit-RetryAfter: retry after seconds (on 429)

// Example response on rate limit exceeded:
// HTTP 429 Too Many Requests
// X-RateLimit-Remaining: 0
// X-RateLimit-Reset: 1708620000
// X-RateLimit-RetryAfter: 60
// {
//   statusCode: 429,
//   message: "User rate limit exceeded for POST /api/rides/request",
//   retryAfter: 60,
//   timestamp: "2026-02-22T10:00:00Z"
// }
```

### 4.2 Performance Monitoring Middleware

```typescript
// Automatically applied when METRICS_ENABLED=true
// Tracks:
// - Request duration (histogram)
// - Request count (counter)
// - Error count (counter)
// - Response sizes

// Metrics available at /metrics endpoint
// Example:
// http_request_duration_seconds_bucket{le="0.1",path="/api/rides",method="POST"} 45
// http_request_duration_seconds_bucket{le="0.5",path="/api/rides",method="POST"} 98
// http_request_duration_seconds_bucket{le="1",path="/api/rides",method="POST"} 100
```

---

## 5. Alert Configuration

### 5.1 Sentry Webhook Setup

1. Go to Sentry Project Settings → Integrations
2. Add Generic Webhook Integration
3. Set Webhook URL: `https://your-domain.com/api/webhooks/sentry`
4. Enable Alert Rules:
   - Project Error Rate
   - Issue Frequency
   - Issue Regression

### 5.2 Alert Flow Diagram

```
Sentry Alert
    ↓
Sentry Webhook → /api/webhooks/sentry
    ↓
Alert Aggregation Service (deduplicate)
    ↓
Sentry Alerts Integration
    ├→ PagerDuty Service (create incident)
    ├→ Slack Service (send alert)
    └→ Alert Workflow Management (escalation)
```

### 5.3 Escalation Process

```
Alert Created (new)
    ↓ 5 minutes (for critical alerts)
Alert Escalated Level 1 → @team-lead in Slack
    ↓ 5 minutes
Alert Escalated Level 2 → @manager in Slack + PagerDuty page
    ↓ 5 minutes
Alert Escalated Level 3 → @director in Slack + PagerDuty page
    ↓ 5 minutes
Alert Escalated Level 4 → @vp in Slack + PagerDuty critical
```

---

## 6. Performance Baselines

### 6.1 Establish Initial Baselines

```bash
# Run normal load test to establish baseline
npm run load:test:baseline

# This will:
# 1. Run 30-minute test with 100 concurrent users
# 2. Collect metrics for last 20 minutes (steady state)
# 3. Save baseline to __tests__/load/baselines/
# 4. Display baseline values
```

### 6.2 Monitor Against Baselines

```bash
# Run load test and compare against baseline
npm run load:test

# If regression detected:
# 1. Email alert sent to ops team
# 2. GitHub PR comment with comparison
# 3. Slack notification in #performance
# 4. PagerDuty incident created (if severe)
```

---

## 7. Database Optimization

### 7.1 Enable Query Monitoring

```env
# In .env.production
MONGODB_ENABLE_PROFILING=true
MONGODB_SLOW_QUERY_THRESHOLD=200
```

### 7.2 Create Indexes

```bash
# Connect to MongoDB
mongo -u admin -p $MONGODB_PASSWORD

# Enable profiling
db.setProfilingLevel(1, { slowms: 200 })

# Create recommended indexes
db.rides.createIndex({ status: 1, createdAt: -1 })
db.rides.createIndex({ driverId: 1, status: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.payments.createIndex({ userId: 1, createdAt: -1 })
```

### 7.3 Monitor Slow Queries

```bash
# View slow queries
db.system.profile.find({ millis: { $gt: 200 } }).pretty()

# Get optimization recommendations
npm run db:optimize:analyze
```

---

## 8. Cache Optimization

### 8.1 Configure Redis

```env
# In .env.production
REDIS_EVICTION_POLICY=allkeys-lru
REDIS_MAX_MEMORY=1gb
```

### 8.2 Monitor Cache Performance

```bash
# Check cache statistics
curl http://localhost:9091/cache/stats

# Response:
# {
#   "hitRate": 0.78,
#   "totalKeys": 125000,
#   "memoryUsed": 450,
#   "hotKeys": [
#     { "key": "user:profile:123", "accessCount": 5000 },
#     ...
#   ]
# }
```

---

## 9. Security Hardening

### 9.1 Enable Security Scanning

```env
# In .env.production
DEPENDENCY_CHECK_ENABLED=true
SNYK_ENABLED=true
SONARQUBE_ENABLED=true
GITGUARDIAN_ENABLED=true
```

### 9.2 Run Security Checks

```bash
# Local security scan
npm run security:scan

# Results:
# ✅ npm audit: 0 vulnerabilities
# ✅ Snyk: 0 vulnerabilities
# ✅ Secrets scan: 0 secrets found
# ✅ SAST: 2 minor issues (review)
# ✅ License compliance: OK
```

### 9.3 Set up CI/CD Security Scanning

GitHub Actions workflow already configured in `.github/workflows/security-scanning.yml`

Triggers on:

- Every pull request
- Push to main branch
- Daily schedule (2 AM UTC)

---

## 10. Monitoring & Alerting

### 10.1 Access Grafana Dashboards

```
http://localhost:3100
Username: admin
Password: $GRAFANA_ADMIN_PASSWORD

Dashboards:
- API Gateway Performance
- Database Query Performance
- Cache Performance
- Service Health Overview
```

### 10.2 Set Up Grafana Alerts

1. Go to Dashboards → Choose dashboard
2. Click panel → Edit → Alert tab
3. Set threshold for alert
4. Configure notification channel (Slack, PagerDuty, etc.)

### 10.3 Monitor Metrics

```bash
# View Prometheus metrics
curl http://localhost:9090/api/v1/query?query=going_platform_http_request_duration_seconds

# Example output:
# {
#   "data": {
#     "result": [
#       {
#         "metric": { "path": "/api/rides", "method": "POST" },
#         "value": [1708620000, "0.45"]
#       }
#     ]
#   }
# }
```

---

## 11. Troubleshooting

### Issue: Rate Limiting Not Working

```bash
# Check if Redis is running
redis-cli ping

# Check if rate limiting is enabled
curl http://localhost:3000/config | grep RATE_LIMIT_ENABLED

# Check token bucket state
redis-cli HGETALL "rate_limit:user:123"
```

### Issue: Alerts Not Reaching Slack

```bash
# Verify Slack bot token
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN"

# Check alert aggregation
curl http://localhost:3000/api/webhooks/alerts/stats

# View alert logs
docker logs api-gateway | grep -i slack
```

### Issue: Database Queries Slow

```bash
# Check slow query log
docker exec mongodb mongo -u admin -p $MONGODB_PASSWORD \
  --eval "db.system.profile.find({ millis: { \$gt: 200 } }).count()"

# Analyze slow queries
npm run db:optimize:analyze

# Check connection pool
docker logs mongodb | grep "connection"
```

---

## 12. Production Deployment Checklist

- [ ] All environment variables configured (.env.production)
- [ ] Secrets stored in vault/secrets manager (not in files)
- [ ] Sentry project created and DSN configured
- [ ] PagerDuty service created and escalation policy configured
- [ ] Slack workspace setup with bot and channels created
- [ ] Database backups configured and tested
- [ ] Redis persistence enabled (appendonly yes)
- [ ] Prometheus retention policy configured (30+ days)
- [ ] Grafana dashboards imported and alerts configured
- [ ] Load baselines established
- [ ] Security scanning enabled in CI/CD
- [ ] Rate limiting thresholds reviewed
- [ ] Cache TTL values tuned
- [ ] Database indexes created
- [ ] Health checks configured and tested
- [ ] Incident runbook updated with new procedures
- [ ] Team trained on new alert escalation process
- [ ] Monitoring dashboard access shared with team
- [ ] On-call rotation configured in PagerDuty
- [ ] Deployment approved by security team

---

**Last Updated**: 2026-02-22
**Version**: 1.0
**Maintained By**: Going Platform Team
