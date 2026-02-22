# P1-4: Test Coverage Strategy & Implementation Guide

## Overview

This document outlines the test coverage strategy for the Going Platform monorepo, aiming to achieve **60%+ global coverage** with higher thresholds for critical services.

## Current State Analysis

### Coverage Baseline

| Metric                 | Current     | Target                | Gap           |
| ---------------------- | ----------- | --------------------- | ------------- |
| Total Test Files       | 92          | 150+                  | +58+          |
| Services with Tests    | 12/25 (48%) | 20/25 (80%)           | +8 services   |
| Services without Tests | 13/25 (52%) | <5%                   | -12 services  |
| Global Coverage        | ~25-35%     | 60%+                  | +25-35%       |
| Critical Thresholds    | 1 service   | All critical services | Full coverage |

### Test File Distribution

```
Unit Tests:           87 files
Integration Tests:     7 files
E2E Tests:           13 projects
Performance Tests:    1 file
Security Tests:      1 file
Frontend Tests:      10 files (minimal coverage)
---
Total:             92+ files
```

## Coverage Thresholds by Service Type

### Critical Services (80%+ threshold)

These services handle sensitive operations and require maximum coverage:

- **security-service**: Authentication, authorization, encryption
- **payment-service**: Payment processing, financial transactions
- **auth-service**: User authentication, JWT, password management
- **tracking-service**: Location data, privacy-sensitive

```typescript
// Jest Config for critical services
{
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    }
  }
}
```

### Core Services (70%+ threshold)

These services are essential to platform functionality:

- **transport-service**: Ride matching, dispatching
- **booking-service**: Reservation system
- **notifications-service**: Communication channels
- **payment-service**: Transaction management

```typescript
{
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    }
  }
}
```

### Standard Services (60%+ threshold)

General platform services with standard coverage requirements:

- **accommodation-service**: Property listings
- **ratings-service**: Review system
- **analytics-service**: Metrics and reporting
- **tours-service**: Tour management
- **other-services**: Feature services

```typescript
{
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    }
  }
}
```

### Global Minimum (60%)

All services must meet the global minimum threshold:

```typescript
{
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    }
  }
}
```

## Test Structure & Organization

### Directory Structure

```
service/
├── src/
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── __tests__/
│   │   │   │   ├── create-booking.use-case.spec.ts
│   │   │   │   └── update-booking.use-case.spec.ts
│   │   │   ├── create-booking.use-case.ts
│   │   │   └── update-booking.use-case.ts
│   │   └── services/
│   │       ├── __tests__/
│   │       │   └── booking.service.spec.ts
│   │       └── booking.service.ts
│   ├── domain/
│   │   ├── __tests__/
│   │   │   ├── booking.aggregate.spec.ts
│   │   │   └── booking.value-object.spec.ts
│   │   ├── aggregates/
│   │   └── value-objects/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── __tests__/
│   │   │   │   └── mongo-booking.repository.spec.ts
│   │   │   └── mongo-booking.repository.ts
│   │   └── gateways/
│   │       ├── __tests__/
│   │       │   └── payment.gateway.spec.ts
│   │       └── payment.gateway.ts
│   └── api/
│       ├── __tests__/
│       │   ├── booking.controller.spec.ts
│       │   └── booking.resolver.spec.ts
│       └── booking.controller.ts
├── jest.config.cjs
└── tsconfig.spec.json
```

### Test File Naming Conventions

```
✅ Correct:
- my.service.spec.ts           (Single file unit test)
- my.service.unit.spec.ts      (Explicit unit test)
- my.service.integration.spec.ts (Integration test)
- my.e2e.spec.ts               (E2E test)
- my.spec.ts                   (Generic spec)

❌ Incorrect:
- my-spec.ts                   (Missing .spec in name)
- my.test.ts                   (Wrong extension for Jest)
- spec.my.ts                   (Wrong order)
```

## Testing by Layer

### 1. Domain Layer Tests (30% of total tests)

**Purpose**: Test business logic in isolation

**Coverage Focus**:

- Aggregate entities
- Value objects
- Domain rules and validations
- Business logic

**Example**:

```typescript
describe('Booking Aggregate', () => {
  it('should create booking with valid data', () => {
    const booking = Booking.create({
      userId: 'user123',
      serviceId: 'service456',
      startDate: new Date(),
      endDate: new Date(),
    });

    expect(booking.isSuccess).toBe(true);
    expect(booking.value.userId).toBe('user123');
  });

  it('should reject booking with invalid date range', () => {
    const booking = Booking.create({
      userId: 'user123',
      serviceId: 'service456',
      startDate: new Date('2024-12-31'),
      endDate: new Date('2024-12-01'),
    });

    expect(booking.isFailure).toBe(true);
  });
});
```

### 2. Application Layer Tests (20% of total tests)

**Purpose**: Test use cases and orchestration

**Coverage Focus**:

- Use case execution
- Service coordination
- Transaction management
- Error handling

**Example**:

```typescript
describe('CreateBookingUseCase', () => {
  let useCase: CreateBookingUseCase;
  let bookingRepo: BookingRepository;

  beforeEach(() => {
    bookingRepo = {
      save: jest.fn(),
    } as any;
    useCase = new CreateBookingUseCase(bookingRepo);
  });

  it('should create booking successfully', async () => {
    const result = await useCase.execute({
      userId: 'user123',
      serviceId: 'service456',
      startDate: new Date(),
      endDate: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    expect(bookingRepo.save).toHaveBeenCalled();
  });
});
```

### 3. Infrastructure Layer Tests (25% of total tests)

**Purpose**: Test database, external integrations

**Coverage Focus**:

- Repository implementations
- Query correctness
- Error handling
- External service integration

**Example**:

```typescript
describe('MongoBookingRepository', () => {
  let repository: MongoBookingRepository;
  let model: any;

  beforeEach(() => {
    model = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };
    repository = new MongoBookingRepository(model);
  });

  it('should find booking by ID', async () => {
    const mockBooking = { id: 'booking123', userId: 'user123' };
    model.findOne.mockResolvedValue(mockBooking);

    const result = await repository.findById('booking123');

    expect(result.value).toEqual(mockBooking);
    expect(model.findOne).toHaveBeenCalledWith({ id: 'booking123' });
  });
});
```

### 4. API/Controller Layer Tests (15% of total tests)

**Purpose**: Test HTTP endpoints, request/response handling

**Coverage Focus**:

- Request validation
- Response formatting
- Status codes
- Error responses

**Example**:

```typescript
describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  beforeEach(async () => {
    service = {
      createBooking: jest.fn(),
      getBooking: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [{ provide: BookingService, useValue: service }],
    }).compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should create booking via POST', async () => {
    const dto = { userId: 'user123', serviceId: 'service456' };
    service.createBooking.mockResolvedValue({ id: 'booking123' });

    const result = await controller.createBooking(dto);

    expect(result.id).toBe('booking123');
  });
});
```

### 5. Integration Tests (10% of total tests)

**Purpose**: Test service-to-service communication

**Coverage Focus**:

- Multi-service workflows
- Event propagation
- Data consistency
- Error recovery

**Example**:

```typescript
describe('Create Booking Workflow', () => {
  it('should create booking and update availability', async () => {
    const bookingId = await bookingService.create(bookingData);
    const availability = await availabilityService.getAvailability(serviceId);

    expect(availability.available).toBe(false);
  });
});
```

## Tests Added in P1-4

### 1. Pagination Utilities Tests ✅

**File**: `/libs/shared/database/src/utils/pagination.utils.spec.ts`

**Coverage**:

- getPaginationOptions: 100%
- calculatePaginationMetadata: 100%
- createPaginatedResponse: 100%
- encodeCursor: 100%
- decodeCursor: 100%
- buildSortOptions: 100%
- Integration tests: pagination flows

**Test Count**: 30+ test cases

**Example Tests**:

```typescript
✅ getPaginationOptions
  - Returns default pagination when no params
  - Handles page parameter correctly
  - Enforces max limit of 100
  - Handles skip override

✅ calculatePaginationMetadata
  - Calculates for first/middle/last page
  - Handles exact division
  - Handles zero items

✅ Cursor Encoding/Decoding
  - Encodes/decodes strings, numbers, dates
  - Round-trip consistency

✅ Integration
  - Complete pagination flow (page 1, 2, 3)
  - Pagination with sorting
  - Large dataset handling
```

### 2. Redis Pool Service Tests ✅

**File**: `/libs/shared/infrastructure/src/services/redis-pool.service.spec.ts`

**Coverage**:

- Service initialization: 100%
- Configuration management: 100%
- TTL strategies: 100%
- Pool sizing: 100%
- Store options: 100%
- Retry strategy: 100%

**Test Count**: 35+ test cases

**Example Tests**:

```typescript
✅ Configuration
  - getConfig returns current config
  - getTTL for different key types
  - getStoreOptions with all settings

✅ TTL Strategies
  - Three strategies defined (aggressive/balanced/conservative)
  - Longer TTLs in conservative vs aggressive
  - Reasonable TTL values

✅ Recommended Configurations
  - Production: higher connections, longer timeouts
  - Staging: medium settings
  - Development: lower resource usage

✅ Retry Strategy
  - Exponential backoff implementation
  - Maximum delay capped at 2s
✅ Health Checks
  - Module init/destroy lifecycle
  - Interval cleanup
```

### 3. Repository Pagination Tests (In Progress)

**Target Repositories**:

- MongooseAccommodationRepository.findByHostIdPaginated
- MongoPaymentRepository.findByPassengerPaginated
- MongoRideRepository.findByUserIdPaginated
- MongoBookingRepository.findByUserIdPaginated
- MongoTrackingRepository.findByUserIdPaginated

**Coverage Target**: 80% per repository

## Implementation Checklist

### Phase 1: Foundation (COMPLETE)

- [x] Pagination utilities (30+ tests)
- [x] Redis pool service (35+ tests)
- [x] Coverage configuration setup

### Phase 2: Core Services (Next)

- [ ] Accommodation service pagination tests
- [ ] Booking service pagination tests
- [ ] Payment service pagination tests
- [ ] Transport service pagination tests
- [ ] Tracking service pagination tests
- [ ] Total: ~50+ new tests

### Phase 3: Critical Services (Next)

- [ ] Security service (complete from scratch)
- [ ] Auth service enhancements
- [ ] Payment gateway integration tests
- [ ] Total: ~40+ new tests

### Phase 4: General Coverage

- [ ] Remaining 8 services without tests
- [ ] Frontend domain libraries
- [ ] Integration test expansion
- [ ] Total: ~60+ new tests

### Phase 5: Special Categories

- [ ] Performance test coverage
- [ ] Security test coverage
- [ ] E2E test implementation

## Jest Configuration Template

```typescript
// jest.config.cjs (for each service)
module.exports = {
  displayName: 'service-name',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.d.ts',
  ],

  coverageDirectory: '../../coverage/service-name',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],

  // Set thresholds based on service type
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests for specific service
npm test -- payment-service

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run integration tests only
npm run test:integration
```

### CI/CD Integration

```bash
# Generate coverage report
npm test -- --coverage --collectCoverageFrom='**' --coverageReporters=lcov

# Enforce coverage thresholds
npm test -- --collectCoverage

# Generate HTML coverage report
npm test -- --coverage --coverageReporters=html
```

## Coverage Tools & Reporting

### Istanbul (nyc)

```bash
# Generate detailed coverage report
nyc npm test

# Generate HTML report
nyc npm test && open coverage/index.html
```

### Coverage Badges

```markdown
![Coverage](https://img.shields.io/badge/coverage-65%25-green)
```

## Best Practices

### 1. Meaningful Test Names

```typescript
✅ Good
it('should create booking when dates are valid and service is available', () => {})

❌ Bad
it('should work', () => {})
```

### 2. Test Isolation

```typescript
✅ Good: Each test is independent
it('should save booking', async () => {
  const booking = await createBooking();
  expect(booking.id).toBeDefined();
});

❌ Bad: Tests depend on each other
let bookingId: string;
it('step 1: create', () => { bookingId = 123; });
it('step 2: update', () => { updateBooking(bookingId); });
```

### 3. Mock External Dependencies

```typescript
✅ Good: Mocked database
const mockRepo = {
  save: jest.fn(),
};

❌ Bad: Real database in tests
const repo = new MongoBookingRepository();
```

### 4. Arrange-Act-Assert Pattern

```typescript
✅ Good: Clear structure
it('should calculate total price', () => {
  // Arrange
  const booking = createBooking({ nights: 2, pricePerNight: 100 });

  // Act
  const total = booking.calculateTotal();

  // Assert
  expect(total).toBe(200);
});
```

## Monitoring Coverage

### Code Coverage Trends

Monitor coverage metrics over time:

```bash
# Compare coverage between commits
git diff HEAD~1 coverage/coverage-summary.json
```

### Coverage Gaps Report

Identify files below thresholds:

```bash
# Generate coverage report
npm test -- --coverage

# Files with coverage < 60%
cat coverage/coverage-summary.json | grep -v '"lines": [6-9][0-9]'
```

## Summary

| Component              | Status         | Details                           |
| ---------------------- | -------------- | --------------------------------- |
| **Pagination Utils**   | ✅ Complete    | 30+ test cases (100% coverage)    |
| **Redis Pool Service** | ✅ Complete    | 35+ test cases (100% coverage)    |
| **Coverage Config**    | ✅ Complete    | Tiered thresholds by service type |
| **Core Services**      | 🔄 In Progress | 50+ tests planned                 |
| **Critical Services**  | 🔄 Planned     | 40+ tests planned                 |
| **Other Services**     | 🔄 Planned     | 60+ tests planned                 |
| **Global Target**      | 🎯 60%+        | Expected by integration phase     |

---

**Next Steps**: Implement pagination tests for core repositories, then security/critical service tests.
