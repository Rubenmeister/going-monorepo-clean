/**
 * GOING — Tabla de tarifas oficiales
 * Actualizada: Marzo 2026
 */

export const FARES = {

  // ── COMPARTIDO (precio por persona) ───────────────────────────────────────
  shared: {
    // Rutas interurbanas
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

    // Quito al Aeropuerto (compartido) — precio único
    'quito-aeropuerto':       10,
    'aeropuerto-quito':       10,
  },

  // ── PRIVADO AEROPUERTO (precio por persona, vehículo dedicado) ───────────
  private_airport: {
    'norte':         20,   // Quito Norte y Centro Norte
    'centro_norte':  20,
    'sur':           25,   // Quito Sur
    'valles':        20,   // Valles (Chillos, Tumbaco general)
    'cumbaya':       20,
    'tumbaco':       15,
  },

  // ── TIPOS DE VEHÍCULO ─────────────────────────────────────────────────────
  vehicles: {
    suv:      { label: 'SUV',      capacity: 4,  multiplier: 4,    fixed_minibus: false },
    suv_xl:   { label: 'SUV XL',   capacity: 5,  multiplier: 5,    fixed_minibus: false },
    van:      { label: 'VAN',      capacity: 7,  multiplier: 7,    fixed_minibus: false },
    van_xl:   { label: 'VAN XL',   capacity: 12, multiplier: 10,   fixed_minibus: false },
    minibus:  { label: 'Minibús',  capacity: 20, multiplier: null, fixed_minibus: true  },
    bus:      { label: 'Bus',      capacity: 30, multiplier: null, fixed_minibus: true  },
  },

  // Precio fijo Minibús y Bus para ruta base (Quito↔Santo Domingo $15/persona)
  // Se escala proporcionalmente para otras rutas usando el precio compartido
  minibus_fixed: 250,
  bus_fixed:     350,

  // Extensión por desvío (El Carmen / La Concordia desde Santo Domingo)
  extension_per_person: 5,
};

/**
 * Calcula el precio privado para un vehículo dado la tarifa compartida base
 */
export function getPrivateFare(
  sharedFarePerPerson: number,
  vehicleType: keyof typeof FARES.vehicles,
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

/**
 * Retorna la tabla completa de precios para una ruta dada
 */
export function getFareTable(origin: string, destination: string): string {
  const shared = getFare(origin, destination, 'shared');
  if (!shared) return '';

  const lines = [
    `🚗 *SUV* (hasta 4 pax) — Compartido $${shared}/persona | Privado $${getPrivateFare(shared, 'suv')}`,
    `🚙 *SUV XL* (hasta 5 pax) — Compartido $${shared}/persona | Privado $${getPrivateFare(shared, 'suv_xl')}`,
    `🚐 *VAN* (hasta 7 pax) — Privado $${getPrivateFare(shared, 'van')}`,
    `🚐 *VAN XL* (hasta 12 pax) — Privado $${getPrivateFare(shared, 'van_xl')}`,
    `🚌 *Minibús* (hasta 20 pax) — Privado $${getPrivateFare(shared, 'minibus')}`,
    `🚌 *Bus* (30+ pax) — Privado $${getPrivateFare(shared, 'bus')}`,
  ];
  return lines.join('\n');
}

export function getFare(origin: string, destination: string, type: 'shared' | 'private_suv' = 'shared'): number | null {
  const key = `${normalize(origin)}-${normalize(destination)}`;
  const fares = type === 'shared' ? FARES.shared : FARES.private_suv;
  return (fares as any)[key] ?? null;
}

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
