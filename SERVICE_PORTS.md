# Service Ports & Configuration

This document defines all service ports and how they communicate in the Going Monorepo.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  • frontend-webapp (Next.js) - port managed by Nx           │
│  • admin-dashboard (Next.js) - port managed by Nx           │
│  • mobile-user-app (React Native + Expo)                    │
│  • mobile-driver-app (React Native + Expo)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌──────────────┐
                    │ API Gateway  │
                    │  port 3000   │
                    └──────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Microservices Layer                       │
├─────────────────────────────────────────────────────────────┤
│  User Authentication & Core Services                         │
│  ├─ user-auth-service .......................... port 3009   │
│  ├─ payment-service ............................. port 3001   │
│  └─ tracking-service ............................ port 3008   │
│                                                              │
│  Domain-Specific Services                                    │
│  ├─ anfitriones-service (Accommodations) ........ port 3003   │
│  ├─ experiencias-service (Experiences) .......... port 3004   │
│  ├─ tours-service .............................. port 3005   │
│  ├─ transport-service .......................... port 3006   │
│  ├─ envios-service (Parcels/Shipments) ......... port 3007   │
│  ├─ notifications-service ..................... port 3008   │
│  └─ booking-service ........................... port 3010   │
└─────────────────────────────────────────────────────────────┘
```

## Service Port Mapping

| Service | Port | Protocol | Database | Role |
|---------|------|----------|----------|------|
| **API Gateway** | 3000 | HTTP | N/A | Entry point, JWT validation, routing |
| **Payment Service** | 3001 | HTTP | MongoDB | Stripe integration, payment processing |
| **Anfitriones Service** | 3003 | HTTP | N/A | Accommodations & hosts management |
| **Experiencias Service** | 3004 | HTTP | N/A | Experiences & activities |
| **Tours Service** | 3005 | HTTP | N/A | Tours management |
| **Transport Service** | 3006 | HTTP | N/A | Transportation services |
| **Envios Service** | 3007 | HTTP | N/A | Parcels & shipments |
| **Notifications Service** | 3008 | HTTP | N/A | Email, SMS, push notifications |
| **Tracking Service** | 3008 | HTTP + WebSocket | Redis | Real-time tracking |
| **User Auth Service** | 3009 | HTTP | N/A | JWT token generation & validation |
| **Booking Service** | 3010 | HTTP | N/A | Booking management & reservations |

## Environment Configuration Files

Each service requires a `.env` file with the following structure:

### api-gateway/.env
```env
PORT=3000
JWT_SECRET=tu_secreto_jwt_muy_largo_y_seguro
JWT_EXPIRES_IN=1d

# Microservice URLs
USER_AUTH_SERVICE_URL=http://localhost:3009
TRANSPORT_SERVICE_URL=http://localhost:3006
BOOKING_SERVICE_URL=http://localhost:3010
PAYMENT_SERVICE_URL=http://localhost:3001
ANFITRIONES_SERVICE_URL=http://localhost:3003
EXPERIENCIAS_SERVICE_URL=http://localhost:3004
TOURS_SERVICE_URL=http://localhost:3005
ENVIOS_SERVICE_URL=http://localhost:3007
NOTIFICATIONS_SERVICE_URL=http://localhost:3008
TRACKING_SERVICE_URL=http://localhost:3008
```

### payment-service/.env
```env
PORT=3001
PAYMENT_DB_URL=mongodb://localhost:27017/payment-db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### tracking-service/.env
```env
PORT=3008
REDIS_URL=redis://localhost:6379
```

## API Gateway Routes

The API Gateway routes requests to microservices based on URL paths:

| Path | Service | Port | Auth Required |
|------|---------|------|---------------|
| `/api/auth/*` | user-auth-service | 3009 | ❌ Public |
| `/api/transport/*` | transport-service | 3006 | ✅ Yes |
| `/api/payments/*` | payment-service | 3001 | ✅ Yes |
| `/api/tours/*` | tours-service | 3005 | ✅ Yes |
| `/api/accommodations/*` | anfitriones-service | 3003 | ✅ Yes |
| `/api/experiences/*` | experiencias-service | 3004 | ✅ Yes |
| `/api/parcels/*` | envios-service | 3007 | ✅ Yes |
| `/api/notifications/*` | notifications-service | 3008 | ✅ Yes |
| `/api/tracking/*` | tracking-service | 3008 | ✅ Yes |
| `/api/bookings/*` | booking-service | 3010 | ✅ Yes |

## Running Services Locally

### Start All Services (Terminal 1: API Gateway)
```bash
npm run dev api-gateway
# Runs on http://localhost:3000
```

### Terminal 2: User Auth Service
```bash
npm run dev user-auth-service
# Runs on http://localhost:3009
```

### Terminal 3: Frontend
```bash
npm run dev:webapp
# Connects to API Gateway on http://localhost:3000
```

### Run All Backend Services
```bash
# Parallel execution using tmux or screen
for service in user-auth-service payment-service anfitriones-service \
                experiencias-service tours-service transport-service \
                envios-service notifications-service tracking-service \
                booking-service; do
  npm run dev $service &
done
```

## Database Configuration

### MongoDB (Payment Service)
- Default: `mongodb://localhost:27017/payment-db`
- Connection string in: `payment-service/.env`
- Database: payment-db
- Collections: payments, transactions, webhooks

### Redis (Tracking Service)
- Default: `redis://localhost:6379`
- Connection string in: `tracking-service/.env`
- Used for: WebSocket state, real-time tracking

## Testing Services

### E2E Tests with Correct Ports
Each service has E2E tests configured to use the correct port:

```bash
# API Gateway E2E tests (port 3000)
npm run test:e2e api-gateway-e2e

# User Auth Service E2E tests (port 3009)
npm run test:e2e user-auth-service-e2e

# Payment Service E2E tests (port 3001)
npm run test:e2e payment-service-e2e
```

### Cypress Configuration
Global Cypress configuration is in `cypress.config.json` with service URLs:

```json
{
  "env": {
    "apiGateway": "http://localhost:3000",
    "userAuthService": "http://localhost:3009",
    "paymentService": "http://localhost:3001",
    "bookingService": "http://localhost:3010",
    ...
  }
}
```

## Docker Compose (Upcoming)

To run all services with Docker:

```bash
docker-compose up -d
```

This will start:
- All microservices on their designated ports
- MongoDB for payment-service
- Redis for tracking-service
- API Gateway as the entry point

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Service Connection Failed
1. Verify `.env` file exists in the service directory
2. Check service is running: `curl http://localhost:3009/health`
3. Verify API Gateway has correct SERVICE_URL in its `.env`
4. Check firewall rules

### JWT Validation Errors
- Ensure `JWT_SECRET` is identical in all services
- Verify token expiration in `JWT_EXPIRES_IN`
- Check Bearer token format in requests

## Production Deployment

For production:
1. Update service URLs to production server addresses
2. Use environment-specific `.env.production` files
3. Configure Redis/MongoDB with production instances
4. Set up load balancing for the API Gateway
5. Implement rate limiting and CORS policies

See `DEPLOYMENT.md` for detailed instructions.

## Recent Changes (v1.1.0)

- ✅ Fixed port conflict: experiencias-service 3000 → 3004
- ✅ Fixed port conflict: notifications-service 3007 → 3008
- ✅ Fixed API Gateway tracking URL: 3009 → 3008
- ✅ Updated all E2E tests with correct service ports
- ✅ Created `.env` files for all services
- ✅ Added Node.js version requirement (18.20.0+)
- ✅ Unified package manager to pnpm

## Related Documentation

- `DESIGN_SYSTEM.md` - UI components and design patterns
- `IMPLEMENTATION_GUIDE.md` - Implementation guidelines
- `QUICK_START.md` - Quick start guide
- `SETUP.md` - Development environment setup
