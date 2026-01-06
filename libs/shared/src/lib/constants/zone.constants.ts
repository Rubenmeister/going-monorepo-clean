export interface Zone {
  id: string;
  name: string;
  city: 'QUITO' | 'GUAYAQUIL';
}

export const ECUADOR_ZONES: Zone[] = [
  // Quito Zones
  { id: 'UIO-NORTH', name: 'Quito Norte (Condado, Carcelén, Calderón)', city: 'QUITO' },
  { id: 'UIO-CENTRAL', name: 'Quito Centro (Centro Histórico, La Mariscal, La Carolina)', city: 'QUITO' },
  { id: 'UIO-SOUTH', name: 'Quito Sur (Villa Flora, Quitumbe, Guamaní)', city: 'QUITO' },
  { id: 'UIO-VALLEY-TUMBACO', name: 'Valles (Tumbaco, Cumbayá, Puembo)', city: 'QUITO' },
  { id: 'UIO-VALLEY-CHILLOS', name: 'Los Chillos (Sangolquí, Conocoto)', city: 'QUITO' },
  { id: 'UIO-NORTHWEST', name: 'Quito Noroccidente (Ponciano, Cotocollao)', city: 'QUITO' },

  // Guayaquil Zones
  { id: 'GYE-NORTH', name: 'Guayaquil Norte (Urdesa, Samborondón, Ceibos)', city: 'GUAYAQUIL' },
  { id: 'GYE-CENTRAL', name: 'Guayaquil Centro (9 de Octubre, Malecón, Centenario)', city: 'GUAYAQUIL' },
  { id: 'GYE-SOUTH', name: 'Guayaquil Sur (Fertisa, Guasmo)', city: 'GUAYAQUIL' },
  { id: 'GYE-VIA-DAULE', name: 'Vía a Daule (Pascuales, Bastión Popular)', city: 'GUAYAQUIL' },
  { id: 'GYE-VIA-COSTA', name: 'Vía a la Costa (Chongón, Puerto Azul)', city: 'GUAYAQUIL' },
  { id: 'GYE-DURAN', name: 'Durán y Alrededores', city: 'GUAYAQUIL' },
];
