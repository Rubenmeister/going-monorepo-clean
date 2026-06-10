/**
 * FARES — MIRROR de `libs/pricing/src/lib/fares.ts` (truth source del backend).
 *
 * REGLA DE ORO: si cambia la tabla en el backend, ACTUALIZAR este archivo
 * en el mismo PR. Mobile NO calcula precios diferentes a los que cobra el
 * backend; cualquier divergencia es un bug visible al usuario (precio
 * mostrado ≠ precio cobrado).
 *
 * Próximo paso (no MVP): mover esto a un endpoint `GET /pricing/shared-fare`
 * para eliminar el riesgo de drift al refactorizar la lib.
 */

export const FARES = {
  // ── COMPARTIDO (precio por persona) ───────────────────────────────────────
  shared: {
    'quito-santo_domingo':    15,
    'santo_domingo-quito':    15,
    'quito-ambato':           15,
    'ambato-quito':           15,
    'quito-latacunga':        10,
    'latacunga-quito':        10,
    'quito-salcedo':          12,
    'salcedo-quito':          12,
    'quito-ibarra':           15,
    'ibarra-quito':           15,
    'quito-riobamba':         17,
    'riobamba-quito':         17,
    'quito-otavalo':          12,
    'otavalo-quito':          12,
    'quito-cayambe':          8,
    'cayambe-quito':          8,
    'quito-tabacundo':        7,
    'tabacundo-quito':        7,
    'quito-atuntaqui':        14,
    'atuntaqui-quito':        14,

    // El Carmen y La Concordia
    'el_carmen-quito':        20,
    'quito-el_carmen':        20,
    'la_concordia-quito':     20,
    'quito-la_concordia':     20,
    'el_carmen-aeropuerto':   35,
    'la_concordia-aeropuerto': 35,
    'aeropuerto-el_carmen':   35,
    'aeropuerto-la_concordia': 35,

    // Ibarra / Otavalo al aeropuerto
    'ibarra-aeropuerto':      20,
    'aeropuerto-ibarra':      20,
    'otavalo-aeropuerto':     18,
    'aeropuerto-otavalo':     18,

    // Riobamba / Santo Domingo al aeropuerto (provisional)
    'riobamba-aeropuerto':      25,
    'aeropuerto-riobamba':      25,
    'santo_domingo-aeropuerto': 23,
    'aeropuerto-santo_domingo': 23,

    // Quito al Aeropuerto (compartido) — precio único
    'quito-aeropuerto':       10,
    'aeropuerto-quito':       10,
  } as Record<string, number>,

  // ── PRIVADO AEROPUERTO (precio por persona, vehículo dedicado) ───────────
  private_airport: {
    'norte':         20,
    'centro_norte':  20,
    'sur':           25,
    'valles':        20,
    'cumbaya':       20,
    'tumbaco':       15,
  } as Record<string, number>,

  // ── TIPOS DE VEHÍCULO ─────────────────────────────────────────────────────
  vehicles: {
    suv:      { label: 'SUV',      capacity: 4,  multiplier: 4,    fixed_minibus: false },
    suv_xl:   { label: 'SUV XL',   capacity: 5,  multiplier: 5,    fixed_minibus: false },
    van:      { label: 'VAN',      capacity: 7,  multiplier: 7,    fixed_minibus: false },
    van_xl:   { label: 'VAN XL',   capacity: 12, multiplier: 10,   fixed_minibus: false },
    minibus:  { label: 'Minibús',  capacity: 20, multiplier: null as number | null, fixed_minibus: true  },
    bus:      { label: 'Bus',      capacity: 30, multiplier: null as number | null, fixed_minibus: true  },
  },

  // Precio fijo Minibús y Bus para ruta base (Quito↔Santo Domingo $15/persona).
  // Se escala proporcionalmente para otras rutas.
  minibus_fixed: 250,
  bus_fixed:     350,

  // Extensión por desvío (El Carmen / La Concordia desde Santo Domingo)
  extension_per_person: 5,
} as const;

export type VehicleKey = keyof typeof FARES.vehicles;

/**
 * Normaliza el nombre de ciudad a la clave usada en FARES.
 * Misma función que en libs/pricing/lib/fares.ts.
 */
function normalize(city: string): string {
  return city.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
    .replace(/aeropuerto.*quito|tababela/gi, 'aeropuerto')
    .replace(/santo_domingo.*/i, 'santo_domingo')
    .replace(/el_carmen/i, 'el_carmen')
    .replace(/la_concordia/i, 'la_concordia');
}

/** Precio del viaje compartido (por persona) en la ruta origin→destination. */
export function getFare(origin: string, destination: string): number | null {
  const key = `${normalize(origin)}-${normalize(destination)}`;
  return FARES.shared[key] ?? null;
}

/** Precio privado para un vehículo dado la tarifa compartida base. */
export function getPrivateFare(
  sharedFarePerPerson: number,
  vehicleType: VehicleKey,
): number {
  const BASE_SHARED = 15; // tarifa de referencia (Quito↔Santo Domingo)
  const vehicle = FARES.vehicles[vehicleType];

  if (vehicleType === 'minibus') {
    return Math.round(FARES.minibus_fixed * (sharedFarePerPerson / BASE_SHARED));
  }
  if (vehicleType === 'bus') {
    return Math.round(FARES.bus_fixed * (sharedFarePerPerson / BASE_SHARED));
  }
  return sharedFarePerPerson * (vehicle.multiplier ?? vehicle.capacity);
}
