import { Parcel } from '@going-monorepo-clean/domains-parcel-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

describe('Parcel Entity', () => {
  const origin = Location.create({
    address: 'Av. Amazonas', city: 'Quito', country: 'Ecuador', latitude: -0.18, longitude: -78.46,
  })._unsafeUnwrap();
  const destination = Location.create({
    address: 'Av. 6 de Diciembre', city: 'Quito', country: 'Ecuador', latitude: -0.19, longitude: -78.48,
  })._unsafeUnwrap();

  const validProps = {
    userId: 'user-1',
    origin,
    destination,
    description: 'Paquete frágil',
    price: Money.fromPrimitives({ amount: 2000, currency: 'USD' }),
  };

  it('should create a valid parcel', () => {
    const result = Parcel.create(validProps);
    expect(result.isOk()).toBe(true);
    const parcel = result._unsafeUnwrap();
    expect(parcel.status).toBe('pending');
    expect(parcel.description).toBe('Paquete frágil');
  });

  it('should reject short description', () => {
    const result = Parcel.create({ ...validProps, description: 'ab' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Description');
  });

  it('should reject non-positive price', () => {
    const result = Parcel.create({
      ...validProps,
      price: Money.fromPrimitives({ amount: 0, currency: 'USD' }),
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('positive');
  });

  it('should assign driver', () => {
    const parcel = Parcel.create(validProps)._unsafeUnwrap();
    const result = parcel.assignDriver('driver-1');
    expect(result.isOk()).toBe(true);
    expect(parcel.status).toBe('pickup_assigned');
    expect(parcel.driverId).toBe('driver-1');
  });

  it('should not assign driver if not pending', () => {
    const parcel = Parcel.create(validProps)._unsafeUnwrap();
    parcel.assignDriver('driver-1');
    const result = parcel.assignDriver('driver-2');
    expect(result.isErr()).toBe(true);
  });

  it('should transition to in_transit', () => {
    const parcel = Parcel.create(validProps)._unsafeUnwrap();
    parcel.assignDriver('driver-1');
    const result = parcel.markAsInTransit();
    expect(result.isOk()).toBe(true);
    expect(parcel.status).toBe('in_transit');
  });

  it('should deliver', () => {
    const parcel = Parcel.create(validProps)._unsafeUnwrap();
    parcel.assignDriver('driver-1');
    parcel.markAsInTransit();
    const result = parcel.deliver();
    expect(result.isOk()).toBe(true);
    expect(parcel.status).toBe('delivered');
  });

  it('should not deliver if not in transit', () => {
    const parcel = Parcel.create(validProps)._unsafeUnwrap();
    const result = parcel.deliver();
    expect(result.isErr()).toBe(true);
  });

  it('should serialize/deserialize', () => {
    const parcel = Parcel.create(validProps)._unsafeUnwrap();
    const primitives = parcel.toPrimitives();
    const restored = Parcel.fromPrimitives(primitives);
    expect(restored.status).toBe('pending');
  });
});
