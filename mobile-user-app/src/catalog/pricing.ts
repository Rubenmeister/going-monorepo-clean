/**
 * Pricing canónico del mobile Going.
 *
 * FUENTE ÚNICA: el Excel del founder → `./excel-fares.ts` (generado por
 * scripts/import-fares.py, precios FIJOS explícitos). `./fares.ts` (viejo, ×4)
 * queda solo como FALLBACK para rutas que aún no estén en el Excel.
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
import { getExcelFare, getExcelPrivatePrices, type PrivatePrices } from './excel-fares';
import { motorShared, motorPrivate } from './motorSnapshot';

// Clave de ruta para el snapshot del motor (city IDs → 'origen-destino').
const motorKey = (a: string, b: string) => `${a}-${b}`.toLowerCase();

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
  const fareKey = VEHICLE_TO_FARE_KEY[vehicleId];

  if (mode === 'compartido') {
    // F-client: MOTOR primero (Atlas, editable en vivo). Fallback: Excel → tabla vieja.
    const mo = motorShared(motorKey(city, 'quito'), motorKey('quito', city));
    if (mo != null) return mo;
    const excel = getExcelFare(city, 'quito');
    if (excel != null) return excel;
    return getFare(city, 'quito') ?? getFare('quito', city) ?? 0;
  }

  // Privado: MOTOR primero (precio explícito por vehículo). Fallback: Excel → multiplicador.
  const mp = motorPrivate(motorKey(city, 'quito'), motorKey('quito', city));
  const mExplicit = mp ? (mp[fareKey] as number | undefined) : undefined;
  if (mExplicit != null) return mExplicit;
  const priv = getExcelPrivatePrices(city, 'quito');
  const explicit = priv ? priv[fareKey as keyof PrivatePrices] : undefined;
  if (explicit != null) return explicit;

  const sharedPerPerson = getFare(city, 'quito') ?? getFare('quito', city) ?? 0;
  if (sharedPerPerson === 0) return 0;
  return getPrivateFare(sharedPerPerson, fareKey);
}

/** Re-export para callers que necesitan la tabla cruda (lectura, no edición). */
export { FARES, getFare };
