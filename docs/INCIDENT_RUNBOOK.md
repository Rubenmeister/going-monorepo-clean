# Going Platform - Incident Runbook

**Document Status**: Active
**Last Updated**: 2026-02-22
**Owner**: Platform Engineering Team
**Escalation Contact**: on-call@going-platform.com

---

## Table of Contents

1. [Incident Response Process](#incident-response-process)
2. [Critical Incidents](#critical-incidents)
3. [Common Failure Scenarios](#common-failure-scenarios)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Communication Plan](#communication-plan)
6. [Post-Incident](#post-incident)

---

## Incident Response Process

### Severity Levels

| Level             | Response Time | Impact                             | Examples                             |
| ----------------- | ------------- | ---------------------------------- | ------------------------------------ |
| **P1 - Critical** | 5 minutes     | System unavailable, data loss risk | Database corruption, payment failure |
| **P2 - High**     | 15 minutes    | Degraded performance               | API timeout, memory leak             |
| **P3 - Medium**   | 1 hour        | Limited user impact                | Single service down                  |
| **P4 - Low**      | 4 hours       | Minimal impact                     | Non-critical logging errors          |

### Incident Classification

**FIRST STEP - Assess Impact:**

```bash
# 1. Check Sentry dashboard for error rate
# 2. Check Grafana for CPU/Memory/Network metrics
# 3. Check Prometheus for service health
# 4. Check user reports in support channel
```

---

## Critical Incidents

### 1. High CPU/Memory Usage (>80%)

**Indicator**: Grafana alert "HighCPUUsage"

**Immediate Actions**:

```bash
# Step 1: Identify problematic service
kubectl top pods -n production | sort --reverse --key 3

# Step 2: Check service logs
kubectl logs -n production <pod-name> --tail=100

# Step 3: Check for memory leaks
# Look for continuously increasing memory without decrease

# Step 4: If memory leak detected, restart service
kubectl rollout restart deployment/<service-name> -n production

# Step 5: Monitor memory usage
kubectl top pods -n production -w
```

**If Not Fixed in 10 minutes**:

1. Scale down replicas (reduce load)
2. Route traffic to healthy replicas
3. Page on-call engineer
4. Initiate incident war room

**Root Cause Investigation**:

- Check for infinite loops in recent code changes
- Check for unclosed database connections
- Check for memory accumulation in caches

**Prevention**:

- Enable memory profiling in production
- Set pod memory limits: `requests: 256Mi, limits: 512Mi`
- Use heap dumps for analysis: `jmap -dump:live,format=b,file=heap.bin <pid>`

---

### 2. Database Connection Pool Exhausted

**Indicator**:

- Error: "ECONNREFUSED"
- Sentry alert: "ConnectionPoolExhausted"
- Affected services unable to connect to MongoDB

**Immediate Actions**:

```bash
# Step 1: Check MongoDB connection count
mongo --eval "db.currentOp()" | grep "numConnections"

# Step 2: Check application connection pools
kubectl exec -it <pod-name> -n production -- \
  curl http://localhost:3000/health/connections

# Step 3: Identify slow queries consuming connections
mongo --eval "db.currentOp(true)" | grep -E "op|secs_running"

# Step 4: Kill long-running queries if necessary
mongo --eval "db.killOp(<opid>)"

# Step 5: Restart services in stages (not all at once)
kubectl rollout restart deployment/api-gateway -n production
sleep 30
kubectl rollout restart deployment/booking-service -n production
```

**Configuration Check**:

```javascript
// Verify connection pool settings in services
const mongoUri = process.env.MONGO_URI;
const options = {
  maxPoolSize: 10, // Default
  minPoolSize: 2, // Increase if connections exhausted
  maxIdleTimeMS: 30000, // Close idle connections
  serverSelectionTimeoutMS: 5000,
};
```

**If Not Fixed**:

1. Scale database read replicas
2. Implement circuit breaker pattern
3. Enable connection retry logic
4. Page database team

---

### 3. Payment Service Failure

**Indicator**:

- Error rate >10% on payment-service
- Stripe/payment gateway timeout
- Sentry: "PaymentProcessingFailed"

**Immediate Actions**:

```bash
# Step 1: Verify payment gateway connectivity
curl -i https://api.stripe.com/v1/ \
  -H "Authorization: Bearer $STRIPE_API_KEY"

# Step 2: Check service logs for timeout errors
kubectl logs -n production deployment/payment-service --tail=200 | grep -i error

# Step 3: Check recent code deployments
git log --oneline -10 payment-service/

# Step 4: If recent change deployed, rollback
kubectl rollout undo deployment/payment-service -n production

# Step 5: Monitor payment queue
kubectl exec -it <payment-pod> -- \
  curl http://localhost:3004/admin/queue-status
```

**Backup Options**:

- Route payments to backup payment provider
- Queue transactions for async processing
- Alert users to retry failed transactions

**Escalation**:

- Notify finance/accounting team
- Page payment service on-call
- Create incident in PagerDuty

---

### 4. Data Corruption/Integrity Issue

**Indicator**:

- Inconsistent data across replicas
- Sentry: "DataIntegrityViolation"
- User reports showing wrong data

**CRITICAL - Do NOT Automatically Fix**:

```bash
# Step 1: IMMEDIATELY stop all write operations
# Disable write routes in API Gateway
kubectl set env deployment/api-gateway \
  DB_WRITE_DISABLED=true -n production

# Step 2: Create backup of corrupted data
mongodump --uri="mongodb://..." --out=./backup-corrupted

# Step 3: Assess scope of corruption
db.collection.find({createdAt: {$gt: lastGoodBackupTime}}) | wc -l

# Step 4: Alert data team
# Page on-call DBA

# Step 5: Potential recovery options:
# Option A: Restore from last known-good backup
# Option B: Apply point-in-time recovery
# Option C: Selective rollback of affected documents
```

**IMPORTANT**:

- Do not attempt to fix data without backup
- Document all corruption patterns
- Preserve audit logs for forensics
- Review application code for bugs

---

### 5. Service Downtime (Pod Crash Loop)

**Indicator**:

- Pod status: `CrashLoopBackOff`
- Service endpoint returns 503
- Zero requests being processed

**Immediate Actions**:

```bash
# Step 1: Check pod status and restart count
kubectl get pods -n production | grep <service-name>

# Step 2: View pod events and crash logs
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production --previous

# Step 3: Check if image pull is failing
kubectl get events -n production --sort-by='.lastTimestamp'

# Step 4: If application error, check environment variables
kubectl get pod <pod-name> -n production -o yaml | grep env -A 20

# Step 5: Verify dependencies are healthy
kubectl get pods -n production | grep "mongodb\|redis"

# Step 6: If dependency issue, restart dependent service
kubectl rollout restart deployment/mongodb -n production
```

**If Config Issue**:

```bash
# Step 1: Check ConfigMap
kubectl get configmap -n production
kubectl describe configmap app-config -n production

# Step 2: Verify env vars match service requirements
kubectl set env deployment/<service> KEY=VALUE -n production

# Step 3: Trigger new rollout
kubectl rollout restart deployment/<service> -n production
```

---

## Common Failure Scenarios

### Scenario: API Timeout (>10s response time)

**Debugging**:

```bash
# Check service response time
kubectl top pods -n production
kubectl describe hpa api-gateway -n production

# Check database query performance
mongo --slowms=1000 --profile=1 <db>
db.system.profile.find().pretty()

# Check network latency
kubectl exec <pod> -- ping -c 5 mongodb
```

**Fix**:

- Add database indexes
- Implement caching layer (Redis)
- Optimize slow queries
- Scale service replicas: `kubectl scale --replicas=3 deployment/api-gateway`

### Scenario: Memory Leak in NodeJS

**Debugging**:

```bash
# Enable heap snapshot
curl http://localhost:3000/debug/heap-snapshot > heap.heapsnapshot

# Analyze with Chrome DevTools
# Or use clinic.js for automated analysis
clinic doctor --collect-all -- node app.js

# Check for unfinished promises
kubectl logs <pod> | grep -i "unhandledrejection\|promise"
```

**Fix**:

- Fix unclosed database connections
- Clear event listeners: `emitter.removeAllListeners()`
- Limit cache size: `new Map()` → `new LRU({max: 1000})`

### Scenario: Rate Limit Exceeded (429)

**Immediate Actions**:

```bash
# Reduce incoming requests
kubectl scale --replicas=5 deployment/api-gateway -n production
kubectl scale --replicas=10 deployment/api-gateway -n production

# Check rate limit config
kubectl get configmap rate-limit-config -n production

# Increase limit temporarily (if safe)
kubectl set env deployment/api-gateway \
  RATE_LIMIT=10000/minute -n production

# Monitor queue depth
watch 'kubectl top pods | tail -5'
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

```yaml
Critical Thresholds:
  CPU Usage: >80% → P1
  Memory Usage: >85% → P1
  Error Rate: >5% → P2
  P99 Latency: >1000ms → P2
  Pod Restart Count: >3 in 5min → P1
  Database Connections: >90% pool → P2

Sentry Alerts:
  Error Count: >100 in 5min → P2
  Unique Users Affected: >100 → P2
  Critical Exceptions: ANY → P1
```

### Alert Configuration

```bash
# View active alerts
kubectl get alertmanager -n monitoring

# Test alert
kubectl logs -n monitoring alertmanager-0 | tail -20

# Manual alert trigger (testing)
curl -X POST http://prometheus:9090/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{"alerts": [{"labels": {"alertname": "TestAlert"}}]}'
```

---

## Communication Plan

### Incident Announcement (Within 5 minutes)

**Slack Template**:

```
🚨 **INCIDENT**: <Service> - <Severity>

Status: 🔴 INVESTIGATING
Affected: <Impact description>
Time Started: <timestamp>
Last Updated: <timestamp>

Investigating team:
- @engineer1
- @engineer2

Updates every 10 minutes in thread.
```

### Status Updates (Every 15 minutes)

```
✅ Update: Identified root cause - database connection pool exhausted
⏱️ ETA Fix: 15 minutes
Actions:
- Restarting services in stages
- Scaling database connections
```

### All Clear (Within 5 minutes of resolution)

```
✅ **RESOLVED**

Root Cause: Database connection pool limit hit during deployment
Duration: 23 minutes (14:32 - 14:55 UTC)
Impact: 450 failed transactions, 12 customers affected

Post-Incident Review: 2026-02-23 10:00 AM

Actions to prevent:
- [ ] Increase connection pool limits
- [ ] Add pre-deployment connection health check
- [ ] Implement gradual traffic ramp-up
```

---

## Post-Incident

### Within 24 hours

1. **Create RCA (Root Cause Analysis)**

```markdown
# RCA: Database Connection Pool Exhaustion

## Timeline

14:32 - Alert triggered
14:35 - Team assembled
14:50 - Root cause identified
14:55 - Service recovered

## Root Cause

During deployment, new services attempted connections before old ones closed,
causing connection pool to be exhausted.

## Contributing Factors

- No gradual traffic ramp-up
- No pre-deployment health check
- Pool timeout too high (60s instead of 10s)

## Preventive Actions

1. Implement gradual deployment (25% → 50% → 75% → 100%)
2. Add connection pool health check
3. Reduce idle connection timeout to 10 seconds
4. Add monitoring alerts at 70% pool usage
```

2. **Create Jira Ticket**

```
Title: [INCIDENT] Implement gradual deployment strategy
Description: <Link to RCA>
Priority: High
Assignee: <Team Lead>
Due Date: <1 week>
```

3. **Schedule RCA Meeting**

```
Attendees: All incident responders + stakeholders
Duration: 1 hour
Agenda:
- Timeline review
- Root cause discussion
- Preventive actions review
- Action item assignments
```

### Follow-up Tasks

```bash
# Before closing incident
[ ] All action items assigned to team members
[ ] Sentry issue marked as resolved
[ ] Monitoring alerts tested and verified
[ ] Post-incident review scheduled
[ ] Metrics dashboard updated with new thresholds
```

---

## Contact & Escalation

**Primary On-Call**: @platform-oncall in Slack
**Escalation**: on-call@going-platform.com
**War Room**: [Zoom](https://zoom.us/meeting/going-incidents)
**Runbook**: This document (auto-updated)

**Service Owners**:

- API Gateway: @api-team
- Payment Service: @payments-team
- Database: @database-team
- Infrastructure: @devops-team

---

## Version History

| Date       | Author        | Changes                                   |
| ---------- | ------------- | ----------------------------------------- |
| 2026-02-22 | Platform Team | Initial version with 5 critical scenarios |
| TBD        | TBD           | Future updates based on incidents         |

---

**Next Review**: 2026-03-22
**Last Tested**: 2026-02-22 (Simulated incident drill)
