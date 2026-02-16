import { UUID } from '@going-monorepo-clean/shared-domain';

describe('UUID Value Object', () => {
  it('should generate a valid UUID v4', () => {
    const id = UUID.generate();
    expect(typeof id).toBe('string');
    expect(UUID.isValid(id)).toBe(true);
  });

  it('should generate unique UUIDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => UUID.generate()));
    expect(ids.size).toBe(100);
  });

  it('should validate a correct UUID', () => {
    expect(UUID.isValid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should reject invalid UUID strings', () => {
    expect(UUID.isValid('not-a-uuid')).toBe(false);
    expect(UUID.isValid('')).toBe(false);
    expect(UUID.isValid('12345')).toBe(false);
  });
});
