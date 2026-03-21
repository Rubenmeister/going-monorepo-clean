# 📱 PHASE 5: Messaging & Chat System Implementation Plan

**Status:** Ready to Start
**Duration:** 2-3 weeks
**Complexity:** Medium
**Estimated LOC:** 2,000 (backend) + 1,500 (frontend)
**Branch:** `claude/complete-going-platform-TJOI8`

---

## 🎯 Phase 5 Objectives

### Core Features

- **Real-time Chat System** with WebSocket (Socket.IO)
- **Ride Matching Algorithm** (geospatial, AI-like ranking)
- **Push Notifications** (FCM, APNS, SMS, Email)
- **In-app Notifications** with real-time delivery
- **Message Delivery Status** (sent, delivered, read)
- **Typing Indicators** & User Presence
- **Message History** with pagination

### Key APIs (8 Endpoints)

```
POST   /api/chats/rides/{rideId}/messages          - Send message
GET    /api/chats/rides/{rideId}/messages          - Get chat history
GET    /api/chats/rides/{rideId}/conversation/*    - Get conversation
PUT    /api/chats/messages/{messageId}/read        - Mark as read
POST   /api/rides/{rideId}/request-matching        - Start ride matching
GET    /api/rides/{rideId}/available-drivers       - List available drivers
PUT    /api/rides/{rideId}/matches/{driverId}/accept  - Accept ride
POST   /api/notifications/send                     - Send notification
```

---

## 🏗️ Architecture Overview

### Layered Architecture

```
Frontend (Next.js + React Native)
    ↓
API Gateway (WebSocket + REST)
    ↓
Use Cases Layer (SendMessage, MatchDrivers, SendNotification)
    ↓
Domain Layer (Message, RideMatch, Notification entities)
    ↓
Infrastructure (MongoDB, Redis, Firebase, Twilio)
```

### Database Collections

```
messages              - Chat messages (auto-expire in 30 days)
conversations         - Conversation metadata
ride_matches          - Driver matching results (TTL: 2 min)
notifications         - Push notifications (TTL: 7 days)
device_tokens         - Device registration for push
```

### Redis Structures

```
chat:active_users:{rideId}     - Set of online users
chat:typing:{rideId}:{userId}  - Typing indicator (3s expiry)
ride:available_drivers:{rid}   - Driver candidates (30s TTL)
rate_limit:messages:{userId}   - Rate limiting counter
notifications:unread:{userId}  - Unread count cache
```

---

## 📋 Implementation Breakdown (5 Phases)

### Phase 5.1: Domain Layer (Days 1-2)

**Core Entities & Value Objects**

Files to Create:

```
libs/domains/notification/core/src/lib/entities/
├── message.entity.ts              - Message domain logic
├── conversation.entity.ts         - Conversation metadata
└── notification.entity.ts         - Notification entity

libs/domains/transport/core/src/lib/entities/
└── ride-match.entity.ts           - Driver matching entity

libs/domains/*/core/src/lib/ports/
├── imessage.repository.ts         - Message persistence interface
├── ichat.gateway.ts               - WebSocket gateway interface
├── ipush-notification.gateway.ts  - Notification gateway interface
└── iride-match.repository.ts      - Match persistence interface
```

**Test Files:**

```
libs/domains/notification/core/src/lib/entities/message.entity.spec.ts
libs/domains/transport/core/src/lib/entities/ride-match.entity.spec.ts
```

**Expected LOC:** ~600 (entities + interfaces + tests)

---

### Phase 5.2: Application Layer - Use Cases (Days 2-4)

**Business Logic & Orchestration**

Files to Create:

```
libs/domains/notification/application/src/lib/use-cases/
├── send-message.use-case.ts              - Send chat message
├── get-conversation.use-case.ts          - Retrieve conversation
├── mark-message-as-read.use-case.ts      - Mark as read
└── send-push-notification.use-case.ts    - Send notifications

libs/domains/transport/application/src/lib/use-cases/
└── match-available-drivers.use-case.ts   - Matching algorithm

libs/domains/notification/application/src/lib/use-cases/
├── get-online-users.use-case.ts          - Get active users
└── get-chat-unread-count.use-case.ts     - Unread count
```

**Test Files:**

```
*.use-case.spec.ts (8-12 tests each)
```

**Expected LOC:** ~800 (use cases + tests)

---

### Phase 5.3: Infrastructure - Repositories (Days 4-5)

**Database Persistence**

Files to Create:

```
notifications-service/src/infrastructure/persistence/
├── mongo-message.repository.ts            - Message storage
├── mongo-conversation.repository.ts       - Conversation storage
└── notification.repository.ts             - Notification storage

transport-service/src/infrastructure/persistence/
└── mongo-ride-match.repository.ts         - Match storage

notifications-service/src/infrastructure/schemas/
├── message.extended.schema.ts             - Message schema
├── conversation.schema.ts                 - Conversation schema
├── notification.schema.ts                 - Notification schema
└── device-token.schema.ts                 - Device tokens

migrations/
├── 001-create-message-indexes.js
├── 002-create-ride-match-indexes.js
└── 003-create-notification-collection.js
```

**Expected LOC:** ~500 (repositories + schemas)

---

### Phase 5.4: Infrastructure - Gateways (Days 5-7)

**External Integrations & WebSocket**

Files to Create:

```
notifications-service/src/infrastructure/gateways/
├── chat.gateway.ts                        - WebSocket Chat (EXTEND)
├── firebase-push-notification.gateway.ts  - FCM for Android
├── apns-push-notification.gateway.ts      - APNS for iOS
├── sms-notification.gateway.ts            - Twilio SMS
├── email-notification.gateway.ts          - SendGrid Email
└── notification-queue.service.ts          - Bull job queue

transport-service/src/infrastructure/gateways/
└── ride-dispatch.gateway.ts               - Ride dispatch WebSocket
```

**WebSocket Events:**

```
Server → Client:
  chat:message:new                 - New message received
  chat:message:read                - Message read receipt
  chat:typing                      - User typing indicator
  chat:user:online/offline         - Presence updates
  ride:matches:available           - Driver match list
  ride:driver:accepted/rejected    - Match response
  notification:new                 - Push notification alert

Client → Server:
  chat:message:send                - Send message
  chat:message:read                - Mark as read
  chat:typing                      - Typing indicator
  ride:request-matching            - Start matching
  ride:match:accept/reject         - Response to match
```

**Expected LOC:** ~1,200 (gateways + WebSocket handlers)

---

### Phase 5.5: API Controllers & REST (Days 7-8)

**HTTP Endpoints**

Files to Create/Extend:

```
notifications-service/src/api/
├── chat.controller.ts             - Chat endpoints (EXTEND)
├── notification.controller.ts      - Notification endpoints (EXTEND)
└── device-token.controller.ts      - Device token management

transport-service/src/api/
└── ride-matching.controller.ts    - Ride matching endpoints

api-gateway/src/
└── chat/chat.gateway.ts           - Gateway WebSocket relay
```

**8 Key Endpoints:**

```
1. POST   /api/chats/rides/{rideId}/messages
2. GET    /api/chats/rides/{rideId}/messages
3. GET    /api/chats/rides/{rideId}/conversation/{userId}
4. PUT    /api/chats/messages/{messageId}/read
5. POST   /api/rides/{rideId}/request-matching
6. GET    /api/rides/{rideId}/available-drivers
7. PUT    /api/rides/{rideId}/matches/{driverId}/accept
8. POST   /api/notifications/send
```

**Expected LOC:** ~400 (controllers + tests)

---

### Phase 5.6: Frontend - Web (Days 9-11)

**React Components & Pages**

Files to Create:

```
frontend-webapp/src/app/components/chat/
├── ChatWindow.tsx                 - Main chat UI
├── MessageBubble.tsx              - Message component
├── ConversationList.tsx           - Conversation list
├── TypingIndicator.tsx            - Typing animation
└── DeliveryStatus.tsx             - Message status

frontend-webapp/src/app/components/rides/
├── DriverMatchCards.tsx           - Driver options
├── RideTracking.tsx               - Live tracking
└── MatchCountdown.tsx             - Timer component

frontend-webapp/src/app/components/notifications/
├── NotificationCenter.tsx         - Bell + dropdown
└── NotificationToast.tsx          - Toast notifications

frontend-webapp/src/app/(routes)/
├── chat/page.tsx                  - Chat page
├── rides/[rideId]/matching/page.tsx  - Matching page
└── rides/[rideId]/tracking/page.tsx  - Tracking page

frontend-webapp/src/services/
└── chat.service.ts                - WebSocket client
```

**Expected LOC:** ~1,200 (components + services)

---

### Phase 5.7: Mobile - React Native (Days 11-13)

**Native Chat & Matching**

Files to Create:

```
mobile-user-app/src/screens/
├── ChatScreen.tsx                 - Chat UI (native)
├── ConversationListScreen.tsx     - Conversation list
├── DriverMatchScreen.tsx          - Driver options
└── RideTrackingScreen.tsx         - Live tracking

mobile-driver-app/src/screens/
├── RideOfferScreen.tsx            - Incoming ride offer
├── ChatScreen.tsx                 - Chat UI
└── TripDetailsScreen.tsx          - Trip information

mobile/src/services/
├── push-notifications.service.ts  - FCM/APNS setup
├── chat-websocket.service.ts      - WebSocket client
└── offline-queue.service.ts       - Message queue (SQLite)
```

**Expected LOC:** ~800 (native components + services)

---

### Phase 5.8: Testing (Days 13-15)

**Comprehensive Test Coverage**

Test Files:

```
Unit Tests (50+ tests):
  ├── entities/*.spec.ts
  ├── use-cases/*.spec.ts
  ├── gateways/*.spec.ts
  └── repositories/*.spec.ts

Integration Tests (20+ tests):
  ├── api/*.spec.ts (endpoints)
  ├── chat.gateway.spec.ts (WebSocket)
  └── push-notifications.spec.ts

E2E Tests (10+ tests):
  ├── cypress/e2e/chat-flow.cy.ts
  ├── cypress/e2e/ride-matching.cy.ts
  └── cypress/e2e/notifications.cy.ts

Load Tests:
  ├── k6/chat-load.js (1000 concurrent users)
  ├── k6/matching-load.js (500 req/sec)
  └── k6/notifications-load.js (10k messages)

Performance Tests:
  └── performance/*.bench.ts
```

**Coverage Target:** 90%+ unit tests, 80%+ integration

**Expected LOC:** ~3,000 (test code)

---

## 📊 Project Timeline

```
Week 1:
  Day 1-2: Domain layer (entities, value objects, ports)
  Day 3-4: Application layer (use cases)
  Day 5: Infrastructure (repositories)

Week 2:
  Day 6-7: Infrastructure (gateways, WebSocket)
  Day 8: API controllers
  Day 9: Frontend (React components)
  Day 10: Testing foundation

Week 3:
  Day 11-12: Mobile implementation
  Day 13-15: Complete testing, load testing, documentation
  Day 16: Bug fixes, performance optimization
  Day 17: Final review, merge to main

Parallel Work:
  - Database migrations (Week 1)
  - Swagger documentation (ongoing)
  - Environment setup (Week 1)
```

---

## 🗂️ File Summary

### Total Files to Create: ~35

- Domain Layer: 8 files
- Application Layer: 8 files
- Infrastructure: 15 files
- API: 5 files
- Frontend Web: 12 files
- Mobile: 8 files
- Testing: 20+ files
- Configuration: 3 files

### Total Lines of Code: ~4,500

- Domain: ~600 LOC
- Application: ~800 LOC
- Infrastructure: ~1,700 LOC
- API: ~400 LOC
- Frontend Web: ~1,200 LOC
- Mobile: ~800 LOC

### Total Test Code: ~3,000 LOC

- Unit tests: ~1,500 LOC
- Integration tests: ~800 LOC
- E2E tests: ~700 LOC

---

## 🎯 Success Criteria (Definition of Done)

### Code Quality

- ✅ TypeScript strict mode enabled
- ✅ No eslint warnings
- ✅ No console.log in production code
- ✅ Code review approved (2 reviewers)

### Testing

- ✅ 90%+ unit test coverage
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ Load tests: <500ms p99 latency
- ✅ Performance benchmarks met

### Features

- ✅ All 8 API endpoints working
- ✅ Chat system fully functional
- ✅ Ride matching algorithm complete
- ✅ Push notifications (all platforms) working
- ✅ WebSocket real-time features working
- ✅ Message history persistence
- ✅ Offline support (mobile)

### Performance

- ✅ Message send: <100ms (p99)
- ✅ Message retrieval: <50ms (p99)
- ✅ WebSocket delivery: <50ms
- ✅ Matching algorithm: <500ms
- ✅ Database queries: <100ms (p99)

### Security

- ✅ OWASP Top 10 compliance
- ✅ JWT authentication
- ✅ Rate limiting (60 msgs/min per user)
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection

### Documentation

- ✅ API documentation (Swagger)
- ✅ Architecture Decision Records
- ✅ Setup guide
- ✅ Deployment guide
- ✅ Inline code comments

### Production Ready

- ✅ Error handling comprehensive
- ✅ Logging at all critical points
- ✅ Health checks working
- ✅ Graceful shutdown
- ✅ Database backups
- ✅ Monitoring (Sentry)

---

## 🚀 Next Steps

1. **Prepare Environment**

   - [ ] Create feature branch: `phase5/messaging-chat`
   - [ ] Install new dependencies (Firebase, Twilio, etc.)
   - [ ] Set up environment variables

2. **Start Domain Layer**

   - [ ] Create Message entity
   - [ ] Create RideMatch entity
   - [ ] Create Value Objects
   - [ ] Create Repository interfaces

3. **Database Setup**

   - [ ] Create MongoDB schemas
   - [ ] Create migration scripts
   - [ ] Test indexes

4. **Begin Implementation**
   - [ ] Follow step-by-step plan above
   - [ ] Daily commits with clear messages
   - [ ] Test-driven development (TDD)
   - [ ] Regular code reviews

---

## 📚 References

**Related Documentation:**

- `PHASE4_COMPLETE.md` - Previous phase implementation
- `PRODUCTION_READINESS_CHECKLIST.md` - Quality standards
- `QUICK_START.md` - Development setup
- `API.md` - API documentation

**Key Technologies:**

- Socket.IO (WebSocket library)
- Firebase Cloud Messaging (FCM)
- MongoDB geospatial queries
- Redis for caching & presence
- Bull for job queue

**External Services:**

- Firebase (push notifications)
- Twilio (SMS)
- SendGrid (email)
- Google Maps API (geolocation/ETA)

---

**Status:** Ready to Start Phase 5 🚀
**Estimated Completion:** 2-3 weeks
**Production Ready:** Yes (with proper testing)

---

Last Updated: February 19, 2026
Branch: `claude/complete-going-platform-TJOI8`
