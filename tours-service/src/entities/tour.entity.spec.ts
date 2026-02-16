import { Tour, TourCategory } from '@going-monorepo-clean/domains-tour-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

describe('Tour Entity', () => {
  const location = Location.create({
    address: 'Centro Histórico',
    city: 'Quito',
    country: 'Ecuador',
    latitude: -0.22,
    longitude: -78.51,
  })._unsafeUnwrap();

  const validProps = {
    hostId: 'host-1',
    title: 'Tour gastronómico por Quito',
    description: 'Recorrido por mercados tradicionales',
    location,
    price: Money.fromPrimitives({ amount: 12000, currency: 'USD' }),
    durationHours: 3,
    maxGuests: 15,
    category: TourCategory.GASTRONOMY,
  };

  it('should create a valid tour', () => {
    const result = Tour.create(validProps);
    expect(result.isOk()).toBe(true);
    const tour = result._unsafeUnwrap();
    expect(tour.title).toBe('Tour gastronómico por Quito');
    expect(tour.status).toBe('draft');
    expect(tour.category).toBe(TourCategory.GASTRONOMY);
  });

  it('should reject short title', () => {
    const result = Tour.create({ ...validProps, title: 'Hi' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('title');
  });

  it('should reject non-positive duration', () => {
    const result = Tour.create({ ...validProps, durationHours: 0 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('duration');
  });

  it('should publish a draft tour', () => {
    const tour = Tour.create(validProps)._unsafeUnwrap();
    const result = tour.publish();
    expect(result.isOk()).toBe(true);
    expect(tour.status).toBe('published');
  });

  it('should not publish an already published tour', () => {
    const tour = Tour.create(validProps)._unsafeUnwrap();
    tour.publish();
    const result = tour.publish();
    expect(result.isErr()).toBe(true);
  });

  it('should not publish an archived tour', () => {
    const tour = Tour.fromPrimitives({
      ...Tour.create(validProps)._unsafeUnwrap().toPrimitives(),
      status: 'archived',
    });
    const result = tour.publish();
    expect(result.isErr()).toBe(true);
  });

  it('should serialize/deserialize', () => {
    const tour = Tour.create(validProps)._unsafeUnwrap();
    const primitives = tour.toPrimitives();
    expect(primitives.category).toBe('GASTRONOMY');
    const restored = Tour.fromPrimitives(primitives);
    expect(restored.title).toBe('Tour gastronómico por Quito');
  });
});
