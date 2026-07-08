import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Reserva de asiento dentro de un viaje programado.
 */
export interface SeatReservation {
  userId: string;
  seats: number;
  /** true si esta reserva tomó el asiento delantero con exclusividad (+$3). */
  frontExclusive: boolean;
  /** true si la reserva usó el asiento extra de grupo (centro trasero). */
  usedGroupSeat: boolean;
  pricePaid: number;
  createdAt: Date;
}

/**
 * ScheduledTrip — viaje compartido programado de un conductor en un corredor.
 *
 * Se materializa desde la agenda del conductor (driver_schedules): cuando un
 * conductor está asignado a una salida (ruta + fecha + hora), se le van
 * asignando los pasajeros que coinciden con esa ruta y hora, llenando los
 * asientos. El mismo viaje puede además llevar un envío (campos `package*`).
 */
@Schema({ timestamps: true, collection: 'scheduled_trips' })
export class ScheduledTripModel {
  @Prop({ required: true, index: true }) driverId: string;
  @Prop({ required: true, index: true }) corridorId: string;
  /** Ciudad de origen y destino (claves FARES). */
  @Prop({ required: true }) originCity: string;
  @Prop({ required: true }) destinationCity: string;
  @Prop({ required: true, index: true }) departureAt: Date;
  /** suv | suv_xl (solo estos hacen carpooling). */
  @Prop({ required: true, default: 'suv' }) vehicleType: string;

  /** Asientos vendibles al público (3 SUV / 4 SUV XL). */
  @Prop({ required: true }) seatsTotal: number;
  /** Asientos ya reservados (público + grupo). */
  @Prop({ default: 0 }) seatsReserved: number;
  /** Asiento extra de grupo (centro trasero) ya tomado. */
  @Prop({ default: false }) groupSeatTaken: boolean;
  /** Asiento delantero reservado con exclusividad. */
  @Prop({ default: false }) frontSeatTaken: boolean;

  /** Precio por asiento (snapshot de FARES al materializar). */
  @Prop({ required: true }) pricePerSeat: number;

  /** open | full | closed | cancelled */
  @Prop({ default: 'open', index: true }) status: string;

  /**
   * Cuándo se CONFIRMÓ al conductor definitivo (cron día-anterior). Idempotencia:
   * una vez seteado, el cron no lo vuelve a confirmar. null = aún preliminar.
   */
  @Prop({ index: true }) driverConfirmedAt: Date;
  /** Si el confirmado día-anterior reemplazó al preliminar (ausencia). */
  @Prop() reassignedAt: Date;
  /** driverId preliminar antes de una reasignación (traza). */
  @Prop() previousDriverId: string;
  /**
   * Instante en que se abrió la comunicación pasajera/o↔conductora/or (90 min
   * antes de la salida). Idempotencia del cron de apertura de canal.
   */
  @Prop() channelOpenedAt: Date;

  @Prop({ type: [Object], default: [] }) reservations: SeatReservation[];

  // ── Envíos a bordo (el flujo de envío se conecta en su fase) ───────────────
  @Prop({ default: 0 }) packagesOnboard: number;
  /** Asientos consumidos por encomiendas sobre-volumen (equivalente a 1 asiento). */
  @Prop({ default: 0 }) packageSeatsConsumed: number;
}

export type ScheduledTripDocument = ScheduledTripModel & Document;
export const ScheduledTripSchema = SchemaFactory.createForClass(ScheduledTripModel);

// Evita duplicar la misma salida (conductor + corredor + hora exacta).
ScheduledTripSchema.index(
  { driverId: 1, corridorId: 1, departureAt: 1 },
  { unique: true },
);

// Índices para las queries calientes (auditoría #30/35/37):
// - tarjeta de viaje activo del pasajero (findUpcomingSharedTrip, multikey):
ScheduledTripSchema.index({ 'reservations.userId': 1, status: 1, departureAt: 1 });
// - materialización/búsqueda por corredor (scheduled-trip.service):
ScheduledTripSchema.index({ corridorId: 1, status: 1, departureAt: 1 });
// - crones de asignación/canal por ventana de salida:
ScheduledTripSchema.index({ status: 1, departureAt: 1 });
