/**
 * Rutas oficiales de viajes compartidos Going App — IDA + VUELTA.
 *
 * Solo define corredores y sus paradas (qué ciudades conecta cada ruta).
 * El PRECIO no vive acá: lo cotiza/cobra el backend (libs/pricing) y el
 * mobile lo muestra a partir de la respuesta del backend, nunca de una
 * tabla local — así el precio mostrado nunca difiere del cobrado.
 */

export interface GoingRoute {
  id:        string;
  label:     string;
  icon:      string;
  direction: 'ida' | 'vuelta';
  stops:     string[];
}

export const GOING_SHARED_ROUTES: GoingRoute[] = [
  // ── IDA: ciudades → Quito ─────────────────────────────────────────────────
  {
    id:        'sierra_centro',
    label:     'Sierra Centro → Quito',
    icon:      '🏔️',
    direction: 'ida',
    stops:     ['Riobamba', 'Ambato', 'Latacunga', 'Quito'],
  },
  {
    id:        'costa_quito',
    label:     'Costa → Quito',
    icon:      '🌊',
    direction: 'ida',
    stops:     ['El Carmen', 'La Concordia', 'Santo Domingo', 'Quito'],
  },
  {
    id:        'sierra_norte',
    label:     'Sierra Norte → Quito',
    icon:      '🌿',
    direction: 'ida',
    stops:     ['Ibarra', 'Otavalo', 'Quito'],
  },
  // ── VUELTA: Quito → ciudades (viajes de regreso del conductor) ────────────
  {
    id:        'quito_sierra_centro',
    label:     'Quito → Sierra Centro',
    icon:      '🏔️',
    direction: 'vuelta',
    stops:     ['Quito', 'Latacunga', 'Ambato', 'Riobamba'],
  },
  {
    id:        'quito_costa',
    label:     'Quito → Costa',
    icon:      '🌊',
    direction: 'vuelta',
    stops:     ['Quito', 'Santo Domingo', 'La Concordia', 'El Carmen'],
  },
  {
    id:        'quito_sierra_norte',
    label:     'Quito → Sierra Norte',
    icon:      '🌿',
    direction: 'vuelta',
    stops:     ['Quito', 'Otavalo', 'Ibarra'],
  },
];

/** Rutas destacadas para mostrar en el home como sugerencias rápidas. */
export const FEATURED_ROUTES = [
  { id: 'r1', label: 'El Carmen → Sto. Domingo → Quito → Aeropuerto', color: '#FF4C41', icon: '✈️', badge: 'Popular'   },
  { id: 'r2', label: 'Riobamba → Ambato → Latacunga → Quito',         color: '#FF4C41', icon: '🏔️', badge: 'Frecuente' },
  { id: 'r3', label: 'Ibarra → Otavalo → Quito → Aeropuerto',         color: '#43A047', icon: '🌿', badge: 'Rápida'    },
];
