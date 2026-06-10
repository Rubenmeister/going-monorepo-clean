/**
 * Pricing canónico del mobile Going.
 *
 * Las TARIFAS son un mirror de `libs/pricing/lib/fares.ts` (truth source backend).
 * Ver `./fares.ts` — si cambia la tabla del backend, actualizar ese archivo.
 *
 * Las funciones siguen exponiendo la misma firma para no romper call sites;
 * internamente delegan a la tabla canónica vía `getFare()`.
 *
 * Surcharges legacy ELIMINADOS de mobile (Quito zone surcharge, frontSeat +$3):
 *   - El backend NO los aplica → mostrarlos al usuario causaba que el precio
 *     mostrado fuera mayor que el cobrado. Hasta que el negocio los agregue
 *     a libs/pricing + backend fare-engine, los selectores de UI quedan
 *     como configuración pero NO modifican el precio.
 */
import { CityId, TripMode, VehicleId } from './types';
import { getFare, getPrivateFare, FARES, type VehicleKey } from './fares';

// Map de VehicleId (interno mobile) a VehicleKey (canon backend).
// Mobile no expone minibus por ahora — solo el set que ofrece la app.
const VEHICLE_TO_FARE_KEY: Record<VehicleId, VehicleKey> = {
  suv:    'suv',
  suv_xl: 'suv_xl',
  van:    'van',
  van_xl: 'van_xl',
  bus:    'bus',
};

/**
 * Calcula el precio del viaje usando la tabla canónica del backend.
 *   - Compartido → tarifa por persona desde origin→Quito (ó Quito→origin)
 *   - Privado    → vehículo completo (multiplicador del backend)
 *
 * Si la ruta no está en la tabla canónica, devuelve 0 (UI debe degradar
 * mostrando "consultar precio" en lugar de mostrar un valor inventado).
 */
export function calcPrice(city: CityId, vehicleId: VehicleId, mode: TripMode): number {
  // Mobile usa city como origen; Quito como hub habitual.
  const sharedPerPerson = getFare(city, 'quito') ?? getFare('quito', city) ?? 0;
  if (sharedPerPerson === 0) return 0;

  if (mode === 'compartido') {
    return sharedPerPerson;
  }
  const fareKey = VEHICLE_TO_FARE_KEY[vehicleId];
  return getPrivateFare(sharedPerPerson, fareKey);
}

/** Re-export para callers que necesitan la tabla cruda (lectura, no edición). */
export { FARES, getFare };
