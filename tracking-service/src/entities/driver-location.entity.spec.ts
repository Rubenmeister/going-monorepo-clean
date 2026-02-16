import { DriverLocation, Location } from '@going-monorepo-clean/domains-tracking-core';

describe('DriverLocation Entity', () => {
  it('should create a driver location', () => {
    const location = Location.create({ latitude: -0.18, longitude: -78.46 })._unsafeUnwrap();
    const driverLoc = DriverLocation.create({ driverId: 'driver-1', location });
    expect(driverLoc.driverId).toBe('driver-1');
    expect(driverLoc.location.latitude).toBe(-0.18);
    expect(driverLoc.updatedAt).toBeDefined();
  });

  it('should serialize/deserialize', () => {
    const location = Location.create({ latitude: -2.9, longitude: -79.0 })._unsafeUnwrap();
    const driverLoc = DriverLocation.create({ driverId: 'driver-2', location });
    const primitives = driverLoc.toPrimitives();
    expect(primitives.driverId).toBe('driver-2');
    expect(primitives.location.latitude).toBe(-2.9);
    const restored = DriverLocation.fromPrimitives(primitives);
    expect(restored.driverId).toBe('driver-2');
  });
});
