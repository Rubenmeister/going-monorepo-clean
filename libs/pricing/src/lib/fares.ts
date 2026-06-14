/**
 * GOING — Tabla de tarifas
 * Actualizada: Marzo 2026
 *
 * NOTA (2026-05-22): estos valores son PROVISIONALES — sirven para pruebas y
 * para que el buscador cotice de forma consistente, pero NO son los precios
 * definitivos. Pendiente reemplazarlos por la tabla final del negocio. Esta es
 * la fuente única; al actualizarla, todo el sistema (buscador, cobro, cotización
 * del bot) queda alineado automáticamente.
 */

export const FARES = {

  // ── COMPARTIDO (precio por persona) — LISTA ÚNICA Y COMPLETA ───────────────
  // Fuente única del sistema. Fusión de la tabla del backend + las rutas que
  // tenía el frontend. Un precio por par de ciudad (bidireccional). Las zonas
  // de Quito (Sur / Valles / Chillos) NO van acá: las cubre el recargo fijo de
  // origen (+$5) al recoger en esas zonas. Pares: 124.
  shared: {

    'aeropuerto-ambato':                18,
    'aeropuerto-atuntaqui':             14,
    'aeropuerto-banos':                 18,
    'aeropuerto-cayambe':               9,
    'aeropuerto-cuenca':                47,
    'aeropuerto-el_carmen':             35,
    'aeropuerto-el_quinche':            6,
    'aeropuerto-guayaquil':             52,
    'aeropuerto-guayllabamba':          5,
    'aeropuerto-ibarra':                20,
    'aeropuerto-la_concordia':          35,
    'aeropuerto-latacunga':             15,
    'aeropuerto-otavalo':               18,
    'aeropuerto-peguche':               14,
    'aeropuerto-pifo':                  5,
    'aeropuerto-quito':                 10,
    'aeropuerto-riobamba':              25,
    'aeropuerto-santo_domingo':         23,

    'alausi-cuenca':                    17,
    'alausi-guayaquil':                 24,
    'alausi-quito':                     29,
    'alausi-riobamba':                  11,

    'aloasi-quito':                     10,

    'ambato-aeropuerto':                18,
    'ambato-banos':                     5,
    'ambato-cevallos':                  4,
    'ambato-cuenca':                    29,
    'ambato-guayaquil':                 34,
    'ambato-latacunga':                 5,
    'ambato-mocha':                     4,
    'ambato-pillaro':                   5,
    'ambato-puyo':                      14,
    'ambato-quito':                     15,
    'ambato-riobamba':                  7,
    'ambato-salcedo':                   5,
    'ambato-tena':                      17,
    'ambato-tisaleo':                   4,

    'atuntaqui-aeropuerto':             14,
    'atuntaqui-quito':                  14,

    'azogues-cuenca':                   5,

    'banos-aeropuerto':                 18,
    'banos-ambato':                     5,
    'banos-cevallos':                   5,
    'banos-guayaquil':                  34,
    'banos-mocha':                      4,
    'banos-pillaro':                    6,
    'banos-quito':                      17,
    'banos-tisaleo':                    5,

    'cayambe-aeropuerto':               9,
    'cayambe-ibarra':                   14,
    'cayambe-quito':                    8,

    'cevallos-ambato':                  4,
    'cevallos-banos':                   5,
    'cevallos-latacunga':               9,
    'cevallos-quito':                   12,

    'cotacachi-ibarra':                 7,
    'cotacachi-quito':                  15,

    'cuenca-aeropuerto':                47,
    'cuenca-alausi':                    17,
    'cuenca-ambato':                    29,
    'cuenca-azogues':                   5,
    'cuenca-guayaquil':                 24,
    'cuenca-latacunga':                 34,
    'cuenca-loja':                      24,
    'cuenca-macas':                     34,
    'cuenca-machala':                   19,
    'cuenca-quito':                     44,
    'cuenca-riobamba':                  24,
    'cuenca-zaruma':                    29,

    'el_carmen-aeropuerto':             35,
    'el_carmen-la_concordia':           7,
    'el_carmen-quito':                  20,
    'el_carmen-santo_domingo':          8,

    'el_quinche-aeropuerto':            6,
    'el_quinche-quito':                 7,

    'esmeraldas-guayaquil':             54,
    'esmeraldas-manta':                 44,
    'esmeraldas-quito':                 29,

    'guaranda-quito':                   24,

    'guayaquil-aeropuerto':             52,
    'guayaquil-alausi':                 24,
    'guayaquil-ambato':                 34,
    'guayaquil-banos':                  34,
    'guayaquil-cuenca':                 24,
    'guayaquil-esmeraldas':             54,
    'guayaquil-ibarra':                 54,
    'guayaquil-latacunga':              39,
    'guayaquil-loja':                   39,
    'guayaquil-machala':                19,
    'guayaquil-manta':                  29,
    'guayaquil-montanita':              17,
    'guayaquil-naranjal':               10,
    'guayaquil-portoviejo':             29,
    'guayaquil-quito':                  49,
    'guayaquil-riobamba':               29,
    'guayaquil-salinas':                14,
    'guayaquil-santo_domingo':          29,
    'guayaquil-zaruma':                 29,

    'guayllabamba-aeropuerto':          5,
    'guayllabamba-quito':               6,

    'ibarra-aeropuerto':                20,
    'ibarra-cayambe':                   14,
    'ibarra-cotacachi':                 7,
    'ibarra-guayaquil':                 54,
    'ibarra-latacunga':                 19,
    'ibarra-otavalo':                   5,
    'ibarra-quito':                     15,
    'ibarra-tulcan':                    14,

    'la_concordia-aeropuerto':          35,
    'la_concordia-el_carmen':           7,
    'la_concordia-quito':               20,
    'la_concordia-santo_domingo':       8,

    'lago_agrio-quito':                 39,
    'lago_agrio-tena':                  34,

    'latacunga-aeropuerto':             15,
    'latacunga-ambato':                 5,
    'latacunga-cevallos':               9,
    'latacunga-cuenca':                 34,
    'latacunga-guayaquil':              39,
    'latacunga-ibarra':                 19,
    'latacunga-pillaro':                8,
    'latacunga-quito':                  10,
    'latacunga-riobamba':               11,
    'latacunga-salcedo':                3,

    'loja-cuenca':                      24,
    'loja-guayaquil':                   39,
    'loja-machala':                     29,
    'loja-quito':                       69,
    'loja-zaruma':                      17,

    'macas-cuenca':                     34,
    'macas-puyo':                       34,
    'macas-quito':                      54,
    'macas-tena':                       44,

    'machachi-quito':                   9,

    'machala-cuenca':                   19,
    'machala-guayaquil':                19,
    'machala-loja':                     29,
    'machala-quito':                    64,
    'machala-zaruma':                   19,

    'manta-esmeraldas':                 44,
    'manta-guayaquil':                  29,
    'manta-portoviejo':                 4,
    'manta-quito':                      49,
    'manta-salinas':                    49,

    'mocha-ambato':                     4,
    'mocha-banos':                      4,
    'mocha-quito':                      13,

    'montanita-guayaquil':              17,
    'montanita-quito':                  54,
    'montanita-salinas':                9,

    'naranjal-guayaquil':               10,

    'otavalo-aeropuerto':               18,
    'otavalo-ibarra':                   5,
    'otavalo-quito':                    12,

    'peguche-aeropuerto':               14,
    'peguche-quito':                    15,

    'pifo-aeropuerto':                  5,
    'pifo-quito':                       6,

    'pillaro-ambato':                   5,
    'pillaro-banos':                    6,
    'pillaro-latacunga':                8,
    'pillaro-quito':                    11,

    'portoviejo-guayaquil':             29,
    'portoviejo-manta':                 4,
    'portoviejo-quito':                 49,

    'puyo-ambato':                      14,
    'puyo-macas':                       34,
    'puyo-quito':                       34,
    'puyo-tena':                        11,

    'quito-aeropuerto':                 10,
    'quito-alausi':                     29,
    'quito-aloasi':                     10,
    'quito-ambato':                     15,
    'quito-atuntaqui':                  14,
    'quito-banos':                      17,
    'quito-cayambe':                    8,
    'quito-cevallos':                   12,
    'quito-cotacachi':                  15,
    'quito-cuenca':                     44,
    'quito-el_carmen':                  20,
    'quito-el_quinche':                 7,
    'quito-esmeraldas':                 29,
    'quito-guaranda':                   24,
    'quito-guayaquil':                  49,
    'quito-guayllabamba':               6,
    'quito-ibarra':                     15,
    'quito-la_concordia':               20,
    'quito-lago_agrio':                 39,
    'quito-latacunga':                  10,
    'quito-loja':                       69,
    'quito-macas':                      54,
    'quito-machachi':                   9,
    'quito-machala':                    64,
    'quito-manta':                      49,
    'quito-mocha':                      13,
    'quito-montanita':                  54,
    'quito-otavalo':                    12,
    'quito-peguche':                    15,
    'quito-pifo':                       6,
    'quito-pillaro':                    11,
    'quito-portoviejo':                 49,
    'quito-puyo':                       34,
    'quito-riobamba':                   17,
    'quito-salcedo':                    12,
    'quito-salinas':                    59,
    'quito-santo_domingo':              15,
    'quito-tabacundo':                  7,
    'quito-tambillo':                   8,
    'quito-tena':                       29,
    'quito-tisaleo':                    12,
    'quito-tulcan':                     24,
    'quito-zaruma':                     64,

    'riobamba-aeropuerto':              25,
    'riobamba-alausi':                  11,
    'riobamba-ambato':                  7,
    'riobamba-cuenca':                  24,
    'riobamba-guayaquil':               29,
    'riobamba-latacunga':               11,
    'riobamba-quito':                   17,

    'salcedo-ambato':                   5,
    'salcedo-latacunga':                3,
    'salcedo-quito':                    12,

    'salinas-guayaquil':                14,
    'salinas-manta':                    49,
    'salinas-montanita':                9,
    'salinas-quito':                    59,

    'santo_domingo-aeropuerto':         23,
    'santo_domingo-el_carmen':          8,
    'santo_domingo-guayaquil':          29,
    'santo_domingo-la_concordia':       8,
    'santo_domingo-quito':              15,

    'tabacundo-quito':                  7,

    'tambillo-quito':                   8,

    'tena-ambato':                      17,
    'tena-lago_agrio':                  34,
    'tena-macas':                       44,
    'tena-puyo':                        11,
    'tena-quito':                       29,

    'tisaleo-ambato':                   4,
    'tisaleo-banos':                    5,
    'tisaleo-quito':                    12,

    'tulcan-ibarra':                    14,
    'tulcan-quito':                     24,

    'zaruma-cuenca':                    29,
    'zaruma-guayaquil':                 29,
    'zaruma-loja':                      17,
    'zaruma-machala':                   19,
    'zaruma-quito':                     64,
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
  const shared = getFare(origin, destination);
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

export function getFare(origin: string, destination: string): number | null {
  const key = `${normalize(origin)}-${normalize(destination)}`;
  return (FARES.shared as any)[key] ?? null;
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
