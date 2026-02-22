# Phase 4: E2E Tests + Continuous Deployment

## Executive Summary

Phase 4 focuses on:

1. **E2E Test Expansion** - Expand from 6 tests to comprehensive coverage of all critical workflows
2. **Continuous Deployment Pipeline** - Complete Kubernetes deployment automation
3. **Deployment Validation** - Automated health checks and smoke tests
4. **Rollback Strategy** - Automated rollback on deployment failure

### Current State

- ✅ CI/CD workflow exists (ci-cd.yml)
- ✅ 6 E2E tests in place (passenger, driver, admin, chat, ride-matching, integration)
- ✅ Docker builds configured
- ⏳ Deployment stages need completion (placeholders only)
- ⏳ Kubernetes manifests exist (need deployment automation)

---

## Part 1: E2E Test Expansion

### Current E2E Tests (6 tests)

1. **integration.cy.ts** - Authentication, booking, admin flows
2. **passenger-complete-ride.cy.ts** - Passenger booking to ride completion
3. **driver-accept-complete-ride.cy.ts** - Driver acceptance and ride completion
4. **admin-dashboard.cy.ts** - Admin dashboard navigation
5. **chat-flow.cy.ts** - Chat functionality
6. **ride-matching-flow.cy.ts** - Ride matching algorithm

### Tests to Add (Critical Flows)

#### 1. Payment Flow Test

```typescript
// cypress/e2e/payment-flow.cy.ts
describe('Payment Processing', () => {
  it('should complete payment for booking', () => {
    // Create booking
    // Proceed to payment
    // Enter card details (4111 1111 1111 1111)
    // Verify payment success
    // Verify booking status updated
  });

  it('should handle payment failure gracefully', () => {
    // Attempt payment with invalid card
    // Verify error message
    // Allow retry
  });

  it('should support multiple payment methods', () => {
    // Test credit card
    // Test debit card
    // Test digital wallet
  });
});
```

#### 2. User Profile Management

```typescript
// cypress/e2e/user-profile.cy.ts
describe('User Profile Management', () => {
  it('should update user profile', () => {
    // Edit profile
    // Update name, phone, address
    // Save changes
    // Verify updates persisted
  });

  it('should upload profile photo', () => {
    // Upload photo
    // Verify crop/resize options
    // Save
    // Verify display
  });

  it('should manage document verification', () => {
    // Upload ID
    // Upload selfie
    // Track verification status
  });
});
```

#### 3. Ratings & Reviews

```typescript
// cypress/e2e/ratings-reviews.cy.ts
describe('Ratings & Reviews', () => {
  it('should rate driver after ride', () => {
    // Complete ride
    // Open rating modal
    // Give 5-star rating
    // Add comment
    // Submit
  });

  it('should display ratings on profile', () => {
    // View driver profile
    // Verify average rating displayed
    // Verify review count
  });
});
```

#### 4. Search & Filtering

```typescript
// cypress/e2e/search-filtering.cy.ts
describe('Search & Filtering', () => {
  it('should search rides', () => {
    // Enter search criteria
    // Verify results filter
    // Sort by price, rating, distance
  });

  it('should filter by date range', () => {
    // Set date range
    // Verify results filtered
  });
});
```

#### 5. Error Handling & Edge Cases

```typescript
// cypress/e2e/error-handling.cy.ts
describe('Error Handling', () => {
  it('should handle network timeout gracefully', () => {
    // Simulate timeout
    // Verify error message
    // Allow retry
  });

  it('should handle server errors gracefully', () => {
    // Trigger 500 error
    // Verify error page
    // Allow navigation back
  });

  it('should validate form inputs', () => {
    // Submit empty form
    // Verify validation errors
    // Verify field-specific errors
  });
});
```

#### 6. Performance Testing

```typescript
// cypress/e2e/performance.cy.ts
describe('Performance', () => {
  it('should load homepage in <2s', () => {
    // Measure page load time
    // Assert < 2000ms
  });

  it('should load dashboard in <3s', () => {
    // Login and measure
    // Assert < 3000ms
  });
});
```

#### 7. Accessibility Testing

```typescript
// cypress/e2e/accessibility.cy.ts
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    // Check all buttons have aria-label
    // Check form labels associated
  });

  it('should be keyboard navigable', () => {
    // Tab through form
    // Verify focus visible
    // Verify all interactions work with keyboard
  });
});
```

### Test Organization

```
cypress/
├── e2e/
│   ├── auth/
│   │   ├── integration.cy.ts
│   │   └── login-registration.cy.ts
│   ├── passenger/
│   │   ├── passenger-complete-ride.cy.ts
│   │   ├── booking-flow.cy.ts
│   │   ├── payment-flow.cy.ts
│   │   └── user-profile.cy.ts
│   ├── driver/
│   │   ├── driver-accept-complete-ride.cy.ts
│   │   ├── driver-profile.cy.ts
│   │   └── driver-earnings.cy.ts
│   ├── admin/
│   │   ├── admin-dashboard.cy.ts
│   │   ├── user-management.cy.ts
│   │   └── reporting.cy.ts
│   ├── features/
│   │   ├── chat-flow.cy.ts
│   │   ├── ride-matching-flow.cy.ts
│   │   ├── ratings-reviews.cy.ts
│   │   └── search-filtering.cy.ts
│   ├── quality/
│   │   ├── performance.cy.ts
│   │   ├── accessibility.cy.ts
│   │   └── error-handling.cy.ts
│   └── integration/
│       └── end-to-end-workflow.cy.ts
├── support/
│   └── e2e.ts
└── cypress.config.ts
```

---

## Part 2: Continuous Deployment Pipeline

### Current CI/CD Issues

1. **npm vs pnpm**: Workflow uses `npm ci` but project uses pnpm
2. **Placeholder deployments**: Kubernetes commands are commented out
3. **Missing validation**: No post-deployment health checks
4. **No rollback**: No automated rollback on failure

### Fixes Required

#### 2.1 Update Workflow to Use pnpm

```yaml
# .github/workflows/ci-cd.yml - Changes
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'pnpm' # Changed from 'npm'

- name: Install dependencies
  run: pnpm install # Changed from 'npm ci'
```

#### 2.2 Complete Kubernetes Deployments

```bash
# Staging Deployment
kubectl set image deployment/api-gateway \
  api-gateway=${{ secrets.DOCKER_REGISTRY }}/going-api-gateway:${{ github.sha }} \
  -n staging

kubectl set image deployment/booking-service \
  booking-service=${{ secrets.DOCKER_REGISTRY }}/going-booking:${{ github.sha }} \
  -n staging

# Wait for rollout
kubectl rollout status deployment/api-gateway -n staging --timeout=5m
```

#### 2.3 Add Deployment Validation

```bash
# Health check
for i in {1..30}; do
  if curl -f http://staging.going.local/api/health; then
    echo "✅ Service healthy"
    exit 0
  fi
  echo "⏳ Waiting for service... ($i/30)"
  sleep 10
done
echo "❌ Service failed to become healthy"
exit 1
```

#### 2.4 Add Rollback Strategy

```bash
# On deployment failure
if ! kubectl rollout status deployment/api-gateway -n staging --timeout=5m; then
  echo "❌ Deployment failed, rolling back..."
  kubectl rollout undo deployment/api-gateway -n staging
  kubectl rollout status deployment/api-gateway -n staging --timeout=5m
  exit 1
fi
```

### Deployment Stages

#### Stage 1: Unit Tests

- Run on all branches
- Requirement for merge to main/develop
- Report coverage to Codecov

#### Stage 2: E2E Tests

- Run only on main and develop
- Must pass for staging/production deployment
- Capture videos/screenshots on failure

#### Stage 3: Security Tests

- npm audit
- Snyk scanning
- OWASP dependency check

#### Stage 4: Build Docker Images

- Build only on push to main/develop
- Tag with git SHA and "latest"
- Push to Docker registry

#### Stage 5: Deploy to Staging

- Run only on push to develop
- Requires: build, security passing
- 5 minute timeout for health checks
- Slack notification on result

#### Stage 6: Deploy to Production

- Run only on push to main
- Requires: build passing
- Manual approval step recommended
- Automated health checks
- Automated rollback on failure
- Slack notification to team

#### Stage 7: Load Testing

- Run on schedule (daily at 2 AM)
- Or on push to main
- 50 VUs, 5 minute duration
- Report results to team

---

## Part 3: Implementation Steps

### Step 1: Update CI/CD Workflow (pnpm)

**Files to modify**: `.github/workflows/ci-cd.yml`

Changes:

1. Add pnpm setup action
2. Change all `npm ci` to `pnpm install`
3. Change cache type from npm to pnpm
4. Update all npm commands to pnpm

### Step 2: Create New E2E Tests

**Files to create**:

- cypress/e2e/auth/login-registration.cy.ts
- cypress/e2e/passenger/booking-flow.cy.ts
- cypress/e2e/passenger/payment-flow.cy.ts
- cypress/e2e/passenger/user-profile.cy.ts
- cypress/e2e/driver/driver-profile.cy.ts
- cypress/e2e/driver/driver-earnings.cy.ts
- cypress/e2e/admin/user-management.cy.ts
- cypress/e2e/admin/reporting.cy.ts
- cypress/e2e/features/ratings-reviews.cy.ts
- cypress/e2e/features/search-filtering.cy.ts
- cypress/e2e/quality/performance.cy.ts
- cypress/e2e/quality/accessibility.cy.ts
- cypress/e2e/quality/error-handling.cy.ts
- cypress/e2e/integration/end-to-end-workflow.cy.ts

### Step 3: Update Kubernetes Deployment Commands

**Files to modify**: `.github/workflows/ci-cd.yml`

Changes:

1. Uncomment kubectl commands
2. Add proper namespace and image updates
3. Add health check validation
4. Add rollback logic

### Step 4: Add Deployment Validation

**Files to modify**: `.github/workflows/ci-cd.yml`

Changes:

1. Add health check after deployment
2. Add smoke test execution
3. Add timeout handling
4. Add rollback on failure

### Step 5: Create Deployment Guide

**Files to create**: `PHASE4_DEPLOYMENT_GUIDE.md`

Content:

- Manual deployment steps
- Kubernetes setup
- Ingress configuration
- SSL/TLS setup
- Database backup strategy
- Monitoring dashboards
- Alert configuration

---

## Part 4: Success Criteria

### E2E Tests

- [ ] At least 14+ E2E tests created
- [ ] Tests organized by feature area
- [ ] All critical workflows covered
- [ ] Tests passing in CI
- [ ] Videos captured on failure
- [ ] <5 minute execution time

### CI/CD Pipeline

- [ ] Workflow uses pnpm (not npm)
- [ ] All stages properly configured
- [ ] Staging deployment automated
- [ ] Production deployment automated
- [ ] Health checks working
- [ ] Rollback tested and verified
- [ ] Slack notifications configured

### Deployment

- [ ] Services deploy to Kubernetes
- [ ] Health probes responding
- [ ] Ingress routing working
- [ ] Load balancing functional
- [ ] Auto-scaling configured

---

## Part 5: Timeline

| Task                           | Time         | Status |
| ------------------------------ | ------------ | ------ |
| Update CI/CD for pnpm          | 15 min       | ⏳     |
| Create new E2E tests           | 45 min       | ⏳     |
| Update deployment commands     | 30 min       | ⏳     |
| Add health checks & validation | 20 min       | ⏳     |
| Add rollback strategy          | 15 min       | ⏳     |
| Test deployment pipeline       | 30 min       | ⏳     |
| **Total**                      | **~155 min** | **⏳** |

---

## Part 6: Commands Quick Reference

### Run All E2E Tests

```bash
pnpm test:e2e
```

### Run Specific E2E Test Suite

```bash
pnpm cypress run --spec "cypress/e2e/passenger/**/*.cy.ts"
pnpm cypress run --spec "cypress/e2e/driver/**/*.cy.ts"
pnpm cypress run --spec "cypress/e2e/admin/**/*.cy.ts"
```

### Run E2E Tests with Video

```bash
pnpm cypress run --record false --spec "cypress/e2e/**/*.cy.ts"
```

### Check Deployment Status

```bash
kubectl get deployments -n going
kubectl get pods -n going
kubectl describe deployment api-gateway -n going
```

### View Service Logs

```bash
kubectl logs -f deployment/api-gateway -n going
kubectl logs -f deployment/booking-service -n going
```

### Rollback Deployment

```bash
kubectl rollout undo deployment/api-gateway -n going
kubectl rollout status deployment/api-gateway -n going
```

---

## References

- [Cypress Documentation](https://docs.cypress.io/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [kubectl Commands](https://kubernetes.io/docs/reference/kubectl/)
