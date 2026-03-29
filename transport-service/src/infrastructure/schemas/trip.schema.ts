// Alias de compatibilidad: Trip = Ride en este servicio
// mongoose-trip.repository.ts usa estos nombres por convención de dominio
export { RideDocument as TripDocument, Ride as TripModelSchema } from './ride.schema';
