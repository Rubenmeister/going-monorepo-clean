# CLAUDE.md

## Project Overview

**going-monorepo-clean** is an Nx monorepo for a multi-service travel/logistics platform. It includes backend microservices (NestJS), web frontends (Next.js), and mobile apps (React Native). The platform handles transportation, bookings, payments, accommodations, tours, experiences, shipments, notifications, and real-time tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo tooling | Nx 22.0.3 |
| Package manager | npm |
| Language | TypeScript 5.9 |
| Backend framework | NestJS 11 |
| Web framework | Next.js 15.2 (React 19) |
| Mobile framework | React Native 0.79 |
| Database | MongoDB (Mongoose ODM) |
| Cache/Realtime | Redis |
| CSS | Tailwind CSS 3.4 |
| Testing | Jest 30, Vitest 3, Playwright 1.36 |
| Linting | ESLint 9 (flat config), Prettier |
| Build tools | Webpack, Vite, SWC, Metro |
| Auth | JWT via Passport.js |
| Payments | Stripe |

## Repository Structure

```
/                           # Nx workspace root
├── api-gateway/            # API Gateway - routes requests to microservices
├── user-auth-service/      # Authentication & user management
├── payment-service/        # Payment processing (Stripe)
├── booking-service/        # Booking management
├── transport-service/      # Transportation logistics
├── anfitriones-service/    # Host/accommodation service
├── experiencias-service/   # Experiences service
├── tours-service/          # Tour scheduling
├── notifications-service/  # Push notifications (WebSocket)
├── tracking-service/       # Real-time location tracking (WebSocket + Redis)
├── envios-service/         # Shipment/parcel delivery
├── admin-dashboard/        # Next.js admin panel
├── frontend-webapp/        # Next.js user-facing web app
├── mobile-driver-app/      # React Native driver app
├── mobile-user-app/        # React Native user app
├── *-e2e/                  # Playwright E2E tests (one per service/app)
├── libs/                   # Shared libraries
│   ├── shared/
│   │   ├── domain/         # @going-monorepo-clean/shared-domain
│   │   └── ui/             # @going-monorepo-clean/shared-ui
│   ├── frontend/
│   │   ├── providers/      # @going-monorepo-clean/frontend-providers
│   │   └── hooks/
│   ├── domains/
│   │   ├── user/           # User domain (core + application layers)
│   │   ├── accommodation/  # Accommodation domain (core + application)
│   │   ├── payment/        # Payment domain
│   │   ├── transport/      # Transport domain
│   │   ├── tour/           # Tour domain
│   │   ├── experience/     # Experience domain
│   │   ├── booking-frontend/
│   │   ├── *-frontend/     # Frontend-specific domain implementations
│   │   └── ...
│   ├── accommodation/      # Accommodation entity library
│   ├── transport/          # Transport entity library
│   ├── tour/               # Tour entity library
│   ├── payment/            # Payment entity library
│   ├── experience/         # Experience entity library
│   ├── parcel/             # Parcel entity library
│   └── ...
├── nx.json                 # Nx workspace config
├── tsconfig.base.json      # Base TypeScript config with path aliases
├── eslint.config.mjs       # Root ESLint flat config
├── jest.config.ts          # Root Jest config
├── jest.preset.js          # Jest preset for Nx
├── .prettierrc             # Prettier config (singleQuote: true)
└── .github/workflows/ci.yml
```

## Common Commands

All tasks should be run through Nx, not underlying tooling directly.

```bash
# Run a specific project's target
npx nx run <project>:<target>         # e.g., npx nx run user-auth-service:build

# Build
npx nx run <project>:build            # Build a single project
npx nx run-many -t build              # Build all projects
npx nx affected -t build              # Build only affected projects

# Test
npx nx run <project>:test             # Unit tests for one project
npx nx run-many -t test               # Test all projects
npx nx affected -t test               # Test only affected projects

# Lint
npx nx run <project>:lint             # Lint a single project
npx nx affected -t lint               # Lint only affected projects

# E2E
npx nx run <project>-e2e:e2e          # Run E2E tests for a project

# Serve/Dev
npx nx run <project>:serve            # Start a backend service
npx nx run <project>:dev              # Start a Next.js app in dev mode

# Mobile
npx nx run mobile-user-app:run-ios
npx nx run mobile-user-app:run-android
npx nx run mobile-driver-app:run-ios
npx nx run mobile-driver-app:run-android

# Dependency graph
npx nx graph                          # Visual project dependency graph
```

## Architecture

### Microservices (Backend)

All backend services use NestJS and follow a consistent internal structure:

```
<service>/src/
├── main.ts                # Entry point, bootstraps NestJS app
├── app.module.ts          # Root module
├── api/                   # Controllers (HTTP layer)
├── app/                   # Application logic / use cases
└── infrastructure/        # Database schemas, persistence, external services
    ├── persistence/       # Repository implementations
    ├── services/          # External service integrations
    └── *.schema.ts        # Mongoose schemas
```

Each service runs on its own port and has its own MongoDB database. The API Gateway proxies requests to services using `http-proxy-middleware`.

**Service ports:**
| Service | Port |
|---------|------|
| api-gateway | 3000 |
| payment-service | 3001 |
| anfitriones-service | 3003 |
| experiencias-service | 3004 |
| tours-service | 3005 |
| transport-service | 3006 |
| envios-service | 3007 |
| notifications-service | 3008 |
| user-auth-service | 3009 |
| booking-service | 3010 |

### Domain Libraries (DDD)

Domain libraries under `libs/domains/<domain>/` follow Domain-Driven Design with hexagonal architecture:

- **core/** - Domain layer: entities, value objects, ports (interfaces), use cases
- **application/** - Application layer: DTOs, application-level use cases
- **`*-frontend/`** - Frontend-specific implementations: entities, ports, use cases for UI consumption

### API Gateway Pattern

The `api-gateway` is the single entry point:
- Validates JWT tokens at the gateway level before proxying
- Routes requests to microservices via URL prefix: `/api/{service}/*`
- Handles WebSocket upgrades for tracking and notifications

### Authentication Flow

1. Register/login via `/api/auth` -> `user-auth-service`
2. Service returns a JWT token
3. Client sends `Authorization: Bearer <token>` header
4. API Gateway validates JWT via Passport.js strategy
5. Request forwarded to target microservice

### Real-time Features

- **tracking-service**: WebSocket connections for live location updates, backed by Redis
- **notifications-service**: WebSocket-based push notifications

## Library Path Aliases

Defined in `tsconfig.base.json`:

```
@going-monorepo-clean/shared-domain     -> libs/shared/domain/src/index.ts
@going-monorepo-clean/domains-user-core -> libs/domains/user/core/src/index.ts
@going-monorepo-clean/domains-user-application -> libs/domains/user/application/src/index.ts
@going-monorepo-clean/frontend-providers -> libs/frontend/providers/src/index.ts
@going-monorepo-clean/shared-ui         -> libs/shared/ui/src/index.ts
accommodation                           -> libs/accommodation/src/index.ts
transport                               -> libs/transport/src/index.ts
tour                                    -> libs/tour/src/index.ts
payment                                 -> libs/payment/src/index.ts
experience                              -> libs/experience/src/index.ts
parcel                                  -> libs/parcel/src/index.ts
```

## Code Conventions

### TypeScript
- Target: ES2020
- Module: ESNext
- Strict decorator metadata enabled (`emitDecoratorMetadata`, `experimentalDecorators`)
- Path aliases use `@going-monorepo-clean/` prefix for scoped libs

### ESLint
- Flat config format (`eslint.config.mjs`)
- Nx module boundary enforcement enabled (`@nx/enforce-module-boundaries`)
- Each project may have its own `eslint.config.mjs` extending the root

### Prettier
- Single quotes (`singleQuote: true`)

### Testing
- **Unit tests**: Jest (`.spec.ts` files colocated with source) or Vitest
- **E2E tests**: Playwright in dedicated `*-e2e` projects
- **HTTP testing**: Supertest for NestJS controller/integration tests
- Jest config excludes E2E directories from unit test runs

### Environment Variables
- Each service uses `@nestjs/config` with `ConfigModule.forRoot({ isGlobal: true })`
- `.env.example` files document required variables (present in api-gateway, payment-service, tracking-service)
- Pattern: `<SERVICE_NAME>_DB_URL` for MongoDB connections, `<SERVICE>_SERVICE_URL` for inter-service communication
- Never commit `.env` files; use `.env.example` as reference

### Docker
- Multi-stage builds: Node 20-slim (builder) -> Node 20-alpine (production)
- Build arg `SERVICE_NAME` selects which Nx project to build
- Production image runs `node dist/main.js`

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Triggers on push to `main` and PRs targeting `main`
- Node.js 20 on Ubuntu
- Uses `nx affected` to only test/lint/build changed projects
- Steps: checkout (full history) -> setup Nx -> setup Node -> npm install -> affected:test -> affected:lint -> affected:build

## Key Dependencies

- **neverthrow** - Functional error handling (Result types)
- **rxjs** - Reactive programming (used extensively in NestJS)
- **axios** / `@nestjs/axios` - HTTP client for inter-service communication
- **@nestjs/mongoose** - MongoDB integration
- **uuid** - ID generation
- **http-proxy-middleware** - API Gateway request proxying

## Adding New Code

### New microservice
```bash
npx nx g @nx/nest:app <service-name>
```
Follow the existing pattern: `api/`, `app/`, `infrastructure/` directories. Add a Dockerfile, `.env.example`, and register the service URL in the API Gateway.

### New library
```bash
npx nx g @nx/js:lib libs/<category>/<name>
```
Add a path alias in `tsconfig.base.json`. Export public API via `src/index.ts`.

### New domain library
Create under `libs/domains/<domain>/` with `core/` and `application/` subdirectories. Follow the hexagonal architecture: entities and ports in core, DTOs and use cases in application.

### New frontend app
```bash
npx nx g @nx/next:app <app-name>    # Web app
npx nx g @nx/react-native:app <app-name>  # Mobile app
```
