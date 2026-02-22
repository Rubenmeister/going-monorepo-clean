# P1-1: Database Pagination Implementation Guide

## Overview

This document describes the pagination implementation strategy for the Going Platform monorepo. Database pagination is critical for:

- **Performance**: Prevents loading large result sets into memory
- **User Experience**: Enables smooth browsing of large datasets
- **Scalability**: Reduces database load and improves response times

## Implementation Pattern

All pagination follows a standard pattern using utilities from `@going-monorepo-clean/shared-database`:

### Core Utilities

**Location**: `/libs/shared/database/src/utils/pagination.utils.ts`

#### Key Types:

```typescript
export interface PaginationDto {
  page?: number; // Page number (1-indexed)
  limit?: number; // Items per page (max 100)
  skip?: number; // Manual skip override
  sort?: Record<string, 1 | -1>; // Sort options
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

#### Key Functions:

```typescript
// Get skip/limit values from pagination DTO
getPaginationOptions(pagination?: PaginationDto): { skip: number; limit: number }

// Create paginated response with metadata
createPaginatedResponse<T>(
  data: T[],
  total: number,
  skip: number,
  limit: number
): PaginatedResult<T>
```

## Implementation Steps

### Step 1: Add Import

```typescript
import {
  PaginationDto,
  PaginatedResult,
  getPaginationOptions,
  createPaginatedResponse,
} from '@going-monorepo-clean/shared-database';
```

### Step 2: Create Paginated Methods

For each method that returns multiple results, create a `*Paginated` variant:

#### Pattern: Simple Find Methods

```typescript
// Original method (keep for backwards compatibility)
async findByUserId(userId: string): Promise<any[]> {
  const docs = await this.model.find({ userId }).exec();
  return docs.map(this.mapToEntity);
}

// New paginated method
async findByUserIdPaginated(
  userId: string,
  pagination?: PaginationDto
): Promise<PaginatedResult<any>> {
  const { skip, limit } = getPaginationOptions(pagination);

  // Use Promise.all for parallel execution
  const [docs, total] = await Promise.all([
    this.model
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.model.countDocuments({ userId }),
  ]);

  return createPaginatedResponse(
    docs.map(this.mapToEntity),
    total,
    skip,
    limit
  );
}
```

#### Pattern: With Sorting

```typescript
async findByUserIdPaginated(
  userId: string,
  pagination?: PaginationDto
): Promise<PaginatedResult<any>> {
  const { skip, limit } = getPaginationOptions(pagination);
  const sort = pagination?.sort || { createdAt: -1 };

  const [docs, total] = await Promise.all([
    this.model
      .find({ userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.model.countDocuments({ userId }),
  ]);

  return createPaginatedResult(
    docs.map(this.mapToEntity),
    total,
    skip,
    limit
  );
}
```

#### Pattern: With Complex Filters

```typescript
async searchPaginated(
  filters: SearchFilters,
  pagination?: PaginationDto
): Promise<PaginatedResult<Accommodation>> {
  const { skip, limit } = getPaginationOptions(pagination);

  const query: any = { status: 'published' };
  if (filters.city) query['location.city'] = filters.city;
  if (filters.country) query['location.country'] = filters.country;
  if (filters.capacity) query.capacity = { $gte: filters.capacity };

  const [docs, total] = await Promise.all([
    this.model
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.model.countDocuments(query),
  ]);

  return createPaginatedResponse(
    docs.map(this.toDomain),
    total,
    skip,
    limit
  );
}
```

### Step 3: Update Controllers/Resolvers

Use pagination in API endpoints:

```typescript
@Get('users/:userId/bookings')
async getUserBookings(
  @Param('userId') userId: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  return this.bookingService.findByUserIdPaginated(userId, { page, limit });
}
```

## Default Behavior

- **Default Page**: 1 (first page)
- **Default Limit**: 20 items per page
- **Max Limit**: 100 items per page (enforced)

## Repositories Updated

### Phase 1 (Completed)

✅ **Core Services:**

- Accommodation Service (`mongoose-accommodation.repository.ts`)

  - `findByHostIdPaginated()`
  - `searchPaginated()`

- Booking Service (`mongoose-booking.repository.ts`)

  - `findByUserIdPaginated()`
  - `findByServiceIdPaginated()`

- Payment Service (`mongo-payment.repository.ts`)

  - `findByPassengerPaginated()`
  - `findByDriverPaginated()`
  - `findByStatusPaginated()`

- Transport Service (`mongo-ride.repository.ts`)

  - `findByUserIdPaginated()`
  - `findByDriverIdPaginated()`
  - `findByStatusPaginated()`

- Tracking Service (`mongo-tracking.repository.ts`)
  - `findByUserIdPaginated()`
  - `findByDateRangePaginated()`

### Phase 2 (Remaining)

The following repositories should follow the same pattern:

**Analytics Service:**

- `mongo-driver-analytics.repository.ts` → findByDriverIdPaginated()
- `mongo-ride-analytics.repository.ts` → findByDateRangePaginated()

**Notifications Service:**

- `mongo-message.repository.ts` → findByUserIdPaginated()
- `mongoose-notification.repository.ts` → findByUserIdPaginated()

**Ratings Service:**

- `mongo-rating.repository.ts` → findByAccommodationIdPaginated(), findByDriverIdPaginated()
- `mongo-driver-profile.repository.ts` → findByDriverIdPaginated()

**Other Services:**

- Tours: `mongoose-tour.repository.ts`
- Envios: `mongoose-parcel.repository.ts`
- Experiencias: `mongoose-experience.repository.ts`
- User Auth: `mongoose-user.repository.ts`

## Performance Considerations

### 1. Always Use skip() + limit()

```typescript
// ✅ Good: Uses skip and limit
model.find(query).skip(100).limit(20);

// ❌ Bad: No pagination
model.find(query);
```

### 2. Count Optimization

```typescript
// ✅ Good: Parallel countDocuments
const [docs, total] = await Promise.all([
  model.find(query).skip(skip).limit(limit),
  model.countDocuments(query),
]);

// ❌ Bad: Sequential execution
const docs = await model.find(query).skip(skip).limit(limit);
const total = await model.countDocuments(query);
```

### 3. Sort Strategy

```typescript
// ✅ Good: Sort before skip (more efficient)
model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

// ❌ Bad: Unnecessary sort in memory
model.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
```

### 4. Index Alignment

Ensure queries have indexes on filter and sort fields (see P1-3 for index strategy):

```typescript
// Create compound indexes for common queries
db.rides.createIndex({ userId: 1, createdAt: -1 });
db.rides.createIndex({ driverId: 1, createdAt: -1 });
db.rides.createIndex({ status: 1, createdAt: -1 });
```

## Query Optimizer Integration

The `QueryOptimizerService` tracks pagination query performance:

```typescript
// Automatically detects slow paginated queries
// Recommends indexes for frequently paginated collections
// Reports on pagination efficiency
```

## Testing Pagination

```typescript
// Test basic pagination
const page1 = await repo.findByUserIdPaginated(userId, { page: 1, limit: 10 });
expect(page1.data.length).toBeLessThanOrEqual(10);
expect(page1.page).toBe(1);
expect(page1.hasNextPage).toBe(page1.total > 10);

// Test sorting
const results = await repo.findByUserIdPaginated(userId, {
  page: 1,
  limit: 20,
  sort: { createdAt: 1 },
});

// Test max limit enforcement
const large = await repo.findByUserIdPaginated(userId, { limit: 200 });
expect(large.limit).toBeLessThanOrEqual(100);
```

## Cursor-Based Pagination (Advanced)

For even better performance with large datasets, cursor-based pagination is available:

```typescript
// Utilities provided in pagination.utils.ts
export interface CursorPaginationDto {
  limit?: number;
  cursor?: string;
  sort?: Record<string, 1 | -1>;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  previousCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Helper functions
encodeCursor(value: string | number | Date): string
decodeCursor(cursor: string): string
```

**When to Use Cursor Pagination:**

- Datasets growing infinitely (feeds, activity logs)
- High-volume real-time data
- When offset becomes inefficient (>100k documents)

## Migration Path

1. **Existing APIs**: Keep original methods for backwards compatibility
2. **New Features**: Use paginated methods exclusively
3. **Gradual Migration**: Update controllers/resolvers over time
4. **Deprecation**: Mark original methods as `@deprecated` after 1 release

## Summary

| Feature               | Status                      | Files Updated         |
| --------------------- | --------------------------- | --------------------- |
| Pagination Utilities  | ✅ Complete                 | `pagination.utils.ts` |
| Accommodation Service | ✅ Complete                 | 2 paginated methods   |
| Booking Service       | ✅ Complete                 | 2 paginated methods   |
| Payment Service       | ✅ Complete                 | 3 paginated methods   |
| Transport Service     | ✅ Complete                 | 3 paginated methods   |
| Tracking Service      | ✅ Complete                 | 2 paginated methods   |
| **Subtotal**          | **✅ 12 paginated methods** | **5 services**        |
| Remaining Services    | 🔄 Planned                  | 14 more repositories  |
| **Total P1-1 Target** | 🎯 ~35+ paginated methods   | 20+ repositories      |

---

**Next Steps**: Apply this pattern to remaining repositories in Phase 2.
