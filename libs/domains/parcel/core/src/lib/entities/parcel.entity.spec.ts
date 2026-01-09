import { Parcel } from './parcel.entity';
import { Money, Location, UUID } from '@going-monorepo-clean/shared-domain';

describe('Parcel Entity', () => {
  const defaultProps = {
    userId: 'user-1' as UUID,
    origin: Location.fromPrimitives({ city: 'Quito', address: 'A', country: 'Ecuador', latitude: -0.1807, longitude: -78.4678 }),
    destination: Location.fromPrimitives({ city: 'Guayaquil', address: 'B', country: 'Ecuador', latitude: -2.171, longitude: -79.9223 }),
    description: 'Test Package',
    price: Money.fromPrimitives({ amount: 15, currency: 'USD' }),
  };

  it('should create a parcel with pending status', () => {
    const parcelResult = Parcel.create(defaultProps);
    expect(parcelResult.isOk()).toBe(true);
    const parcel = parcelResult._unsafeUnwrap();
    expect(parcel.status).toBe('pending');
  });

  it('should transition to pickup_assigned when a driver is assigned', () => {
    const parcel = Parcel.create(defaultProps)._unsafeUnwrap();
    const result = parcel.assignDriver('driver-1' as UUID);
    expect(result.isOk()).toBe(true);
    expect(parcel.status).toBe('pickup_assigned');
    expect(parcel.driverId).toBe('driver-1');
  });

  it('should transition to in_transit', () => {
    const parcel = Parcel.create(defaultProps)._unsafeUnwrap();
    parcel.assignDriver('driver-1' as UUID);
    const result = parcel.markAsInTransit();
    expect(result.isOk()).toBe(true);
    expect(parcel.status).toBe('in_transit');
  });

  it('should transition to delivered', () => {
    const parcel = Parcel.create(defaultProps)._unsafeUnwrap();
    parcel.assignDriver('driver-1' as UUID);
    parcel.markAsInTransit();
    const result = parcel.deliver();
    expect(result.isOk()).toBe(true);
    expect(parcel.status).toBe('delivered');
  });

  it('should error when delivering if not in transit', () => {
    const parcel = Parcel.create(defaultProps)._unsafeUnwrap();
    const result = parcel.deliver();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('Parcel is not in transit');
  });
});
