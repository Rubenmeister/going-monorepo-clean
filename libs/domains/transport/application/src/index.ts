export * from './lib/dto/request-trip.dto';
export * from './lib/use-cases/request-trip.use-case';
export * from './lib/use-cases/accept-trip.use-case';
export * from './lib/use-cases/match-available-drivers.use-case';

// Zone (geocercas) use cases
export * from './lib/use-cases/zone/create-zone.use-case';
export * from './lib/use-cases/zone/update-zone.use-case';
export * from './lib/use-cases/zone/delete-zone.use-case';
export * from './lib/use-cases/zone/list-zones.use-case';
export * from './lib/use-cases/zone/find-zones-containing-point.use-case';

// DriverBase (bases de conductor) use cases
export * from './lib/use-cases/driver-base/assign-driver-base.use-case';
export * from './lib/use-cases/driver-base/update-driver-base.use-case';
export * from './lib/use-cases/driver-base/delete-driver-base.use-case';
export * from './lib/use-cases/driver-base/list-driver-bases.use-case';
export * from './lib/use-cases/driver-base/find-drivers-near-base.use-case';

// Fairness counter (Fase 3) use cases
export * from './lib/use-cases/fairness/record-driver-acceptance.use-case';
export * from './lib/use-cases/fairness/get-driver-fairness.use-case';
