import { Accommodation } from '@going-monorepo-clean/domains-accommodation-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

describe('Accommodation Entity', () => {
  const location = Location.create({
    address: 'Calle Larga 5-24',
    city: 'Cuenca',
    country: 'Ecuador',
    latitude: -2.9,
    longitude: -79.0,
  })._unsafeUnwrap();

  const price = Money.fromPrimitives({ amount: 8000, currency: 'USD' });

  const validProps = {
    hostId: 'host-1',
    title: 'Casa en la playa',
    description: 'Hermosa casa frente al mar',
    location,
    pricePerNight: price,
    capacity: 4,
    amenities: ['wifi', 'pool'],
  };

  it('should create a valid accommodation', () => {
    const result = Accommodation.create(validProps);
    expect(result.isOk()).toBe(true);
    const acc = result._unsafeUnwrap();
    expect(acc.title).toBe('Casa en la playa');
    expect(acc.status).toBe('draft');
    expect(acc.capacity).toBe(4);
    expect(acc.id).toBeDefined();
  });

  it('should reject title shorter than 5 characters', () => {
    const result = Accommodation.create({ ...validProps, title: 'Hi' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Title');
  });

  it('should reject non-positive capacity', () => {
    const result = Accommodation.create({ ...validProps, capacity: 0 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Capacity');
  });

  it('should default amenities to empty array', () => {
    const { amenities, ...propsWithout } = validProps;
    const result = Accommodation.create(propsWithout as any);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().amenities).toEqual([]);
  });

  it('should publish a draft accommodation', () => {
    const acc = Accommodation.create(validProps)._unsafeUnwrap();
    expect(acc.status).toBe('draft');
    acc.publish();
    expect(acc.status).toBe('published');
  });

  it('should serialize/deserialize with toPrimitives/fromPrimitives', () => {
    const acc = Accommodation.create(validProps)._unsafeUnwrap();
    const primitives = acc.toPrimitives();
    expect(primitives.title).toBe('Casa en la playa');
    expect(primitives.location.city).toBe('Cuenca');
    const restored = Accommodation.fromPrimitives(primitives);
    expect(restored.title).toBe('Casa en la playa');
    expect(restored.location.city).toBe('Cuenca');
  });
});
