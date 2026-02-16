import { Experience } from '@going-monorepo-clean/domains-experience-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

describe('Experience Entity', () => {
  const location = Location.create({
    address: 'Mitad del Mundo',
    city: 'Quito',
    country: 'Ecuador',
    latitude: 0.0,
    longitude: -78.45,
  })._unsafeUnwrap();

  const validProps = {
    hostId: 'host-1',
    title: 'Tour de café ecuatoriano',
    description: 'Recorrido por fincas cafeteras',
    location,
    price: Money.fromPrimitives({ amount: 3500, currency: 'USD' }),
    durationHours: 4,
  };

  it('should create a valid experience', () => {
    const result = Experience.create(validProps);
    expect(result.isOk()).toBe(true);
    const exp = result._unsafeUnwrap();
    expect(exp.title).toBe('Tour de café ecuatoriano');
    expect(exp.status).toBe('draft');
    expect(exp.durationHours).toBe(4);
  });

  it('should reject title shorter than 5 characters', () => {
    const result = Experience.create({ ...validProps, title: 'Hi' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Title');
  });

  it('should reject non-positive duration', () => {
    const result = Experience.create({ ...validProps, durationHours: 0 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Duration');
  });

  it('should publish a draft experience', () => {
    const exp = Experience.create(validProps)._unsafeUnwrap();
    const result = exp.publish();
    expect(result.isOk()).toBe(true);
    expect(exp.status).toBe('published');
  });

  it('should not publish a non-draft experience', () => {
    const exp = Experience.create(validProps)._unsafeUnwrap();
    exp.publish();
    const result = exp.publish(); // already published
    expect(result.isErr()).toBe(true);
  });

  it('should serialize/deserialize', () => {
    const exp = Experience.create(validProps)._unsafeUnwrap();
    const primitives = exp.toPrimitives();
    expect(primitives.location.city).toBe('Quito');
    const restored = Experience.fromPrimitives(primitives);
    expect(restored.title).toBe('Tour de café ecuatoriano');
  });
});
