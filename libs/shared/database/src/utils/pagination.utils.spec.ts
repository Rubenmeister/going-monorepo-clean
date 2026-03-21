import {
  getPaginationOptions,
  calculatePaginationMetadata,
  createPaginatedResponse,
  encodeCursor,
  decodeCursor,
  buildSortOptions,
  PaginationDto,
  PaginatedResult,
} from './pagination.utils';

describe('Pagination Utilities', () => {
  describe('getPaginationOptions', () => {
    it('should return default pagination when no params provided', () => {
      const result = getPaginationOptions();
      expect(result).toEqual({ skip: 0, limit: 20 });
    });

    it('should handle page parameter correctly', () => {
      const result = getPaginationOptions({ page: 2, limit: 10 });
      expect(result).toEqual({ skip: 10, limit: 10 });
    });

    it('should handle page 1 (first page)', () => {
      const result = getPaginationOptions({ page: 1, limit: 20 });
      expect(result).toEqual({ skip: 0, limit: 20 });
    });

    it('should enforce max limit of 100', () => {
      const result = getPaginationOptions({ limit: 200 });
      expect(result.limit).toBe(100);
    });

    it('should handle skip parameter override', () => {
      const result = getPaginationOptions({ skip: 50, limit: 20 });
      expect(result).toEqual({ skip: 50, limit: 20 });
    });

    it('should handle zero or negative page gracefully', () => {
      const result = getPaginationOptions({ page: 0, limit: 20 });
      expect(result.skip).toBeGreaterThanOrEqual(0);
    });

    it('should use default limit of 20 when not provided', () => {
      const result = getPaginationOptions({ page: 1 });
      expect(result.limit).toBe(20);
    });

    it('should cap minimum limit at 1', () => {
      const result = getPaginationOptions({ limit: 0 });
      expect(result.limit).toBeGreaterThan(0);
    });
  });

  describe('calculatePaginationMetadata', () => {
    it('should calculate metadata for first page', () => {
      const result = calculatePaginationMetadata(100, 0, 20);
      expect(result).toEqual({
        total: 100,
        page: 1,
        limit: 20,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should calculate metadata for middle page', () => {
      const result = calculatePaginationMetadata(100, 40, 20);
      expect(result).toEqual({
        total: 100,
        page: 3,
        limit: 20,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should calculate metadata for last page', () => {
      const result = calculatePaginationMetadata(100, 80, 20);
      expect(result).toEqual({
        total: 100,
        page: 5,
        limit: 20,
        totalPages: 5,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle exact division', () => {
      const result = calculatePaginationMetadata(50, 25, 25);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(2);
    });

    it('should handle single item', () => {
      const result = calculatePaginationMetadata(1, 0, 20);
      expect(result).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle zero items', () => {
      const result = calculatePaginationMetadata(0, 0, 20);
      expect(result).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create valid paginated response', () => {
      const data = [
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' },
      ];
      const result = createPaginatedResponse(data, 100, 0, 20);

      expect(result.data).toEqual(data);
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(5);
    });

    it('should include hasNextPage flag correctly', () => {
      const data: any[] = [];
      const result = createPaginatedResponse(data, 100, 20, 20);
      expect(result.hasNextPage).toBe(true);
    });

    it('should include hasPreviousPage flag correctly', () => {
      const data: any[] = [];
      const result = createPaginatedResponse(data, 100, 40, 20);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle empty data array', () => {
      const result = createPaginatedResponse([], 0, 0, 20);
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('encodeCursor', () => {
    it('should encode string cursor', () => {
      const encoded = encodeCursor('user:123');
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should encode number cursor', () => {
      const encoded = encodeCursor(123);
      expect(encoded).toBeTruthy();
      expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 pattern
    });

    it('should encode Date cursor', () => {
      const date = new Date('2024-01-01');
      const encoded = encodeCursor(date);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should produce consistent encoding', () => {
      const value = 'test-cursor';
      const encoded1 = encodeCursor(value);
      const encoded2 = encodeCursor(value);
      expect(encoded1).toBe(encoded2);
    });
  });

  describe('decodeCursor', () => {
    it('should decode string cursor', () => {
      const original = 'user:456';
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);
      expect(decoded).toBe(original);
    });

    it('should decode number cursor', () => {
      const original = 456;
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);
      expect(decoded).toBe(original.toString());
    });

    it('should handle invalid base64 gracefully', () => {
      expect(() => {
        decodeCursor('invalid!!!');
      }).not.toThrow();
    });

    it('should round-trip cursor encoding/decoding', () => {
      const values = ['test', 'abc123', 'special-chars_123'];
      values.forEach((value) => {
        const encoded = encodeCursor(value);
        const decoded = decodeCursor(encoded);
        expect(decoded).toBe(value);
      });
    });
  });

  describe('buildSortOptions', () => {
    it('should return provided sort options', () => {
      const sort = { name: 1, createdAt: -1 };
      const result = buildSortOptions(sort);
      expect(result).toEqual(sort);
    });

    it('should return default sort when no option provided', () => {
      const result = buildSortOptions();
      expect(result).toEqual({ createdAt: -1 });
    });

    it('should handle empty sort object', () => {
      const result = buildSortOptions({});
      expect(result).toEqual({});
    });

    it('should preserve sort direction', () => {
      const sort = { timestamp: -1, priority: 1 };
      const result = buildSortOptions(sort);
      expect(result.timestamp).toBe(-1);
      expect(result.priority).toBe(1);
    });
  });

  describe('Integration: Pagination Flow', () => {
    it('should handle complete pagination flow', () => {
      // Page 1
      const page1Opts = getPaginationOptions({ page: 1, limit: 10 });
      const page1Data = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const page1Result = createPaginatedResponse(
        page1Data,
        25,
        page1Opts.skip,
        page1Opts.limit
      );

      expect(page1Result.page).toBe(1);
      expect(page1Result.hasNextPage).toBe(true);
      expect(page1Result.hasPreviousPage).toBe(false);

      // Page 2
      const page2Opts = getPaginationOptions({ page: 2, limit: 10 });
      const page2Data = Array.from({ length: 10 }, (_, i) => ({ id: i + 11 }));
      const page2Result = createPaginatedResponse(
        page2Data,
        25,
        page2Opts.skip,
        page2Opts.limit
      );

      expect(page2Result.page).toBe(2);
      expect(page2Result.hasNextPage).toBe(true);
      expect(page2Result.hasPreviousPage).toBe(true);

      // Page 3 (last)
      const page3Opts = getPaginationOptions({ page: 3, limit: 10 });
      const page3Data = Array.from({ length: 5 }, (_, i) => ({ id: i + 21 }));
      const page3Result = createPaginatedResponse(
        page3Data,
        25,
        page3Opts.skip,
        page3Opts.limit
      );

      expect(page3Result.page).toBe(3);
      expect(page3Result.hasNextPage).toBe(false);
      expect(page3Result.hasPreviousPage).toBe(true);
    });

    it('should handle pagination with sorting', () => {
      const pagination: PaginationDto = {
        page: 1,
        limit: 20,
        sort: { createdAt: -1, name: 1 },
      };

      const opts = getPaginationOptions(pagination);
      const sort = buildSortOptions(pagination.sort);

      expect(opts).toEqual({ skip: 0, limit: 20 });
      expect(sort).toEqual({ createdAt: -1, name: 1 });
    });

    it('should enforce pagination limits in large datasets', () => {
      const largeTotal = 1_000_000;
      const opts = getPaginationOptions({ limit: 500 });

      expect(opts.limit).toBeLessThanOrEqual(100);

      const metadata = calculatePaginationMetadata(
        largeTotal,
        opts.skip,
        opts.limit
      );
      expect(metadata.totalPages).toBeGreaterThan(1000);
    });
  });
});
