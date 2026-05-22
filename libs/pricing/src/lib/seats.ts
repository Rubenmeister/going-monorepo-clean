/**
 * GOING — Configuración de asientos para viaje compartido (carpooling).
 *
 * Reglas de negocio (definidas con ops 2026-05-22):
 *   - SUV: 3 asientos al público (delantero + 2 traseros laterales). El centro
 *     trasero (4º) NO se vende a desconocidos; solo se habilita cuando una misma
 *     reserva es de grupo (familia/amigos que aceptan ir más apretados), al
 *     MISMO precio fijo por asiento.
 *   - SUV XL / 3 filas: hasta 4 asientos.
 *   - Asiento delantero: si se reserva con exclusividad, +$3.
 *
 * Solo SUV y SUV XL operan carpooling + envíos. Vans/minibús/bus son privados.
 */

export interface CarpoolSeatConfig {
  /** Asientos vendibles a pasajeros independientes (pueden ser desconocidos). */
  publicSeats: number;
  /** Asientos extra solo para reservas de grupo (centro trasero), mismo precio. */
  groupExtraSeats: number;
  /** Recargo por reservar el asiento delantero con exclusividad. */
  frontSeatSurcharge: number;
}

export const CARPOOL_SEATING: Record<string, CarpoolSeatConfig> = {
  suv:    { publicSeats: 3, groupExtraSeats: 1, frontSeatSurcharge: 3 },
  suv_xl: { publicSeats: 4, groupExtraSeats: 1, frontSeatSurcharge: 3 },
};

export function getCarpoolSeating(vehicleType: string): CarpoolSeatConfig | null {
  return CARPOOL_SEATING[vehicleType] ?? null;
}

/** Capacidad física máxima (público + extra de grupo) para un vehículo. */
export function maxCarpoolCapacity(vehicleType: string): number {
  const c = CARPOOL_SEATING[vehicleType];
  return c ? c.publicSeats + c.groupExtraSeats : 0;
}
