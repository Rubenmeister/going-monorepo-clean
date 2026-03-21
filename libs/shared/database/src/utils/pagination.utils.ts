/**
 * Pagination Utilities
 * Provides standard pagination DTOs and helper functions
 */

export interface PaginationDto {
  page?: number;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
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

/**
 * Convert pagination parameters to MongoDB query options
 */
export function getPaginationOptions(pagination?: PaginationDto): {
  skip: number;
  limit: number;
} {
  const limit = Math.min(pagination?.limit || 20, 100); // Max 100 per page
  const page = Math.max(pagination?.page || 1, 1);
  const skip = pagination?.skip ?? (page - 1) * limit;

  return { skip, limit };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMetadata(
  total: number,
  skip: number,
  limit: number
): Omit<PaginatedResult<any>, 'data'> {
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  skip: number,
  limit: number
): PaginatedResult<T> {
  const metadata = calculatePaginationMetadata(total, skip, limit);
  return {
    data,
    ...metadata,
  };
}

/**
 * Encode cursor for cursor-based pagination
 */
export function encodeCursor(value: string | number | Date): string {
  if (value instanceof Date) {
    return Buffer.from(value.getTime().toString()).toString('base64');
  }
  return Buffer.from(String(value)).toString('base64');
}

/**
 * Decode cursor for cursor-based pagination
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

/**
 * Build sort options from pagination
 */
export function buildSortOptions(
  sort?: Record<string, 1 | -1>
): Record<string, 1 | -1> {
  return sort || { createdAt: -1 };
}
