// Exporta las entidades
export * from './libs/entities/trip.entity';
export * from './libs/entities/vehicle.entity';
export * from './libs/entities/route.entity';
export * from './libs/entities/schedule.entity';
export * from './libs/entities/shipment.entity';
export * from './libs/entities/ride-request.entity';
export * from './libs/entities/driver-profile.entity';

// Exporta los value objects
export * from './libs/value-objects/vehicle-type.vo';
export * from './libs/value-objects/seat.vo';
export * from './libs/value-objects/masked-phone.vo';
export * from './libs/value-objects/document-upload.vo';

// Exporta los puertos (interfaces y symbols)
export * from './libs/ports/itrip.repository';
export * from './libs/ports/ivehicle.repository';
export * from './libs/ports/iroute.repository';
export * from './libs/ports/ischedule.repository';
export * from './libs/ports/ishipment.repository';
export * from './libs/ports/iride-request.repository';
export * from './libs/ports/idriver-profile.repository';
export * from './libs/ports/imasked-phone.service';
export * from './libs/ports/iwhatsapp.gateway';

// Exporta los eventos de dominio
export * from './libs/events/trip-requested.event';
export * from './libs/events/vehicle-assigned.event';
export * from './libs/events/ride-request-created.event';
export * from './libs/events/shipment-assigned.event';
export * from './libs/events/masked-phone-assigned.event';
export * from './libs/events/ride-completed.event';
export * from './libs/events/shipment-delivered.event';
