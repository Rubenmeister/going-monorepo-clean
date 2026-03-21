# Staging Deployment Checklist - Going Platform

**Status**: Pre-Staging (66% Ready)  
**Target Deployment Date**: 2026-02-28  
**Environment**: Staging  
**Owner**: DevOps + Security Team

---

## 📋 Pre-Deployment Requirements

### Phase 1: Critical Security Fixes (P0) - **IN PROGRESS**

#### ✅ P0-1: Remove Hardcoded Secrets

- [x] Remove .env files from git version control
- [x] Create SECURITY_REMEDIATION.md
- [ ] Rotate all exposed secrets in external services
  - [ ] Generate new JWT_SECRET (64-byte)
  - [ ] Rotate STRIPE_SECRET_KEY in Stripe dashboard
  - [ ] Change MongoDB root password
  - [ ] Rotate any other exposed API keys
- [ ] Configure secrets manager for staging
  - [ ] Option A: HashiCorp Vault
  - [ ] Option B: AWS Secrets Manager
  - [ ] Option C: Azure Key Vault
  - [ ] Option D: Kubernetes Secrets (if using K8s)
- [ ] Update CI/CD pipeline to use secrets manager
- [ ] Test that services start with new credentials

**Effort**: 6-8 hours | **Owner**: Security Team + DevOps

---

#### ⏳ P0-2: Fix WebSocket CORS Configuration

**Files to update**:

- `api-gateway/src/tracking/tracking.gateway.ts`
- `tracking-service/src/infrastructure/gateways/socket-io-tracking.gateway.ts`
- Any other WebSocket gateways

**Changes**:

```typescript
// ❌ Before
@WebSocketGateway({ cors: { origin: '*' } })

// ✅ After
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
})
```

**Environment Variables**:

```env
# .env.staging
ALLOWED_ORIGINS=https://staging.going-platform.com,https://admin.staging.going-platform.com
WEBSOCKET_NAMESPACE=/tracking
```

**Testing**:

- [ ] WebSocket connects from allowed origin
- [ ] WebSocket rejects from unallowed origin
- [ ] CORS headers correct on WebSocket upgrade

**Effort**: 2-3 hours | **Owner**: Backend Team

---

#### ⏳ P0-3: Implement WebSocket Authentication

**File**: `tracking-service/src/infrastructure/gateways/location-tracking.gateway.ts`

**Current Code**:

```typescript
// TODO: Validate JWT token from handshake
```

**Required Implementation**:

```typescript
handleConnection(client: Socket) {
  const token = client.handshake.auth.token;

  try {
    const decoded = this.jwtService.verify(token);
    client.data.userId = decoded.sub;
    client.join(`user:${decoded.sub}`);
  } catch (error) {
    client.disconnect();
    throw new UnauthorizedException('Invalid token');
  }
}

handleDisconnect(client: Socket) {
  this.logger.log(`Client disconnected: ${client.id}`);
}
```

**Testing**:

- [ ] Valid JWT token → Connection allowed
- [ ] Invalid JWT token → Connection rejected
- [ ] Expired JWT token → Connection rejected
- [ ] No token → Connection rejected
- [ ] User can only access own data (socket rooms)

**Effort**: 4-5 hours | **Owner**: Backend Team

---

#### ⏳ P0-4: Remove eval() Usage

**File**: `libs/shared/ui/src/components/index.tsx:52`

**Current Code**:

```typescript
...eval(`({ ${baseStyles} ${sizeStyles} ${variantStyles} })`)
```

**Required Replacement** (safe alternative):

```typescript
// Option 1: Use object spread
const finalStyles = {
  ...baseStyles,
  ...sizeStyles,
  ...variantStyles,
};

// Option 2: Use Object.assign
const finalStyles = Object.assign({}, baseStyles, sizeStyles, variantStyles);
```

**Testing**:

- [ ] Component renders with correct styles
- [ ] No console errors or warnings
- [ ] Security audit passes (no code injection)

**Effort**: 1-2 hours | **Owner**: Frontend Team

---

#### ⏳ P0-5: Fix Docker Compose Default Passwords

**File**: `docker-compose.yml`

**Changes Required**:

```yaml
# ❌ Before (weak defaults)
MONGO_INITDB_ROOT_PASSWORD: going_password
JWT_SECRET: changeme_in_production
ELASTIC_PASSWORD: ElasticPassword123!

# ✅ After (require environment variables)
MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_ROOT_PASSWORD:?error}
JWT_SECRET: ${JWT_SECRET:?error}
ELASTIC_PASSWORD: ${ELASTICSEARCH_PASSWORD:?error}
```

**Required Environment Variables** (create `.env.staging`):

```bash
MONGODB_ROOT_PASSWORD=<generate-secure-password>
JWT_SECRET=<generate-64-byte-key>
ELASTICSEARCH_PASSWORD=<generate-secure-password>
GRAFANA_PASSWORD=<generate-secure-password>
REDIS_PASSWORD=<generate-secure-password>
```

**Script to generate**:

```bash
#!/bin/bash
echo "MONGODB_ROOT_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 64)"
echo "ELASTICSEARCH_PASSWORD=$(openssl rand -base64 32)"
echo "GRAFANA_PASSWORD=$(openssl rand -base64 16)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
```

**Testing**:

- [ ] Docker compose fails if environment variables missing
- [ ] Services start correctly with provided values
- [ ] Verify no hardcoded passwords in running containers

**Effort**: 1-2 hours | **Owner**: DevOps

---

#### ⏳ P0-6: Implement Account Lockout Redis Operations

**File**: `user-auth-service/src/infrastructure/services/account-lockout.service.ts`

**Current Issues** (7 TODO comments):

1. Line 43: `// TODO: Implement Redis lock logic`
2. Line 68: `// TODO: Check if account is locked in Redis`
3. Line 121: `// TODO: Delete from Redis`
4. And 4 more...

**Required Implementation**:

```typescript
async recordFailedAttempt(userId: string): Promise<number> {
  const key = `login_attempts:${userId}`;
  const attempts = await this.redisClient.incr(key);
  await this.redisClient.expire(key, 900); // 15 minutes
  return attempts;
}

async isAccountLocked(userId: string): Promise<boolean> {
  const key = `locked_account:${userId}`;
  const isLocked = await this.redisClient.exists(key);
  return isLocked > 0;
}

async lockAccount(userId: string): Promise<void> {
  const key = `locked_account:${userId}`;
  await this.redisClient.setex(key, 3600, '1'); // 1 hour
}

async resetLoginAttempts(userId: string): Promise<void> {
  const key = `login_attempts:${userId}`;
  await this.redisClient.del(key);
  // Also delete lock if exists
  const lockKey = `locked_account:${userId}`;
  await this.redisClient.del(lockKey);
}
```

**Testing**:

- [ ] Failed login increments counter
- [ ] 5 failed attempts lock account
- [ ] Locked account rejects login attempts
- [ ] Lock expires after 1 hour
- [ ] Successful login resets counter
- [ ] Admin can manually unlock account

**Effort**: 5-6 hours | **Owner**: Backend Team

---

### Phase 2: Major Issues (P1) - **NOT STARTED**

#### ⏳ P1-1: Add Database Query Pagination

**Files**: All `*.repository.ts` files (~50 files)

**Impact**: Prevents memory exhaustion from large result sets

**Pattern to implement**:

```typescript
// Before
const docs = await this.model.find({ userId }).sort({ createdAt: -1 }).exec();

// After
async findByUser(userId: string, limit = 20, offset = 0) {
  const docs = await this.model
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset * limit)
    .lean()
    .exec();

  const total = await this.model.countDocuments({ userId });

  return { docs, total, limit, offset };
}
```

**Testing**:

- [ ] Pagination works with default limit
- [ ] Custom limit respected
- [ ] Offset calculation correct
- [ ] Total count accurate
- [ ] Performance improved for large collections

**Effort**: 6-8 hours | **Owner**: Backend Team

---

#### ⏳ P1-2: Configure Redis Connection Pooling

**Files**: All Redis client initializations

**Current Issue**: No pooling, retry logic, or timeout configuration

**Required Configuration**:

```typescript
this.redisClient = redis.createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    connectTimeout: 5000,
    keepAlive: 30000,
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
});

this.redisClient.on('error', (error) => {
  this.logger.error('Redis connection error:', error);
});

this.redisClient.on('ready', () => {
  this.logger.log('Redis client ready');
});
```

**Testing**:

- [ ] Connection succeeds on startup
- [ ] Reconnects automatically on disconnection
- [ ] Requests queued during disconnection
- [ ] Timeout triggers correctly
- [ ] No memory leaks with repeated connections

**Effort**: 3-4 hours | **Owner**: Backend Team

---

#### ⏳ P1-3: Add MongoDB Indices

**Collections affected**: users, rides, payments, ratings

**Indices to create**:

```typescript
// In Mongoose schemas or migration script

// users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

// rides collection
db.rides.createIndex({ status: 1, createdAt: -1 });
db.rides.createIndex({ userId: 1, createdAt: -1 });
db.rides.createIndex({ driverId: 1, status: 1 });

// payments collection
db.payments.createIndex({ userId: 1, createdAt: -1 });
db.payments.createIndex({ status: 1 });

// ratings collection
db.ratings.createIndex({ rateeId: 1, createdAt: -1 });
db.ratings.createIndex({ raterId: 1 });
```

**Testing**:

- [ ] Indices created successfully
- [ ] Slow queries eliminated
- [ ] Index statistics collected
- [ ] Query plans verify index usage

**Effort**: 2-3 hours | **Owner**: Backend + DBA Team

---

#### ⏳ P1-4: Increase Test Coverage to 60%

**Current**: ~35% coverage  
**Target**: 60%+

**Priority test areas**:

1. Admin service (currently mocked, 0% coverage)
2. Payment service critical flows
3. Corporate auth implementations
4. WebSocket tracking

**Testing**:

- [ ] Run `npm run test:cov`
- [ ] All critical functions have unit tests
- [ ] All API endpoints have integration tests
- [ ] High-risk functions have >80% coverage

**Effort**: 8-10 hours | **Owner**: QA Team

---

#### ⏳ P1-5: Implement Circuit Breakers

**Files**: API Gateway service proxies

**Pattern**:

```typescript
import { CircuitBreaker } from '@nestjs/axios';

constructor(private httpService: HttpService) {}

async callService(url: string) {
  return this.httpService.get(url).pipe(
    timeout(5000),
    retry({ count: 3, delay: 1000 }),
    catchError((error) => {
      this.logger.error(`Service call failed: ${url}`, error);
      throw new ServiceUnavailableException();
    })
  );
}
```

**Testing**:

- [ ] Retries failed requests
- [ ] Fails after max retries
- [ ] Returns cached response if available
- [ ] Circuitbreaker opens after threshold

**Effort**: 4-5 hours | **Owner**: Backend Team

---

### Phase 3: Additional Requirements

#### ⏳ Environment Setup

- [ ] Create `.env.staging` with all required variables
- [ ] Secrets manager configured (Vault/AWS/Azure/K8s)
- [ ] Database backups configured
- [ ] Redis persistence enabled (`appendonly yes`)
- [ ] Elasticsearch data volumes configured
- [ ] Log retention policies set (30 days minimum)

#### ⏳ Infrastructure

- [ ] Staging kubernetes cluster ready (if using K8s)
- [ ] Load balancer configured
- [ ] Health check endpoints defined
- [ ] Monitoring dashboards deployed
- [ ] Alert thresholds configured

#### ⏳ Documentation

- [ ] Deployment runbook updated
- [ ] Incident response procedures documented
- [ ] Architecture diagrams reviewed
- [ ] API documentation updated
- [ ] Troubleshooting guide created

---

## 🎯 Deployment Readiness Checklist

### Security

- [ ] All P0 security fixes implemented
- [ ] Secrets removed from version control
- [ ] Secrets manager configured
- [ ] WebSocket authenticated
- [ ] CORS properly restricted
- [ ] Security audit completed
- [ ] Penetration testing (if required)

### Code Quality

- [ ] All P1 code quality fixes
- [ ] Test coverage >60%
- [ ] Load testing passed
- [ ] Performance baselines established
- [ ] No critical issues in SonarQube
- [ ] Code review approved

### Operations

- [ ] Monitoring configured
- [ ] Alerts tested
- [ ] Health checks passing
- [ ] Backups verified
- [ ] Rollback procedure documented
- [ ] On-call schedule configured

### Infrastructure

- [ ] Database optimized (indices, connection pooling)
- [ ] Caching configured
- [ ] Load balancer healthy
- [ ] Kubernetes resources (if using K8s)
- [ ] TLS/SSL certificates valid
- [ ] Network security groups configured

---

## 📊 Progress Tracking

| Phase                | Status      | Effort     | Owner      | Target         |
| -------------------- | ----------- | ---------- | ---------- | -------------- |
| P0-1 Secret Removal  | ✅ 100%     | 2h         | Security   | ✓ Done         |
| P0-2 CORS Fix        | ⏳ 0%       | 2-3h       | Backend    | 2026-02-24     |
| P0-3 WebSocket Auth  | ⏳ 0%       | 4-5h       | Backend    | 2026-02-24     |
| P0-4 Remove eval()   | ⏳ 0%       | 1-2h       | Frontend   | 2026-02-24     |
| P0-5 Docker Defaults | ⏳ 0%       | 1-2h       | DevOps     | 2026-02-24     |
| P0-6 Account Lockout | ⏳ 0%       | 5-6h       | Backend    | 2026-02-25     |
| **P0 Total**         | **✅ 1/6**  | **25-29h** | **Multi**  | **2026-02-25** |
| P1 Phase             | ⏳ 0%       | **26-30h** | **Multi**  | **2026-02-27** |
| Integration          | ⏳ 0%       | **8-10h**  | **DevOps** | **2026-02-28** |
| **Total**            | **✅ 1/18** | **60-70h** | **Multi**  | **2026-02-28** |

---

## 🚀 Go/No-Go Decision

### Current Go/No-Go: **NO-GO** ❌

**Reason**: Critical P0 security issues must be resolved

### Go Criteria (ALL must be true)

- [ ] All P0 security fixes completed
- [ ] All P1 critical fixes completed
- [ ] Test coverage ≥60%
- [ ] Security audit passed
- [ ] Load testing passed
- [ ] Staging deployment successful
- [ ] 24-hour smoke test passed
- [ ] Team sign-off obtained

---

## 📞 Communication Plan

### Daily Standup

- Time: 10:00 AM UTC
- Duration: 15 minutes
- Attendees: All workstream leads
- Topics: Blockers, progress, timeline impact

### Weekly Review

- Time: Friday 2:00 PM UTC
- Topics: Progress summary, risks, decisions needed

### Stakeholder Updates

- Format: Email
- Frequency: 3x per week
- Recipients: Management, Security, Product

---

**Last Updated**: 2026-02-22  
**Next Review**: 2026-02-24  
**Owner**: DevOps + Security Team  
**Status**: IN PROGRESS - 66% complete

---

### Quick Links

- [Security Remediation Guide](./SECURITY_REMEDIATION.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Performance Baselines](./performance-baselines.md)
- [Incident Runbook](./INCIDENT_RUNBOOK.md)
