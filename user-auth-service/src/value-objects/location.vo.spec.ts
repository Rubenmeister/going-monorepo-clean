import { Location } from '@going-monorepo-clean/shared-domain';

describe('Location Value Object', () => {
  const validProps = {
    address: 'Av. Amazonas N36-152',
    city: 'Quito',
    country: 'Ecuador',
    latitude: -0.18,
    longitude: -78.46,
  };

  it('should create a valid Location', () => {
    const result = Location.create(validProps);
    expect(result.isOk()).toBe(true);
    const loc = result._unsafeUnwrap();
    expect(loc.address).toBe('Av. Amazonas N36-152');
    expect(loc.city).toBe('Quito');
    expect(loc.latitude).toBe(-0.18);
  });

  it('should reject empty address', () => {
    const result = Location.create({ ...validProps, address: '' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Address');
  });

  it('should reject latitude out of range (> 90)', () => {
    const result = Location.create({ ...validProps, latitude: 91 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('latitude');
  });

  it('should reject latitude out of range (< -90)', () => {
    const result = Location.create({ ...validProps, latitude: -91 });
    expect(result.isErr()).toBe(true);
  });

  it('should reject longitude out of range (> 180)', () => {
    const result = Location.create({ ...validProps, longitude: 181 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('longitude');
  });

  it('should reject longitude out of range (< -180)', () => {
    const result = Location.create({ ...validProps, longitude: -181 });
    expect(result.isErr()).toBe(true);
  });

  it('should serialize/deserialize with toPrimitives/fromPrimitives', () => {
    const loc = Location.create(validProps)._unsafeUnwrap();
    const primitives = loc.toPrimitives();
    expect(primitives).toEqual(validProps);
    const restored = Location.fromPrimitives(primitives);
    expect(restored.city).toBe('Quito');
    expect(restored.latitude).toBe(-0.18);
  });
});
