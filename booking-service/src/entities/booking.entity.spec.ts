import { Booking, BookingStatus, ServiceType } from '@going-monorepo-clean/domains-booking-core';
import { Money } from '@going-monorepo-clean/shared-domain';

describe('Booking Entity', () => {
  const validProps = {
    userId: 'user-1',
    serviceId: 'service-1',
    serviceType: ServiceType.TRANSPORT,
    totalPrice: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
    startDate: new Date('2025-03-15'),
  };

  it('should create a valid booking', () => {
    const result = Booking.create(validProps);
    expect(result.isOk()).toBe(true);
    const booking = result._unsafeUnwrap();
    expect(booking.status).toBe(BookingStatus.PENDING);
    expect(booking.userId).toBe('user-1');
    expect(booking.id).toBeDefined();
  });

  it('should reject non-positive price', () => {
    const result = Booking.create({
      ...validProps,
      totalPrice: Money.fromPrimitives({ amount: 0, currency: 'USD' }),
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('positive');
  });

  it('should confirm a pending booking', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    const result = booking.confirm();
    expect(result.isOk()).toBe(true);
    expect(booking.status).toBe(BookingStatus.CONFIRMED);
  });

  it('should not confirm a non-pending booking', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    booking.confirm();
    const result = booking.confirm(); // already confirmed
    expect(result.isErr()).toBe(true);
  });

  it('should cancel a pending booking', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    const result = booking.cancel();
    expect(result.isOk()).toBe(true);
    expect(booking.status).toBe(BookingStatus.CANCELLED);
  });

  it('should not cancel a completed booking', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    booking.confirm();
    booking.complete();
    const result = booking.cancel();
    expect(result.isErr()).toBe(true);
  });

  it('should complete a confirmed booking', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    booking.confirm();
    const result = booking.complete();
    expect(result.isOk()).toBe(true);
    expect(booking.status).toBe(BookingStatus.COMPLETED);
  });

  it('should not complete a pending booking', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    const result = booking.complete();
    expect(result.isErr()).toBe(true);
  });

  it('should serialize/deserialize', () => {
    const booking = Booking.create(validProps)._unsafeUnwrap();
    const primitives = booking.toPrimitives();
    expect(primitives.serviceType).toBe('transport');
    const restored = Booking.fromPrimitives(primitives);
    expect(restored.userId).toBe('user-1');
  });
});
