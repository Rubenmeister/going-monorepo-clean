/**
 * Rutas oficiales de viajes compartidos Going — IDA + VUELTA.
 *
 * stopPrices = precio por asiento desde cada parada hasta el final de la
 * ruta. Se combina con QUITO_ZONES surcharge cuando aplica.
 */

export interface GoingRoute {
  id:         string;
  label:      string;
  icon:       string;
  direction:  'ida' | 'vuelta';
  stops:      string[];
  stopPrices: Record<string, number>;
}

export const GOING_SHARED_ROUTES: GoingRoute[] = [
  // ── IDA: ciudades → Quito ─────────────────────────────────────────────────
  {
    id:        'sierra_centro',
    label:     'Sierra Centro → Quito',
    icon:      '🏔️',
    direction: 'ida',
    stops:     ['Riobamba', 'Ambato', 'Latacunga', 'Quito'],
    stopPrices:{ Riobamba: 17, Ambato: 10, Latacunga: 8 },
  },
  {
    id:        'costa_quito',
    label:     'Costa → Quito',
    icon:      '🌊',
    direction: 'ida',
    stops:     ['El Carmen', 'La Concordia', 'Santo Domingo', 'Quito'],
    stopPrices:{ 'El Carmen': 14, 'La Concordia': 13, 'Santo Domingo': 11 },
  },
  {
    id:        'sierra_norte',
    label:     'Sierra Norte → Quito',
    icon:      '🌿',
    direction: 'ida',
    stops:     ['Ibarra', 'Otavalo', 'Quito'],
    stopPrices:{ Ibarra: 11, Otavalo: 9 },
  },
  // ── VUELTA: Quito → ciudades (viajes de regreso del conductor) ────────────
  {
    id:        'quito_sierra_centro',
    label:     'Quito → Sierra Centro',
    icon:      '🏔️',
    direction: 'vuelta',
    stops:     ['Quito', 'Latacunga', 'Ambato', 'Riobamba'],
    stopPrices:{ Quito: 10, Latacunga: 8, Ambato: 6 },
  },
  {
    id:        'quito_costa',
    label:     'Quito → Costa',
    icon:      '🌊',
    direction: 'vuelta',
    stops:     ['Quito', 'Santo Domingo', 'La Concordia', 'El Carmen'],
    stopPrices:{ Quito: 11, 'Santo Domingo': 8, 'La Concordia': 6 },
  },
  {
    id:        'quito_sierra_norte',
    label:     'Quito → Sierra Norte',
    icon:      '🌿',
    direction: 'vuelta',
    stops:     ['Quito', 'Otavalo', 'Ibarra'],
    stopPrices:{ Quito: 9, Otavalo: 6 },
  },
];

/** Rutas destacadas para mostrar en el home como sugerencias rápidas. */
export const FEATURED_ROUTES = [
  { id: 'r1', label: 'El Carmen → Sto. Domingo → Quito → Aeropuerto', color: '#FF4C41', icon: '✈️', badge: 'Popular'   },
  { id: 'r2', label: 'Riobamba → Ambato → Latacunga → Quito',         color: '#FF4C41', icon: '🏔️', badge: 'Frecuente' },
  { id: 'r3', label: 'Ibarra → Otavalo → Quito → Aeropuerto',         color: '#43A047', icon: '🌿', badge: 'Rápida'    },
];
