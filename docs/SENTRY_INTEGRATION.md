# Sentry Integration Guide

**Version**: 1.0.0
**Last Updated**: 2026-02-22
**Status**: Production Ready

---

## Overview

Sentry provides real-time error tracking, performance monitoring, and alerting for the Going Platform. This guide covers setup, configuration, and best practices.

### What Sentry Tracks

✅ **Error Tracking**

- Exceptions and errors across all microservices
- Stack traces with source maps
- Breadcrumbs for context
- Session tracking

✅ **Performance Monitoring**

- Transaction latency (API endpoints, DB queries)
- Database query performance
- External API response times
- Cache hit/miss rates

✅ **Alerting**

- Error rate thresholds
- Performance degradation
- Specific error patterns
- User impact metrics

---

## Setup Instructions

### 1. Create Sentry Account & Projects

```bash
# 1. Go to https://sentry.io
# 2. Create organization (if not exists)
# 3. Create 25 projects (one per service):
#    - api-gateway
#    - user-auth-service
#    - booking-service
#    - payment-service
#    - transport-service
#    - ... (20 more services)
```

### 2. Copy DSNs

Each service needs its own Sentry project DSN:

```bash
# Example DSN format:
https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/PROJECT_ID
```

### 3. Configure Environment Variables

```bash
# Copy template
cp .env.sentry.example .env.sentry

# Edit with your DSNs
nano .env.sentry

# Source in your shell
source .env.sentry
```

### 4. Initialize Sentry in Services

For each microservice:

```typescript
// services/api-gateway/src/main.ts
import { initializeSentry } from '@/config/sentry.config';

initializeSentry({
  dsn: process.env.SENTRY_DSN_API_GATEWAY!,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || '1.0.0',
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  enablePerformanceMonitoring: true,
  enableSessionReplays: true,
  enableUserFeedback: true,
});

// Express middleware
app.use(sentryRequestHandler());
app.use(sentryErrorHandler());
```

---

## Configuration

### Sampling Rates

Control what percentage of transactions are sent to Sentry:

```typescript
// Development: Track 100% of transactions
SENTRY_TRACES_SAMPLE_RATE = 1.0;

// Staging: Track 50% to save quota
SENTRY_TRACES_SAMPLE_RATE = 0.5;

// Production: Track 10% for cost efficiency
SENTRY_TRACES_SAMPLE_RATE = 0.1;
```

### Alert Rules

Set up alerts in Sentry dashboard:

```
Alert 1: High Error Rate
├─ Condition: Error rate > 5% in 5 minutes
├─ Actions: Slack + Email
└─ Projects: payment-service, api-gateway

Alert 2: Unique Users Affected
├─ Condition: > 100 unique users in 1 hour
├─ Actions: Slack + PagerDuty
└─ Projects: All

Alert 3: P99 Latency
├─ Condition: P99 > 1000ms for 5 minutes
├─ Actions: Slack
└─ Projects: api-gateway, user-auth-service
```

---

## Usage Examples

### Capture Errors

```typescript
// Automatic (Express middleware handles)
app.get('/api/error', (req, res) => {
  throw new Error('Something went wrong!');
  // Sentry auto-captures
});

// Manual capture
try {
  await processPayment();
} catch (error) {
  captureServiceError('payment-service', error, {
    userId: req.user.id,
    orderId: req.body.orderId,
    amount: req.body.amount,
  });
  res.status(500).send('Payment failed');
}
```

### Monitor Performance

```typescript
// Start transaction
const transaction = startTransaction('process_payment', 'http.request');

try {
  // Your code here
  await saveTransaction();

  // Add span
  const querySpan = transaction?.startChild({
    op: 'db.query',
    description: 'Save transaction to DB',
  });

  await db.transactions.create(data);
  querySpan?.finish();
} finally {
  endTransaction(transaction);
}
```

### Track User Context

```typescript
// After login
setSentryUser(userId, userEmail);

// Errors will be tagged with user ID
// On logout
clearSentryUser();
```

### Report Custom Metrics

```typescript
// Track custom business metrics
reportMetric('payments_processed', 150, 'count');
reportMetric('average_order_value', 125.5, 'currency');

// These appear in Sentry dashboard for analysis
```

---

## Best Practices

### ✅ DO

- Capture errors with relevant context
- Set user ID for error tracking
- Tag errors by service and type
- Monitor external API dependencies
- Set appropriate sampling rates

### ❌ DON'T

- Capture PII (passwords, tokens) in error messages
- Send too much context (may hit quota)
- Over-sample in production (increases costs)
- Ignore high error rates
- Skip post-incident reviews

---

## Monitoring Dashboard

### Key Views

**1. Issues**

- Grouped errors by type
- Trend over time
- Affected users
- Assignees

**2. Performance**

- Slowest endpoints
- Database query performance
- External service latency
- Transaction breakdown

**3. Alerts**

- Recent triggers
- Alert history
- Configured rules
- Alert status

**4. Releases**

- Deploy tracking
- Error comparison
- Regression detection

---

## Integration with Slack

### Setup Slack Webhook

```bash
# 1. In Slack: Create incoming webhook
#    Settings → Apps → Incoming Webhooks → Add New
#    Get webhook URL

# 2. In Sentry: Add integration
#    Project → Settings → Integrations → Slack
#    Enter webhook URL

# 3. Configure alerts to send to Slack
```

### Example Slack Message

```
🚨 Critical: Payment Service - High Error Rate
Error Rate: 15% (threshold: 5%)
Duration: Last 5 minutes
Affected Users: 47
Error Type: ECONNREFUSED

[View on Sentry] [Create Issue]
```

---

## PagerDuty Integration

### Setup

```bash
# 1. In PagerDuty: Create integration
#    Services → Your Service → Integrations → Add PagerDuty
#    Get integration key

# 2. In Sentry: Add to alert rules
#    Select "Create Incident in PagerDuty"

# 3. Test alert by triggering manually
```

---

## Quota Management

### Monitor Usage

```bash
# In Sentry dashboard: Billing → Usage
Monthly quota: 1M events
Current usage: 850K events (85%)
```

### Optimize to Stay Within Quota

```typescript
// 1. Adjust sampling rates
SENTRY_TRACES_SAMPLE_RATE=0.05  // Reduce from 0.1

// 2. Filter out low-value errors
beforeSend(event) {
  if (event.exception[0].value.includes("404")) {
    return null;  // Don't send 404s
  }
  return event;
}

// 3. Use release-based filtering
// Only track errors from production releases
```

---

## Troubleshooting

### Errors Not Appearing in Sentry

```bash
# 1. Check DSN is correct
echo $SENTRY_DSN

# 2. Verify service is running
curl http://localhost:3000/health

# 3. Check network connectivity
curl -I https://your-org.ingest.sentry.io

# 4. Enable debug logging
SENTRY_DEBUG=true npm start

# 5. Check browser console for errors
# (if frontend integration)
```

### High Quota Usage

```bash
# 1. Reduce sampling rate
SENTRY_TRACES_SAMPLE_RATE=0.05

# 2. Filter errors
beforeSend(event) {
  // Don't send certain error types
  if (event.exception[0].value.includes("timeout")) {
    return null;
  }
  return event;
}

# 3. Set transaction sample decision
// Only sample important transactions
if (!isHealthCheckEndpoint(req)) {
  transaction = startTransaction(name, op);
}
```

### Missing Stack Traces

```bash
# 1. Enable source maps
// Build with source maps
tsconfig.json:
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true
  }
}

# 2. Upload source maps to Sentry
npm install @sentry/cli

# 3. Configure upload in CI/CD
release_name=$(cat package.json | jq -r .version)
sentry-cli releases create $release_name
sentry-cli releases files upload-sourcemaps ./dist
sentry-cli releases finalize $release_name
```

---

## Performance Optimization

### Database Queries

```typescript
// Use database profiling
const span = transaction?.startChild({
  op: 'db.query',
  description: 'Find user by ID',
  data: {
    collection: 'users',
    operation: 'findOne',
  },
});

const user = await User.findById(userId);
span?.finish();
```

### External APIs

```typescript
// Monitor external service calls
const span = transaction?.startChild({
  op: "http.client",
  description: "Call Stripe API",
  data: {
    url: "https://api.stripe.com/v1/charges",
    method: "POST",
  },
});

const charge = await stripe.charges.create(...);
span?.finish();
```

---

## Post-Incident Review Checklist

After any incident tracked by Sentry:

```markdown
## Incident Review: [SERVICE] - [DATE]

- [ ] Root cause identified in Sentry
- [ ] All related errors reviewed
- [ ] User impact assessed
- [ ] Alert rule adjusted if needed
- [ ] Preventive measures documented
- [ ] Code fix deployed
- [ ] Monitoring verified
- [ ] Team notified
- [ ] RCA meeting scheduled
```

---

## Additional Resources

- [Sentry Docs](https://docs.sentry.io/)
- [Node.js Integration](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Alert Rules](https://docs.sentry.io/product/alerts/)

---

**Last Updated**: 2026-02-22
**Next Review**: 2026-03-22
