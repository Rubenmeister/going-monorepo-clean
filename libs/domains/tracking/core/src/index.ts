// Exporta las entidades y VOs
export * from './lib/value-objects/location.vo';
export * from './lib/entities/driver-location.entity';
export * from './lib/entities/tracking-event.entity';

// Exporta los puertos (interfaces y symbols)
export * from './lib/ports/itracking.repository';
export * from './lib/ports/itracking.gateway';
export * from './lib/ports/idriver-location.repository';
export * from './lib/ports/idriver-location.gateway';