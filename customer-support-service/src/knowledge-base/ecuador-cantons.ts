/**
 * Ecuador Cantons Knowledge Base
 * Datos de cantones clave con cobertura GOING
 * Schema basado en el diseño de la plantilla de contexto del agente
 */

export interface Canton {
  id: string;
  name: string;
  province: string;
  region: 'Costa' | 'Sierra' | 'Amazonía' | 'Galápagos';
  altitude_m: number;
  climate: {
    zone: string;
    avg_temp_c: { min: number; max: number };
    best_visit_months: string[];
  };
  attractions_es: string[];
  gastronomy_es: string[];
  going_coverage: boolean;
}

export const ECUADOR_CANTONS_KB: Canton[] = [
  {
    id: 'quito',
    name: 'Quito',
    province: 'Pichincha',
    region: 'Sierra',
    altitude_m: 2850,
    climate: { zone: 'Ecuatorial mesotérmico', avg_temp_c: { min: 7, max: 22 }, best_visit_months: ['Junio', 'Julio', 'Agosto', 'Septiembre'] },
    attractions_es: ['Centro Histórico Patrimonio UNESCO', 'Teleférico', 'Mitad del Mundo', 'Parque La Carolina', 'Basílica del Voto Nacional'],
    gastronomy_es: ['Fritada', 'Caldo de patas', 'Hornado', 'Colada morada'],
    going_coverage: true,
  },
  {
    id: 'guayaquil',
    name: 'Guayaquil',
    province: 'Guayas',
    region: 'Costa',
    altitude_m: 4,
    climate: { zone: 'Tropical húmedo', avg_temp_c: { min: 22, max: 32 }, best_visit_months: ['Julio', 'Agosto', 'Septiembre', 'Octubre'] },
    attractions_es: ['Malecón 2000', 'Las Peñas', 'Parque Histórico', 'Cerro Santa Ana'],
    gastronomy_es: ['Ceviche', 'Encebollado', 'Seco de pato', 'Bolón de verde'],
    going_coverage: true,
  },
  {
    id: 'cuenca',
    name: 'Cuenca',
    province: 'Azuay',
    region: 'Sierra',
    altitude_m: 2550,
    climate: { zone: 'Ecuatorial mesotérmico', avg_temp_c: { min: 8, max: 20 }, best_visit_months: ['Julio', 'Agosto', 'Enero', 'Febrero'] },
    attractions_es: ['Centro Histórico Patrimonio UNESCO', 'Catedral Nueva', 'Museo del Sombrero', 'Parque Cajas'],
    gastronomy_es: ['Cuy asado', 'Mote pillo', 'Hornado', 'Morocho'],
    going_coverage: true,
  },
  {
    id: 'banos',
    name: 'Baños',
    province: 'Tungurahua',
    region: 'Sierra',
    altitude_m: 1800,
    climate: { zone: 'Subtropical', avg_temp_c: { min: 14, max: 24 }, best_visit_months: ['Enero', 'Febrero', 'Junio', 'Julio'] },
    attractions_es: ['Volcán Tungurahua', 'Ruta de las Cascadas', 'Rafting río Pastaza', 'Parapente', 'Casa del Árbol'],
    gastronomy_es: ['Melcocha', 'Taffy de caña', 'Truchas', 'Guarapo'],
    going_coverage: true,
  },
  {
    id: 'otavalo',
    name: 'Otavalo',
    province: 'Imbabura',
    region: 'Sierra',
    altitude_m: 2530,
    climate: { zone: 'Ecuatorial mesotérmico', avg_temp_c: { min: 8, max: 20 }, best_visit_months: ['Junio', 'Julio', 'Agosto'] },
    attractions_es: ['Mercado de Artesanías Plaza de los Ponchos', 'Laguna de San Pablo', 'Cascada de Peguche', 'Parque Condor'],
    gastronomy_es: ['Yamor (chicha de 7 granos)', 'Fritada otavaleña', 'Tostado'],
    going_coverage: true,
  },
  {
    id: 'montanita',
    name: 'Montañita',
    province: 'Santa Elena',
    region: 'Costa',
    altitude_m: 5,
    climate: { zone: 'Tropical seco', avg_temp_c: { min: 20, max: 30 }, best_visit_months: ['Diciembre', 'Enero', 'Febrero', 'Marzo'] },
    attractions_es: ['Surf', 'Playa', 'Avistamiento de ballenas (Jul-Oct)', 'Vida nocturna', 'Pueblo Manglar Alto'],
    gastronomy_es: ['Ceviche de camarón', 'Viche', 'Encocado de pescado'],
    going_coverage: true,
  },
  {
    id: 'loja',
    name: 'Loja',
    province: 'Loja',
    region: 'Sierra',
    altitude_m: 2060,
    climate: { zone: 'Ecuatorial mesotérmico', avg_temp_c: { min: 10, max: 22 }, best_visit_months: ['Julio', 'Agosto', 'Septiembre'] },
    attractions_es: ['Parque Nacional Podocarpus', 'Vilcabamba', 'Centro histórico', 'Santuario de El Cisne'],
    gastronomy_es: ['Cecina', 'Repe lojano', 'Tamales', 'Café de Loja'],
    going_coverage: true,
  },
  {
    id: 'tena',
    name: 'Tena',
    province: 'Napo',
    region: 'Amazonía',
    altitude_m: 511,
    climate: { zone: 'Tropical húmedo', avg_temp_c: { min: 18, max: 28 }, best_visit_months: ['Agosto', 'Septiembre', 'Octubre'] },
    attractions_es: ['Rafting río Napo', 'Comunidades Kichwas', 'Cascada de Latas', 'Cacao nativo amazónico'],
    gastronomy_es: ['Maito de tilapia', 'Chicha de yuca', 'Ayampaco', 'Chocolate artesanal'],
    going_coverage: true,
  },
  {
    id: 'riobamba',
    name: 'Riobamba',
    province: 'Chimborazo',
    region: 'Sierra',
    altitude_m: 2750,
    climate: { zone: 'Ecuatorial mesotérmico', avg_temp_c: { min: 5, max: 18 }, best_visit_months: ['Junio', 'Julio', 'Agosto', 'Septiembre'] },
    attractions_es: ['Volcán Chimborazo', 'Nariz del Diablo (tren)', 'Mercado La Merced', 'Parque Nacional Sangay'],
    gastronomy_es: ['Caldo de 31', 'Yahuarlocro', 'Hornado de Riobamba', 'Chicha huevona'],
    going_coverage: true,
  },
  {
    id: 'manta',
    name: 'Manta',
    province: 'Manabí',
    region: 'Costa',
    altitude_m: 6,
    climate: { zone: 'Tropical seco', avg_temp_c: { min: 20, max: 30 }, best_visit_months: ['Julio', 'Agosto', 'Septiembre', 'Octubre'] },
    attractions_es: ['Playa Murciélago', 'Puerto Pesquero', 'Museo del Sombrero de Paja Toquilla', 'Bahía de Manta'],
    gastronomy_es: ['Ceviche manabita', 'Viche de mariscos', 'Seco de gallina', 'Tonga'],
    going_coverage: true,
  },
];
