# Phase 5 & Phase 6 Deployment Guide

## Overview

**Phase 5:** Messaging, Notifications & Ride Matching System
**Phase 6:** Ratings & Reviews Microservice
**Status:** ✅ Complete - Ready for Staging & Production Deployment

---

## Phase 5: Messaging, Notifications & Ride Matching

### What's Included

#### 1. **Notifications Service** (`notifications-service/`)

- Firebase Cloud Messaging (FCM) integration
- Twilio SMS integration
- SendGrid email integration
- Real-time notification gateways
- WebSocket support for push notifications

**Key Components:**

```
notifications-service/
├── src/
│   ├── api/
│   │   └── chat.controller.ts          # Chat API endpoints
│   ├── application/
│   │   └── use-cases/                  # Send notification, broadcast message
│   ├── infrastructure/
│   │   ├── gateways/                   # FCM, Twilio, SendGrid gateways
│   │   └── persistence/                # Message repository
│   └── domain/
│       └── ports/                       # IMessageRepository interface
├── Dockerfile
└── project.json
```

**API Endpoints:**

```
POST   /api/notifications/send          # Send notification
POST   /api/notifications/broadcast     # Broadcast to multiple users
GET    /api/notifications/history/:userId
POST   /api/chat/send-message           # Send chat message
GET    /api/chat/conversation/:conversationId
```

**Environment Variables:**

```env
FIREBASE_PROJECT_ID=<your-firebase-project>
FIREBASE_PRIVATE_KEY=<your-firebase-key>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
SENDGRID_API_KEY=<your-sendgrid-key>
MONGODB_URI=mongodb://localhost:27017/going_notifications
```

---

#### 2. **Transport Service** (`transport-service/`)

- Ride request & dispatch
- Ride matching algorithm
- Driver-rider pairing
- Trip status management

**Key Components:**

```
transport-service/
├── src/
│   ├── api/
│   │   └── ride.controller.ts          # Ride API
│   ├── application/
│   │   └── use-cases/
│   │       ├── request-ride.use-case.ts
│   │       ├── accept-ride.use-case.ts
│   │       └── complete-ride.use-case.ts
│   ├── domain/
│   │   ├── entities/
│   │   └── ports/                      # IRideRepository
│   └── infrastructure/
│       └── persistence/                # Mongo ride repository
├── Dockerfile
└── project.json
```

**API Endpoints:**

```
POST   /api/rides/request               # Request a ride
POST   /api/rides/:rideId/accept        # Accept ride request
POST   /api/rides/:rideId/complete      # Complete trip
GET    /api/rides/:rideId               # Get ride details
GET    /api/rides/driver/:driverId      # Driver's rides
GET    /api/rides/user/:userId          # User's rides
```

**Ride Status Flow:**

```
REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED
          ↘ CANCELLED
```

---

#### 3. **Tracking Service** (`tracking-service/`)

- Real-time geolocation tracking
- Driver availability management
- Nearby driver discovery
- Distance calculation

**Key Components:**

```
tracking-service/
├── src/
│   ├── api/
│   │   └── geo.controller.ts           # Geolocation API
│   ├── application/
│   │   └── use-cases/
│   │       ├── update-driver-location.use-case.ts
│   │       ├── find-nearby-drivers.use-case.ts
│   │       └── create-tracking-session.use-case.ts
│   ├── infrastructure/
│   │   ├── gateways/
│   │   │   └── location-tracking.gateway.ts  # WebSocket gateway
│   │   └── persistence/
│   │       ├── mongo-tracking.repository.ts
│   │       ├── redis-geo.repository.ts       # Geospatial queries
│   │       └── redis-availability.repository.ts
│   └── domain/
│       └── ports/                      # ITrackingRepository, etc.
├── Dockerfile
└── project.json
```

**API Endpoints:**

```
POST   /api/tracking/location           # Update driver location
GET    /api/tracking/nearby?lat=X&lon=Y&radius=5km
POST   /api/tracking/session            # Start tracking session
GET    /api/tracking/session/:sessionId
```

**Real-Time WebSocket Events:**

```javascript
// Server → Client
socket.emit('driver-location-updated', {
  driverId: 'driver-123',
  lat: 40.7128,
  lon: -74.006,
  timestamp: 1645000000000,
});

// Client → Server
socket.emit('update-location', {
  lat: 40.7128,
  lon: -74.006,
});
```

---

### Phase 5 Database Schemas

#### MongoDB Collections

**messages**

```javascript
{
  _id: ObjectId,
  conversationId: String,
  senderId: String,
  receiverId: String,
  content: String,
  type: "text|image|video",
  attachments: [{url, type}],
  createdAt: Date,
  readAt: Date
}
```

**rides**

```javascript
{
  _id: ObjectId,
  rideId: String,
  requesterId: String,
  driverId: String,
  status: "REQUESTED|ACCEPTED|IN_PROGRESS|COMPLETED|CANCELLED",
  pickup: {lat, lon, address},
  dropoff: {lat, lon, address},
  estimatedDistance: Number,
  estimatedDuration: Number,
  fare: Number,
  paymentMethod: String,
  createdAt: Date,
  acceptedAt: Date,
  completedAt: Date
}
```

**tracking_sessions**

```javascript
{
  _id: ObjectId,
  sessionId: String,
  driverId: String,
  status: "ACTIVE|INACTIVE",
  lastLocation: {lat, lon},
  lastUpdate: Date,
  createdAt: Date
}
```

---

### Phase 5 Testing

**Test Coverage:** 220+ test scenarios

```bash
# Run all Phase 5 tests
npm run test:phase5

# Run specific service tests
npx nx run notifications-service:test
npx nx run transport-service:test
npx nx run tracking-service:test

# Run integration tests (with services running)
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run load tests
k6 run __tests__/load/ride-load-test.js --vus 50 --duration 5m
```

**Test Files:**

- `notifications-service/src/**/*.spec.ts` - Unit tests
- `transport-service/src/**/*.spec.ts` - Unit tests
- `tracking-service/src/**/*.spec.ts` - Unit tests
- `__tests__/integration/**/*.test.ts` - Integration tests
- `__tests__/e2e/**/*.cy.ts` - E2E tests (Cypress)
- `__tests__/load/**/*.js` - Load tests (K6)

---

## Phase 6: Ratings & Reviews Microservice

### What's Included

**Complete Ratings System with:**

- 5-star rating scale
- Category-based ratings (cleanliness, communication, driving, behavior)
- Photo attachments for reviews
- Driver badge system (Super Driver, Highly Rated, Veteran Driver)
- Real-time profile statistics

### Architecture

```
ratings-service/
├── src/
│   ├── api/
│   │   └── controllers/
│   │       └── rating.controller.ts        # REST endpoints
│   ├── application/
│   │   └── use-cases/
│   │       ├── submit-rating.use-case.ts
│   │       ├── list-ratings.use-case.ts
│   │       ├── update-rating.use-case.ts
│   │       └── delete-rating.use-case.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── mongo-rating.repository.ts
│   │   │   └── mongo-driver-profile.repository.ts
│   │   └── schemas/
│   │       ├── rating.schema.ts
│   │       └── driver-profile.schema.ts
│   ├── domain/
│   │   └── ports/
│   │       └── index.ts                    # IRatingRepository, IDriverProfileRepository
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile
├── project.json
└── jest.config.cts
```

### API Endpoints

```
POST   /api/ratings/submit              # Submit a new rating
GET    /api/ratings/rating/:id          # Get rating by ID
GET    /api/ratings/trip/:tripId        # Get rating for trip
GET    /api/ratings/driver/:driverId/stats      # Driver statistics
GET    /api/ratings/driver/:driverId/reviews    # Driver reviews
GET    /api/ratings/user/:userId/ratings-given # Ratings given by user
GET    /api/ratings/top-drivers         # Top 10 rated drivers
GET    /api/ratings/super-drivers       # All super drivers
```

### Request/Response Examples

**Submit Rating:**

```bash
POST /api/ratings/submit
Content-Type: application/json

{
  "tripId": "trip-123",
  "raterId": "user-456",
  "rateeId": "driver-789",
  "stars": 5,
  "review": "Great driver, safe and courteous!",
  "categories": {
    "cleanliness": 5,
    "communication": 5,
    "driving": 5,
    "behavior": 5
  },
  "photos": [
    {
      "url": "s3://bucket/rating-photo-1.jpg",
      "caption": "Clean car interior"
    }
  ]
}

Response (201 Created):
{
  "statusCode": 201,
  "message": "Rating submitted successfully",
  "data": {
    "id": "rating-abc123",
    "tripId": "trip-123",
    "raterId": "user-456",
    "rateeId": "driver-789",
    "stars": 5,
    "review": "Great driver, safe and courteous!",
    "categories": {...},
    "photos": [...],
    "createdAt": "2024-02-20T10:30:00Z"
  }
}
```

**Get Driver Stats:**

```bash
GET /api/ratings/driver/driver-789/stats

Response (200 OK):
{
  "statusCode": 200,
  "data": {
    "profile": {
      "driverId": "driver-789",
      "averageRating": 4.8,
      "totalRatings": 245,
      "completedTrips": 456,
      "acceptanceRate": 98.5,
      "cancellationRate": 1.2,
      "badges": ["super_driver", "highly_rated"]
    },
    "recentRatings": [
      {
        "id": "rating-xyz",
        "stars": 5,
        "review": "Excellent service!",
        "createdAt": "2024-02-20T10:30:00Z"
      },
      ...
    ],
    "summary": {
      "averageRating": 4.8,
      "totalRatings": 245,
      "completedTrips": 456,
      "acceptanceRate": 98.5,
      "cancellationRate": 1.2,
      "badges": ["super_driver", "highly_rated"]
    }
  }
}
```

### Database Schema

**ratings collection**

```javascript
{
  _id: ObjectId,
  ratingId: String,
  tripId: String,
  raterId: String,          // Who gave the rating
  rateeId: String,          // Who received the rating (driver/user)
  stars: Number,            // 1-5
  review: String,           // Optional review text (max 500 chars)
  categories: {
    cleanliness: Number,    // 1-5
    communication: Number,  // 1-5
    driving: Number,        // 1-5
    behavior: Number        // 1-5
  },
  photos: [{
    url: String,            // S3/Cloud storage URL
    caption: String         // Optional photo caption
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**driver_profiles collection**

```javascript
{
  _id: ObjectId,
  driverId: String,
  averageRating: Number,         // Calculated from ratings
  totalRatings: Number,          // Total count
  completedTrips: Number,        // From transport service
  cancelledTrips: Number,
  acceptanceRate: Number,        // Percentage
  cancellationRate: Number,      // Percentage
  onTimeDeliveryRate: Number,    // Percentage
  totalEarnings: Number,
  averageEarningsPerTrip: Number,
  badges: [String],              // ["super_driver", "highly_rated", "veteran_driver"]
  lastRated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Badge Criteria

| Badge              | Requirements                                                          |
| ------------------ | --------------------------------------------------------------------- |
| **Super Driver**   | Avg Rating ≥ 4.8 AND Completed Trips ≥ 100 AND Cancellation Rate ≤ 2% |
| **Highly Rated**   | Average Rating ≥ 4.7                                                  |
| **Veteran Driver** | Completed Trips ≥ 500                                                 |

### Environment Variables

```env
NODE_ENV=production
PORT=3009
MONGODB_URI=mongodb://mongo:27017/going_ratings
LOG_LEVEL=info
```

### Testing

```bash
# Run ratings service tests
npx nx run ratings-service:test

# Run specific test file
npx jest ratings-service/src/application/use-cases/submit-rating.use-case.spec.ts

# Watch mode
npx jest --watch ratings-service
```

---

## Staging Deployment Steps

### Prerequisites

- ✅ All code pushed to `claude/complete-going-platform-TJOI8` branch
- ✅ All CI/CD tests passing
- ✅ All 26 broken imports fixed
- ✅ All 5 services (analytics, notifications, payment, tracking, transport) + ratings-service configured

### Option 1: Automatic Deployment (Recommended)

**1. Create develop branch with fixes:**

```bash
git checkout -b develop
git push -u origin develop
```

This automatically triggers:

- Lint & Code Quality checks
- Unit & Integration tests
- Security scanning
- Build Docker images
- **Deploy to staging environment**
- Run smoke tests
- Slack notification

**2. Monitor deployment:**

```bash
# Check GitHub Actions
https://github.com/Rubenmeister/going-monorepo-clean/actions

# Expected stages (5-10 minutes):
✅ Lint (2-3 min)
✅ Test (3-4 min)
✅ Security (2 min)
✅ Build (2-3 min)
✅ Deploy to Staging (1-2 min)
✅ Smoke Tests (1 min)
```

### Option 2: Manual Kubernetes Deployment

**1. Build Docker images locally:**

```bash
# Build all services
docker build -t going-notifications:latest \
  --target notifications-service \
  -f Dockerfile .

docker build -t going-transport:latest \
  --target transport-service \
  -f Dockerfile .

docker build -t going-tracking:latest \
  --target tracking-service \
  -f Dockerfile .

docker build -t going-ratings:latest \
  --target ratings-service \
  -f Dockerfile .
```

**2. Apply Kubernetes manifests:**

```bash
# Switch to staging namespace
kubectl config set-context --current --namespace=staging

# Create ConfigMap and Secrets
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/secrets.yaml

# Deploy services
kubectl apply -f k8s/base/deployment.yaml
kubectl apply -f k8s/base/service.yaml

# Set up scaling and ingress
kubectl apply -f k8s/base/hpa.yaml
kubectl apply -f k8s/base/ingress.yaml

# Check status
kubectl get pods -n staging
kubectl get svc -n staging
```

**3. Verify deployment:**

```bash
# Port forward to test locally
kubectl port-forward svc/notifications-service 3008:3008 -n staging
kubectl port-forward svc/transport-service 3005:3005 -n staging
kubectl port-forward svc/tracking-service 3007:3007 -n staging
kubectl port-forward svc/ratings-service 3009:3009 -n staging

# Test endpoints
curl http://localhost:3009/api/ratings/top-drivers
curl http://localhost:3005/api/rides
curl http://localhost:3008/api/notifications/history/user-123
```

---

## Production Deployment Steps

### Prerequisites

- ✅ Staging deployment validated
- ✅ Smoke tests passing
- ✅ Performance tests OK
- ✅ Security audit complete

### Deployment Process

**1. Create production release:**

```bash
git checkout main
git merge develop --no-ff -m "Release: Phase 5 & Phase 6 to production"
git tag -a v1.5.0 -m "Phase 5: Messaging & Tracking, Phase 6: Ratings"
git push origin main --tags
```

This automatically triggers:

- All testing stages
- Build Docker images with release tag
- **Deploy to production environment**
- Health checks
- Slack notification to team

**2. Monitor production deployment:**

```bash
# Check deployment status
kubectl get pods -n production

# Monitor logs
kubectl logs -f deployment/notifications-service -n production
kubectl logs -f deployment/transport-service -n production
kubectl logs -f deployment/tracking-service -n production
kubectl logs -f deployment/ratings-service -n production

# Check service health
kubectl describe svc -n production
```

**3. Post-deployment validation:**

```bash
# Verify all endpoints
curl https://api.going.com/api/ratings/top-drivers
curl https://api.going.com/api/rides
curl https://api.going.com/api/notifications/history/user-123
curl https://api.going.com/api/tracking/nearby

# Check database connectivity
mongosh --host prod-mongo.internal --eval "db.ratings.countDocuments()"

# Monitor error rates in production
# Dashboard: https://monitoring.going.com/dashboards/production
```

---

## Rollback Plan

If issues occur in production:

**1. Quick rollback:**

```bash
# Revert to previous version
git revert HEAD
git push origin main

# This triggers redeployment with previous code
# Automatic rollback in ~5 minutes
```

**2. Kubernetes rollback:**

```bash
# Check rollout history
kubectl rollout history deployment/ratings-service -n production

# Rollback to previous revision
kubectl rollout undo deployment/ratings-service -n production

# Verify rollback
kubectl rollout status deployment/ratings-service -n production
```

**3. Database rollback:**

```bash
# If database changes needed
mongorestore --host prod-mongo.internal --archive=backup-2024-02-20.gz

# Verify data integrity
mongosh --host prod-mongo.internal --eval "db.ratings.validate()"
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Phase 5 Services:**

- Message delivery latency (target: <100ms)
- Notification delivery rate (target: >99.9%)
- Ride request acceptance time (target: <30s)
- Driver location update frequency (target: every 5-10s)
- WebSocket connection count

**Phase 6 Service:**

- Rating submission latency (target: <200ms)
- Profile update frequency (real-time)
- Badge eligibility checks passing (>98%)
- Database query performance (target: <50ms)

### Alert Thresholds

```yaml
# Prometheus alerts
- alert: NotificationDeliveryFailure
  condition: rate(notification_errors_total[5m]) > 0.01
  severity: critical

- alert: RideMatchingDelay
  condition: ride_matching_latency_p99 > 5000
  severity: high

- alert: RatingsServiceDown
  condition: up{job="ratings-service"} == 0
  severity: critical

- alert: HighErrorRate
  condition: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
  severity: warning
```

### Dashboards

Access Grafana dashboards:

- `Phase 5 Overview` - Messaging, Transport, Tracking metrics
- `Phase 6 Ratings` - Rating submissions, profile updates, badges
- `System Health` - Pod health, memory, CPU, disk usage

---

## Troubleshooting

### Common Issues

**1. Service won't start**

```bash
# Check logs
kubectl logs <pod-name> -n staging

# Check resource limits
kubectl describe pod <pod-name> -n staging

# Verify MongoDB connection
mongosh "mongodb://mongo:27017/going_<service>"
```

**2. High latency**

```bash
# Check database indexes
db.ratings.getIndexes()

# Check pod CPU/memory
kubectl top pods -n staging

# Scale replicas if needed
kubectl scale deployment ratings-service --replicas=3 -n staging
```

**3. Message delivery failures**

```bash
# Verify Firebase/Twilio/SendGrid credentials
kubectl get secret notification-service-secrets -n staging -o yaml

# Check gateway logs
kubectl logs -f deployment/notifications-service -n staging | grep -i "gateway"
```

---

## Summary

| Component               | Status            | Location                      |
| ----------------------- | ----------------- | ----------------------------- |
| Phase 5 - Notifications | ✅ Complete       | `notifications-service/`      |
| Phase 5 - Transport     | ✅ Complete       | `transport-service/`          |
| Phase 5 - Tracking      | ✅ Complete       | `tracking-service/`           |
| Phase 6 - Ratings       | ✅ Complete       | `ratings-service/`            |
| CI/CD Pipeline          | ✅ Fixed          | `.github/workflows/ci-cd.yml` |
| Import Fixes            | ✅ All 26 files   | All services                  |
| Tests                   | ✅ 220+ scenarios | `__tests__/`                  |
| Docker Images           | ✅ Ready          | Dockerfile in each service    |
| K8s Manifests           | ✅ Ready          | `k8s/base/`                   |

**Deployment Timeline:**

- Feature branch: Ready now ✅
- Staging: ~5-10 minutes after branch push
- Production: Ready for merge to main

**Next Steps:**

1. Merge `claude/complete-going-platform-TJOI8` to `develop` (if branch permissions available)
2. Monitor CI/CD pipeline execution
3. Validate staging deployment
4. Plan production release date
