# Phase 5: In-App Messaging & Chat System

**Status:** Starting NOW
**Duration:** 2-3 weeks
**Complexity:** Medium-High
**Estimated LOC:** 2,500+

---

## 🎯 Phase 5 Objectives

1. **Ride Request System** - Users request rides
2. **Ride Matching Engine** - Find best driver
3. **Chat System** - Real-time messages
4. **Notifications** - Push + SMS alerts
5. **Dispatch Flow** - Driver acceptance

---

## 📋 Implementation Plan

### Step 1: Create Ride Domain (Week 1)
```
shared-infrastructure/src/domains/ride/
├── entities/
│   ├── ride-request.entity.ts
│   ├── ride.entity.ts
│   ├── ride-status.enum.ts
│   └── acceptance.entity.ts
├── value-objects/
│   ├── fare.vo.ts
│   ├── pickup-location.vo.ts
│   └── dropoff-location.vo.ts
├── repositories/
│   ├── ride.repository.interface.ts
│   └── ride-acceptance.repository.interface.ts
└── services/
    └── ride-matching.service.ts
```

### Step 2: Create Transport Service Enhancements
```
transport-service/src/
├── application/
│   └── use-cases/
│       ├── request-ride.use-case.ts
│       ├── accept-ride.use-case.ts
│       ├── start-ride.use-case.ts
│       └── complete-ride.use-case.ts
├── infrastructure/
│   ├── repositories/
│   │   └── mongo-ride.repository.ts
│   ├── gateways/
│   │   └── ride-dispatch.gateway.ts
│   └── schemas/
│       └── ride.schema.ts
└── api/
    └── ride.controller.ts
```

### Step 3: Create Chat Service (Week 2)
```
notifications-service/src/
├── application/
│   └── use-cases/
│       ├── send-message.use-case.ts
│       ├── mark-read.use-case.ts
│       └── get-messages.use-case.ts
├── infrastructure/
│   ├── gateways/
│   │   └── chat.gateway.ts
│   ├── repositories/
│   │   └── mongo-message.repository.ts
│   └── schemas/
│       └── message.schema.ts
└── api/
    └── chat.controller.ts
```

### Step 4: WebSocket Events & Real-time Updates (Week 2-3)
```
WebSocket Namespace: /rides

Events:
  ride:requested      → Broadcast to nearby drivers
  ride:accepted       → Notify user
  ride:started        → Notify both parties
  ride:completed      → Finalize
  message:sent        → Chat message
  message:read        → Read receipt
```

### Step 5: Integration & Testing (Week 3)
```
✅ End-to-end tests
✅ Load testing (concurrent rides)
✅ Chat message persistence
✅ WebSocket reliability
```

---

## 🗄️ Database Schema

### MongoDB: Ride Collection
```javascript
db.rides.insertOne({
  _id: UUID,
  userId: String,
  driverId: String,

  pickupLocation: {
    type: "Point",
    coordinates: [lon, lat],
    address: String
  },

  dropoffLocation: {
    type: "Point",
    coordinates: [lon, lat],
    address: String
  },

  fare: {
    baseFare: Number,      // $2.50
    perKm: Number,         // $0.50
    perMinute: Number,     // $0.10
    surgeMultiplier: Number, // 1.0 - 3.0
    estimatedFare: Number,
    finalFare: Number
  },

  status: "requested|accepted|started|completed|cancelled",

  requestedAt: Date,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,

  durationSeconds: Number,
  distanceKm: Number,

  ratings: {
    driverRating: Number,
    userRating: Number,
    driverReview: String,
    userReview: String
  },

  cancellationReason: String
})

// Indexes
db.rides.createIndex({ userId: 1, createdAt: -1 })
db.rides.createIndex({ driverId: 1, createdAt: -1 })
db.rides.createIndex({ status: 1 })
db.rides.createIndex({ pickupLocation: "2dsphere" })
```

### MongoDB: Messages Collection
```javascript
db.messages.insertOne({
  _id: UUID,
  rideId: String,
  senderId: String,      // user or driver
  receiverId: String,

  content: String,
  attachments: [{
    type: "image|file",
    url: String,
    size: Number
  }],

  readAt: Date,
  createdAt: Date
})

// Indexes
db.messages.createIndex({ rideId: 1, createdAt: -1 })
db.messages.createIndex({ readAt: 1 })
db.messages.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }) // 30 days TTL
```

---

## 📡 REST APIs

### Ride Endpoints
```
POST   /api/rides/request
       {userId, pickupLat, pickupLon, dropoffLat, dropoffLon}
       Response: {rideId, estimatedFare, eta}

GET    /api/rides/{rideId}
       Response: {ride details}

PUT    /api/rides/{rideId}/accept
       (Driver endpoint)

PUT    /api/rides/{rideId}/start
       {driverId, currentLocation}

PUT    /api/rides/{rideId}/complete
       {driverId, finalLocation, finalFare}

PUT    /api/rides/{rideId}/cancel
       {reason}

GET    /api/users/{userId}/rides
       Query: ?status=completed&limit=10
```

### Chat Endpoints
```
POST   /api/rides/{rideId}/messages
       {content, attachments?}

GET    /api/rides/{rideId}/messages
       Query: ?limit=50&offset=0

PUT    /api/rides/{rideId}/messages/{messageId}/read

GET    /api/users/{userId}/chats
       List of active ride chats
```

---

## 🚗 Ride Matching Algorithm

### Option 1: Closest Driver (Default)
```typescript
1. Find drivers within 5km radius
2. Filter: online + available seats > 0
3. Sort by distance (closest first)
4. Calculate ETA for each
5. Return top 5 drivers
6. Send request to all 5
7. Accept first to respond (3 sec timeout)
```

### Option 2: Smart Matching (Future)
```typescript
1. Calculate closest 10 drivers
2. Consider direction of travel
3. Consider driver rating (>3.5)
4. Consider estimated pickup time
5. Score each driver
6. Send to highest scored
```

---

## 📊 Ride Matching Flow

```
User Request Ride
    ↓
Validate location + payment method
    ↓
Calculate fare estimate (base + distance + surge)
    ↓
Find nearby drivers (using Phase 4 geolocation)
    ↓
Send "ride:requested" event to 5 closest drivers
    ↓
Driver receives notification + sound alert
    ↓
Driver taps "Accept" or "Decline"
    ↓
First driver to accept gets the ride
    ↓
Notify user: "Driver accepted"
    ↓
Show driver location in real-time (Phase 4)
    ↓
Driver arrives → "Trip started"
    ↓
Real-time tracking during ride (Phase 4)
    ↓
Driver completes trip
    ↓
Calculate final fare
    ↓
Process payment (Phase 8)
    ↓
Show rating screen
    ↓
Chat history archived
```

---

## 🔔 Notification Types

### Push Notifications (Mobile)
```
Ride accepted:
  "John accepted your ride • $12.50"

Driver arriving:
  "John will arrive in 2 mins"

Ride started:
  "Trip started • Tap for details"

Ride completed:
  "Trip complete • Tap to rate driver"
```

### In-App Notifications
```
Real-time updates through WebSocket
- Ride status changes
- New messages
- Driver location updates
```

### SMS (Optional - Phase 8)
```
"Your ride with John has been accepted.
He'll arrive in 5 mins. Track: [link]"
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────┐
│   Mobile/Web User Apps      │
│   - Request ride UI         │
│   - Chat interface          │
│   - Ride tracking           │
└────────────┬────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
  ┌───────────┐  ┌──────────────┐
  │ REST APIs │  │ WebSocket    │
  │ (HTTP)    │  │ (Real-time)  │
  └──────┬────┘  └──────┬───────┘
         │              │
    ┌────┴──────────────┴──────┐
    ▼                          ▼
┌──────────────┐        ┌──────────────┐
│ Transport    │        │ Tracking     │
│ Service      │        │ Service      │
│ - Matching   │        │ - Location   │
│ - Dispatch   │        │ - ETA        │
└──────┬───────┘        └──────┬───────┘
       │                       │
    ┌──┴───────────────────────┴──┐
    ▼                             ▼
┌─────────────┐          ┌─────────────┐
│  MongoDB    │          │   Redis     │
│  - Rides    │          │   - GEO     │
│  - Messages │          │   - Cache   │
└─────────────┘          └─────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests (20+)
```
✅ Ride matching algorithm
✅ Fare calculation
✅ Message validation
✅ Status transitions
```

### Integration Tests (15+)
```
✅ End-to-end ride request flow
✅ Driver acceptance
✅ Chat message persistence
✅ Real-time WebSocket updates
```

### E2E Tests (10+)
```
✅ User requests ride
✅ Driver receives notification
✅ Driver accepts
✅ Chat works
✅ Ride completes
```

### Load Testing
```
✅ 100 concurrent ride requests
✅ 1000 concurrent messages/minute
✅ 500 active WebSocket connections
```

---

## 📅 Weekly Breakdown

### Week 1: Ride Domain & Entity
- Monday: Create ride entities + value objects
- Tuesday: Create repositories + domain services
- Wednesday: Matching algorithm implementation
- Thursday: Database schemas
- Friday: Unit tests + documentation

### Week 2: REST APIs & WebSocket
- Monday: Transport controller REST APIs
- Tuesday: WebSocket gateway for rides
- Wednesday: Chat domain & repository
- Thursday: Chat WebSocket events
- Friday: Integration testing

### Week 3: Notifications & Polish
- Monday: Notification system integration
- Tuesday: Push notification setup
- Wednesday: Load testing
- Thursday: Bug fixes + optimization
- Friday: Documentation + deployment prep

---

## 🎯 Success Criteria

✅ User can request a ride
✅ Driver receives request in <2 seconds
✅ Driver can accept/decline ride
✅ Real-time chat between user and driver
✅ Ride status updates in real-time
✅ Location tracking during ride (Phase 4)
✅ Message persistence in MongoDB
✅ <100ms WebSocket latency
✅ 85%+ test coverage
✅ Load test: 100 concurrent rides

---

## 📚 Documents This Will Create

1. **PHASE5_COMPLETE.md** - Feature overview
2. **RIDE_API_SPEC.md** - API documentation
3. **CHAT_API_SPEC.md** - Chat API docs
4. **DEPLOYMENT.md** - Production setup
5. **LOAD_TEST.md** - Performance results

---

## 🚀 Ready to Start?

This plan will give you:
- ✅ Complete ride request system
- ✅ Real-time matching
- ✅ In-app chat
- ✅ WebSocket real-time updates
- ✅ 2,500+ LOC
- ✅ Full test coverage

**Next step:** Start implementing Week 1

---

**Phase 5 Status:** 📋 PLANNED
**Implementation:** Ready to begin
**Branch:** `claude/complete-going-platform-TJOI8`
