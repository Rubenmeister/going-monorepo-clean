import { UUID } from './uuid.vo';

describe('UUID Value Object', () => {
  it('should generate a valid v4 UUID', () => {
    const id = UUID.generate();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(UUID.isValid(id)).toBe(true);
  });

  it('should validate a correct UUID', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    expect(UUID.isValid(validId)).toBe(true);
  });

  it('should invalidate an incorrect UUID', () => {
    const invalidId = 'not-a-uuid';
    expect(UUID.isValid(invalidId)).toBe(false);
  });
});
