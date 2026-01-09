import { Location } from './location.vo';

describe('Location Value Object', () => {
  const validProps = {
    address: '123 Test St',
    city: 'Quito',
    country: 'Ecuador',
    latitude: -0.1807,
    longitude: -78.4678,
  };

  it('should create location from primitives', () => {
    const location = Location.fromPrimitives(validProps);
    expect(location.address).toBe(validProps.address);
    expect(location.latitude).toBe(validProps.latitude);
  });

  it('should create location via create method', () => {
    const locationResult = Location.create(validProps);
    expect(locationResult.isOk()).toBe(true);
    const location = locationResult._unsafeUnwrap();
    expect(location.city).toBe('Quito');
  });

  it('should return error if address is empty', () => {
    const locationResult = Location.create({ ...validProps, address: '' });
    expect(locationResult.isErr()).toBe(true);
    expect(locationResult._unsafeUnwrapErr().message).toBe('Address is required');
  });

  it('should validate latitude range', () => {
    const locationResult = Location.create({ ...validProps, latitude: 100 });
    expect(locationResult.isErr()).toBe(true);
    expect(locationResult._unsafeUnwrapErr().message).toBe('Invalid latitude');
  });

  it('should validate longitude range', () => {
    const locationResult = Location.create({ ...validProps, longitude: 200 });
    expect(locationResult.isErr()).toBe(true);
    expect(locationResult._unsafeUnwrapErr().message).toBe('Invalid longitude');
  });

  it('should convert to primitives', () => {
    const location = Location.fromPrimitives(validProps);
    expect(location.toPrimitives()).toEqual(validProps);
  });
});
