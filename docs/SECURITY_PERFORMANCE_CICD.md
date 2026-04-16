# Going Platform - Security, Performance & CI/CD Guide

## Table of Contents
1. [Security Implementation](#security-implementation)
2. [Performance Optimization](#performance-optimization)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Monitoring & Observability](#monitoring--observability)

---

## Security Implementation

### Authentication & Authorization

#### JWT (JSON Web Tokens)
```bash
# JWT Configuration
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRY=24h
JWT_ALGORITHM=HS256
```

**Features**:
- ✅ Token signing and verification
- ✅ Automatic expiry handling
- ✅ Payload validation
- ✅ Tamper detection

**Test Coverage**:
```bash
npm run test:security
# Tests JWT validation, expiry, tampering
```

#### OAuth2 Flow
```
1. User initiates login
2. Redirected to OAuth provider
3. User grants permission
4. Authorization code received
5. Code exchanged for access token
6. Token stored securely in HTTP-only cookie
```

**PKCE Support** (for mobile apps):
```javascript
// Generate code verifier
const codeVerifier = crypto.randomBytes(32).toString('hex');

// Calculate code challenge
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Use in authorization request
const authUrl = `https://auth.going.com/authorize?code_challenge=${codeChallenge}&code_challenge_method=S256`;
```

### Role-Based Access Control (RBAC)

**Roles**:
```typescript
enum Role {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
```

**Permissions Matrix**:
```
                    Passenger  Driver  Admin  Super Admin
GET /rides          ✓          ✓       ✓      ✓
POST /rides         ✓          -       -      -
POST /earnings      -          ✓       -      -
GET /admin/*        -          -       ✓      ✓
DELETE /user        -          -       -      ✓
```

### Data Protection

#### Password Security
```typescript
// Password Requirements
const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Hashing
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### Encryption
```typescript
// Sensitive Data Encryption
import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Input Validation & Sanitization

```typescript
// Request validation
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

export class CreateRideDto {
  @IsLatitude()
  pickupLat: number;

  @IsLongitude()
  pickupLon: number;

  @IsEmail()
  passengerEmail: string;

  @IsString()
  @MaxLength(500)
  notes: string;
}

// Sanitize HTML to prevent XSS
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### Security Headers

```typescript
// In NestJS middleware
import helmet from 'helmet';

app.use(helmet());

// Headers added:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security: max-age=31536000; includeSubDomains
// - Content-Security-Policy: default-src 'self'
```

### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([
  {
    ttl: 60000,        // 1 minute
    limit: 10,         // 10 requests per minute
  },
  {
    ttl: 3600000,      // 1 hour
    limit: 100,        // 100 requests per hour
  },
]);

// Custom rate limits for sensitive endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 per minute
@Post('/auth/login')
login(@Body() credentials) { }

@Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 per hour
@Post('/auth/reset-password')
resetPassword(@Body() email) { }
```

### CORS Configuration

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://going.com',
    'https://app.going.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## Performance Optimization

### Redis Caching Strategy

#### Cache-Aside Pattern
```typescript
async getDriverProfile(driverId: string) {
  // Try cache first
  const cached = await redis.get(`driver:${driverId}`);
  if (cached) return JSON.parse(cached);

  // Cache miss - fetch from DB
  const driver = await db.drivers.findById(driverId);
  
  // Store in cache for 1 hour
  await redis.setex(`driver:${driverId}`, 3600, JSON.stringify(driver));
  
  return driver;
}
```

#### Cache Invalidation
```typescript
// Invalidate on update
async updateDriver(driverId: string, data: any) {
  await db.drivers.updateById(driverId, data);
  
  // Invalidate related caches
  await redis.del(`driver:${driverId}`);
  await redis.del(`driver:stats:${driverId}`);
  await redis.del(`driver:earnings:${driverId}`);
}
```

#### Batch Operations
```typescript
// Fetch multiple drivers efficiently
async getDrivers(driverIds: string[]) {
  const keys = driverIds.map(id => `driver:${id}`);
  const cached = await redis.mget(keys);
  
  // Find missing entries
  const missing = driverIds.filter((id, i) => !cached[i]);
  
  if (missing.length > 0) {
    const fromDb = await db.drivers.find({ _id: { $in: missing } });
    
    // Batch set to cache
    const pipeline = redis.pipeline();
    fromDb.forEach(driver => {
      pipeline.setex(
        `driver:${driver._id}`,
        3600,
        JSON.stringify(driver)
      );
    });
    await pipeline.exec();
  }
  
  return driverIds.map(id => {
    const idx = driverIds.indexOf(id);
    return cached[idx] ? JSON.parse(cached[idx]) : fromDb.find(d => d._id === id);
  });
}
```

### Database Query Optimization

#### Indexing Strategy
```javascript
// Create indexes for frequently queried fields
db.rides.createIndex({ passengerId: 1 });      // Filter by passenger
db.rides.createIndex({ driverId: 1 });         // Filter by driver
db.rides.createIndex({ status: 1 });           // Filter by status
db.rides.createIndex({ createdAt: -1 });       // Sort by date
db.rides.createIndex({ status: 1, createdAt: -1 }); // Compound index

// For geospatial queries
db.drivers.createIndex({ location: "2dsphere" });

// For full-text search
db.riders.createIndex({ firstName: "text", lastName: "text" });
```

#### Query Optimization
```typescript
// Bad: N+1 problem
for (const driverId of driverIds) {
  const driver = await db.drivers.findById(driverId);
  // Makes N queries
}

// Good: Batch query
const drivers = await db.drivers.find({ _id: { $in: driverIds } });

// Good: Aggregation pipeline
const results = await db.riders.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$driverId', count: { $sum: 1 }, total: { $sum: '$fare' } } },
  { $sort: { count: -1 } },
]);
```

### Connection Pooling

```typescript
// MongoDB connection pooling
const client = new MongoClient(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  waitQueueTimeoutMS: 5000,
});

// Redis connection pooling
const redisPool = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);
```

### Response Time SLAs

```typescript
// Middleware to track response times
app.use((req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Send to monitoring
    metrics.recordResponseTime(req.path, duration);
  });
  
  next();
});

// Target SLAs
const SLA = {
  p50: 100,   // 100ms (median)
  p95: 500,   // 500ms (95th percentile)
  p99: 1000,  // 1 second (99th percentile)
};
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/ci-cd.yml`

#### Pipeline Stages

1. **Lint** (2-3 minutes)
   - ESLint code quality check
   - Prettier formatting check
   
2. **Test** (5-10 minutes)
   - Unit tests
   - Integration tests
   - Coverage report upload
   
3. **E2E Tests** (10-15 minutes)
   - Passenger workflow
   - Driver workflow
   - Admin dashboard
   
4. **Security** (5-10 minutes)
   - JWT/OAuth2 tests
   - Input validation tests
   - Data protection tests
   
5. **Build** (5-10 minutes)
   - Docker image builds
   - Push to registry
   
6. **Deploy Staging** (5-10 minutes)
   - Deploy to staging environment
   - Run smoke tests
   
7. **Deploy Production** (5-10 minutes)
   - Manual approval
   - Deploy to production
   - Health checks

### Running Locally

```bash
# Run all checks locally before pushing
npm run lint:all        # Linting
npm run test:all        # Unit + Integration
npm run test:e2e:ci     # E2E tests
npm run build:all       # Build applications
```

### GitHub Secrets Required

```
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub password
DOCKER_REGISTRY          # Docker registry URL
SLACK_WEBHOOK            # Slack notification webhook
SNYK_TOKEN              # Snyk security token
KUBERNETES_CONFIG        # K8s config for deployment
```

---

## Monitoring & Observability

### Metrics Collection

```typescript
// Using Prometheus
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Counters
const requestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Histograms (for latency)
const responseTime = new Histogram({
  name: 'http_response_time_ms',
  help: 'HTTP response time in milliseconds',
  labelNames: ['method', 'route'],
  buckets: [10, 50, 100, 500, 1000, 2000, 5000],
});

// Gauges (for current values)
const activeConnections = new Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections',
});
```

### Logging Strategy

```typescript
// Using Winston logger
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Structured logging
logger.info('Ride completed', {
  tripId: 'trip-001',
  duration: 1200,
  fare: 25.5,
});
```

### Health Checks

```bash
# Health endpoint
curl http://localhost:3003/health

# Response
{
  "status": "healthy",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "stripe": "available"
  },
  "timestamp": "2026-02-19T10:30:00Z"
}
```

---

## Best Practices Summary

### Security
✅ Always hash passwords with bcrypt
✅ Use JWT with short expiry times
✅ Implement RBAC for all endpoints
✅ Validate all user inputs
✅ Sanitize HTML to prevent XSS
✅ Use HTTPS in production
✅ Implement rate limiting
✅ Regular security audits

### Performance
✅ Cache frequently accessed data in Redis
✅ Use batch queries instead of N+1
✅ Create indexes on query fields
✅ Implement connection pooling
✅ Monitor query performance
✅ Compress large responses
✅ Use CDN for static assets

### CI/CD
✅ Automate tests on every push
✅ Require passing tests before merge
✅ Automated security scanning
✅ Automated dependency updates
✅ Blue-green deployments
✅ Automated health checks
✅ Slack notifications on failures

---

## Troubleshooting

### Slow Queries
```bash
# Enable MongoDB profiling
mongosh
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty()
```

### Memory Leaks
```bash
# Check Node memory
node --inspect=0.0.0.0:9229 dist/main.js
# Connect with Chrome DevTools at chrome://inspect
```

### CI/CD Failures
```bash
# Check logs
docker logs going-transport
# View GitHub Actions logs in web UI
```

---

**Status**: Production Ready ✅
**Last Updated**: 2026-02-19

