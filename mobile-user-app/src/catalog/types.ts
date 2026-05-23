/**
 * Tipos compartidos del catálogo Going (mobile-user-app).
 *
 * Estos tipos viven aquí (no en backend) porque son enums que se usan en
 * pickers de UI, store local (Zustand), y AsyncStorage para preferencias.
 * El backend tiene su propio set de tipos en libs/pricing (cuando exista
 * un libs/contracts compartido podemos unificar).
 */

/** IDs de ciudades origen disponibles. Match con catálogo backend (libs/pricing). */
export type CityId =
  | 'aeropuerto_quito' | 'quito' | 'guayaquil' | 'cuenca' | 'ambato' | 'riobamba'
  | 'loja' | 'manta' | 'portoviejo' | 'ibarra' | 'esmeraldas'
  | 'machala' | 'santo_domingo' | 'latacunga' | 'tulcan' | 'babahoyo'
  | 'lago_agrio' | 'tena' | 'puyo' | 'macas' | 'zamora' | 'guaranda'
  | 'banos' | 'el_carmen' | 'otavalo' | 'atuntaqui' | 'peguche'
  | 'salcedo' | 'pillaro' | 'cevallos' | 'tisaleo' | 'mocha' | 'la_concordia';

/** Zonas dentro de Quito (con surcharge cuando aplica). */
export type QuitoZone = 'quito_norte' | 'quito_centro' | 'quito_sur' | 'valles' | 'aeropuerto';

/** Modo del viaje: compartido (por asiento) o privado (vehículo completo). */
export type TripMode = 'compartido' | 'privado';

/** Vehículos disponibles. SUV/SUV XL para urbanos+envíos, VAN/XL/BUS solo privado. */
export type VehicleId = 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'bus';

/**
 * Categorías de servicio (brand decision rev 2026-05-23):
 *   - confort  → SUV estándar
 *   - premium  → Gama alta / SUV XL
 *   - empresa  → B2B corporativo (NO es tier de cliente, es facturación
 *                corporativa con descuento). Solo privado.
 */
export type Category = 'confort' | 'premium' | 'empresa';
