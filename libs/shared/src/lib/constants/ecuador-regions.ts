export enum EcuadorRegion {
  COSTA = 'COSTA',
  SIERRA = 'SIERRA',
  AMAZONIA = 'AMAZONIA',
  GALAPAGOS = 'GALAPAGOS',
}

export const ECUADOR_REGIONS = {
  [EcuadorRegion.COSTA]: {
    label: 'Costa',
    colorKey: 'costa',
    colorHex: '#FFD253', // Warm Yellow
    description: 'Playas, sol y gastronomía del mar.',
    slogan: 'Calidez que mueve',
  },
  [EcuadorRegion.SIERRA]: {
    label: 'Sierra',
    colorKey: 'sierra',
    colorHex: '#8B4513', // Earth/Maroon (Using Hex for reference, will be in tailwind) -> maybe adjusting to a brand brown/red
    description: 'Montañas, volcanes y cultura andina.',
    slogan: 'Alturas que inspiran',
  },
  [EcuadorRegion.AMAZONIA]: {
    label: 'Amazonía',
    colorKey: 'amazonia',
    colorHex: '#228B22', // Forest Green
    description: 'Selva, biodiversidad y aventura.',
    slogan: 'Naturaleza viva',
  },
  [EcuadorRegion.GALAPAGOS]: {
    label: 'Galápagos',
    colorKey: 'galapagos',
    colorHex: '#008080', // Teal/Blue
    description: 'Islas encantadas y evolución.',
    slogan: 'Evolución constante',
  },
};

export const PROVINCES = {
  [EcuadorRegion.COSTA]: ['Guayas', 'Manabí', 'Esmeraldas', 'Los Ríos', 'El Oro', 'Santa Elena', 'Santo Domingo'],
  [EcuadorRegion.SIERRA]: ['Pichincha', 'Azuay', 'Loja', 'Imbabura', 'Tungurahua', 'Chimborazo', 'Cotopaxi', 'Bolívar', 'Cañar', 'Carchi'],
  [EcuadorRegion.AMAZONIA]: ['Sucumbíos', 'Napo', 'Orellana', 'Pastaza', 'Morona Santiago', 'Zamora Chinchipe'],
  [EcuadorRegion.GALAPAGOS]: ['Galápagos'],
};

export const POPULAR_ROUTES = [
  { from: 'UIO', to: 'CUE', label: 'Quito ↔ Cuenca', region: EcuadorRegion.SIERRA },
  { from: 'GYE', to: 'SAL', label: 'Guayaquil ↔ Salinas', region: EcuadorRegion.COSTA },
  { from: 'UIO', to: 'BAN', label: 'Quito ↔ Baños', region: EcuadorRegion.SIERRA },
  { from: 'GYE', to: 'MTA', label: 'Guayaquil ↔ Montañita', region: EcuadorRegion.COSTA },
];
