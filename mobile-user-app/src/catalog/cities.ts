/**
 * Catálogo de ciudades origen — Going App Ecuador.
 *
 * Lista canónica del frontend. Match con el catálogo backend en
 * libs/pricing/cities.ts (Paso 0 de la migración). Cuando agreguemos
 * ciudades nuevas, actualizar AMBOS lugares (o esperar a unificar via
 * libs/contracts compartido).
 */
import { CityId } from './types';

export interface OriginCity {
  id:       CityId;
  label:    string;
  province: string;
}

export const ORIGIN_CITIES: OriginCity[] = [
  // ── Rutas Going App (aeropuerto + Sierra principales) ──────────────────────
  { id: 'aeropuerto_quito', label: 'Aeropuerto Quito (Tababela)', province: 'Pichincha' },
  { id: 'quito',            label: 'Quito',                       province: 'Pichincha' },
  // ── Sierra Centro ──────────────────────────────────────────────────────
  { id: 'ambato',    label: 'Ambato',    province: 'Tungurahua' },
  { id: 'banos',     label: 'Baños',     province: 'Tungurahua' },
  { id: 'latacunga', label: 'Latacunga', province: 'Cotopaxi'   },
  { id: 'salcedo',   label: 'Salcedo',   province: 'Cotopaxi'   },
  { id: 'pillaro',   label: 'Píllaro',   province: 'Tungurahua' },
  { id: 'cevallos',  label: 'Cevallos',  province: 'Tungurahua' },
  { id: 'tisaleo',   label: 'Tisaleo',   province: 'Tungurahua' },
  { id: 'mocha',     label: 'Mocha',     province: 'Tungurahua' },
  // ── Sierra Norte ───────────────────────────────────────────────────────
  { id: 'ibarra',    label: 'Ibarra',    province: 'Imbabura' },
  { id: 'otavalo',   label: 'Otavalo',   province: 'Imbabura' },
  { id: 'atuntaqui', label: 'Atuntaqui', province: 'Imbabura' },
  { id: 'peguche',   label: 'Peguche',   province: 'Imbabura' },
  { id: 'tulcan',    label: 'Tulcán',    province: 'Carchi'   },
  // ── Costa / Santo Domingo ─────────────────────────────────────────────
  { id: 'el_carmen',    label: 'El Carmen',    province: 'Manabí'        },
  { id: 'la_concordia', label: 'La Concordia', province: 'Santo Domingo' },
  { id: 'santo_domingo',label: 'Santo Domingo',province: 'Santo Domingo' },
  // ── Resto Ecuador ─────────────────────────────────────────────────────
  { id: 'guayaquil',    label: 'Guayaquil',    province: 'Guayas'           },
  { id: 'cuenca',       label: 'Cuenca',       province: 'Azuay'            },
  { id: 'riobamba',     label: 'Riobamba',     province: 'Chimborazo'       },
  { id: 'loja',         label: 'Loja',         province: 'Loja'             },
  { id: 'manta',        label: 'Manta',        province: 'Manabí'           },
  { id: 'portoviejo',   label: 'Portoviejo',   province: 'Manabí'           },
  { id: 'esmeraldas',   label: 'Esmeraldas',   province: 'Esmeraldas'       },
  { id: 'machala',      label: 'Machala',      province: 'El Oro'           },
  { id: 'babahoyo',     label: 'Babahoyo',     province: 'Los Ríos'         },
  { id: 'lago_agrio',   label: 'Lago Agrio',   province: 'Sucumbíos'        },
  { id: 'tena',         label: 'Tena',         province: 'Napo'             },
  { id: 'puyo',         label: 'Puyo',         province: 'Pastaza'          },
  { id: 'macas',        label: 'Macas',        province: 'Morona Santiago'  },
  { id: 'zamora',       label: 'Zamora',       province: 'Zamora Chinchipe' },
  { id: 'guaranda',     label: 'Guaranda',     province: 'Bolívar'          },
];
