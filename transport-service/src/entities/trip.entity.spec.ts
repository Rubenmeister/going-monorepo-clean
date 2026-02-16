import { Trip } from '@going-monorepo-clean/domains-transport-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

describe('Trip Entity', () => {
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
    price: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
  };

  it('should create a valid trip', () => {
    const result = Trip.create(validProps);
    expect(result.isOk()).toBe(true);
    const trip = result._unsafeUnwrap();
    expect(trip.status).toBe('pending');
    expect(trip.userId).toBe('user-1');
  });

  it('should reject non-positive price', () => {
    const result = Trip.create({
      ...validProps,
      price: Money.fromPrimitives({ amount: 0, currency: 'USD' }),
    });
    expect(result.isErr()).toBe(true);
  });

  it('should assign driver', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    const result = trip.assignDriver('driver-1');
    expect(result.isOk()).toBe(true);
    expect(trip.status).toBe('driver_assigned');
    expect(trip.driverId).toBe('driver-1');
  });

  it('should not assign driver if not pending', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    trip.assignDriver('driver-1');
    const result = trip.assignDriver('driver-2');
    expect(result.isErr()).toBe(true);
  });

  it('should start trip after driver assigned', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    trip.assignDriver('driver-1');
    const result = trip.startTrip();
    expect(result.isOk()).toBe(true);
    expect(trip.status).toBe('in_progress');
    expect(trip.startedAt).toBeDefined();
  });

  it('should not start without driver', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    const result = trip.startTrip();
    expect(result.isErr()).toBe(true);
  });

  it('should complete an in-progress trip', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    trip.assignDriver('driver-1');
    trip.startTrip();
    const result = trip.completeTrip();
    expect(result.isOk()).toBe(true);
    expect(trip.status).toBe('completed');
    expect(trip.completedAt).toBeDefined();
  });

  it('should cancel a pending trip', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    const result = trip.cancel();
    expect(result.isOk()).toBe(true);
    expect(trip.status).toBe('cancelled');
  });

  it('should not cancel a completed trip', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    trip.assignDriver('driver-1');
    trip.startTrip();
    trip.completeTrip();
    const result = trip.cancel();
    expect(result.isErr()).toBe(true);
  });

  it('should serialize/deserialize', () => {
    const trip = Trip.create(validProps)._unsafeUnwrap();
    const primitives = trip.toPrimitives();
    expect(primitives.origin.city).toBe('Quito');
    const restored = Trip.fromPrimitives(primitives);
    expect(restored.userId).toBe('user-1');
  });
});
