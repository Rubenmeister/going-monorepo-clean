/**
 * Tipos del Centro de Información Going.
 *
 * Reflejan el schema v2 de `knowledge-base/`. Cada interface mapea a un
 * archivo YAML o MD. Cambios al schema YAML deben actualizarse acá Y en
 * `loader.ts` (validación al parsear).
 *
 * Convención: campos opcionales en YAML quedan opcionales en TS. Campos
 * con `revisar: true` flag siguen estando presentes (el flag se preserva
 * para que el caller decida si usarlos o pedir verificación humana).
 */

// ─── Modalidades y vehículos ─────────────────────────────────────────

export type Modality = 'shared' | 'private';

export type VehicleId =
  | 'auto'
  | 'suv'
  | 'suv_xl'
  | 'van'
  | 'van_xl'
  | 'minibus'
  | 'bus';

export type ClientTypeId =
  | 'retail'
  | 'corporate'
  | 'agency'
  | 'anfitrion'
  | 'conductor_off_duty';

export interface VehicleInfo {
  label: string;
  capacity_pax: number;
  aplica_compartido: boolean;
  aplica_privado: boolean;
  aplica_envios: boolean;
  multiplier_relativo_suv?: number;
}

// ─── Zonas dentro de ciudad ──────────────────────────────────────────

export interface ZoneInfo {
  id: string;
  label: string;
  origin_surcharge_usd: number;
  descripcion?: string;
  revisar?: boolean;
}

export interface CityZones {
  base_zone: string;
  zonas: ZoneInfo[];
}

// ─── Recargos dinámicos ─────────────────────────────────────────────

export interface DynamicSurchargeRule {
  id: string;
  label: string;
  privado_multiplier: number;
  compartido_multiplier: number;
  rango_horas?: string[];
  dias?: string[];
  descripcion?: string;
  revisar?: boolean;
}

export interface FeriadoSurcharge {
  privado_multiplier: number;
  compartido_multiplier: number;
  descripcion?: string;
  revisar?: boolean;
}

// ─── Tipos de cliente ───────────────────────────────────────────────

export interface ClientTypeInfo {
  id: ClientTypeId;
  label: string;
  multiplier: number;
  descripcion?: string;
  requiere_contrato?: boolean;
  activo_actualmente?: boolean;
  revisar?: boolean;
}

// ─── Rutas y tarifas ────────────────────────────────────────────────

export interface RouteEndpoint {
  canton: string;
  zone?: string;
}

export interface RouteEntry {
  id: string;
  origin: RouteEndpoint;
  destination: RouteEndpoint;
  distance_km?: number;
  duration_min_typical?: number;
  shared?: Partial<Record<VehicleId, number>>;
  private?: Partial<Record<VehicleId, number>>;
  premium_suv?: number;
  last_updated: string;
  revisar: boolean;
  notas?: string[];
  historial_cambios?: Array<{
    fecha: string;
    cambio: string;
    autor: string;
  }>;
  corredor?: string; // se inyecta al parsear
}

// ─── Envíos ────────────────────────────────────────────────────────

export interface PackageType {
  id: string;
  label: string;
  max_dimensions_cm?: { largo: number; ancho: number; alto: number } | null;
  max_weight_kg?: number | null;
  descripcion?: string;
}

export interface UrbanParcelPricing {
  sobre: number | null;
  mediano: number | null;
  grande: number | null;
  activo?: boolean;
  revisar?: boolean;
  notas?: string[];
}

export interface EnviosKB {
  package_types: PackageType[];
  tarifas_urbanas: {
    por_ciudad: Record<string, UrbanParcelPricing>;
  };
  tarifas_interurbanas: {
    modelo: string;
    porcentaje_sobre_compartido_suv?: {
      sobre: number;
      mediano: number;
      grande: number;
      revisar?: boolean;
    };
    notas?: string[];
  };
  recargos: {
    pickup_fuera_de_horario?: {
      horario_estandar: [string, string];
      fuera_de_horario_multiplier: number;
      revisar?: boolean;
    };
    paquete_fragil?: {
      addon_usd: number;
      descripcion?: string;
      revisar?: boolean;
    };
    comprobante_de_entrega_otp?: {
      addon_usd: number;
      descripcion?: string;
    };
  };
  no_transportamos: string[];
}

// ─── Cobertura ─────────────────────────────────────────────────────

export interface CoverageCity {
  name: string;
  region: string;
  province: string;
  is_capital?: boolean;
  type?: string;
  notes?: string;
}

export interface CoverageKB {
  active_cities: CoverageCity[];
  coming_soon: string[];
  not_serviced?: Array<{
    name: string;
    reason: string;
    sugerencia?: string;
  }>;
}

// ─── Flota ──────────────────────────────────────────────────────────

export interface FleetEntry {
  id: string;
  label: string;
  capacity: number;
  uso_tipico: string;
  activo: boolean;
  compartido_disponible: boolean;
  privado_disponible: boolean;
}

export interface FleetKB {
  fleet: FleetEntry[];
  restrictions: {
    envios?: { permitidos: VehicleId[]; razon?: string };
    carpooling?: { permitidos: VehicleId[]; razon?: string };
  };
}

// ─── Productos ─────────────────────────────────────────────────────

/**
 * Productos son archivos Markdown en `products/`. El loader los devuelve
 * como texto crudo (`raw`) y un objeto con metadata extraída del frontmatter
 * o de los headings del MD. Para v0.1 solo el texto crudo.
 */
export interface ProductDoc {
  id: string;
  filename: string;
  raw: string;
}

// ─── Contact ───────────────────────────────────────────────────────

export interface ContactKB {
  contact: {
    whatsapp: { number: string; label?: string; hours?: string };
    email: string;
    privacy_email?: string;
  };
  websites: {
    public: string;
    business?: string;
    marketing?: string;
    status_page?: string | null;
  };
  apps: {
    android: { available: boolean; package?: string; store_url?: string };
    ios: { available: boolean; notes?: string };
  };
  company: {
    legal_name: string;
    brand: string;
    country: string;
    city: string;
    tagline: string;
  };
  social?: Record<string, string | null>;
}

// ─── Lugares ───────────────────────────────────────────────────────

export interface LugarInfo {
  id: string;
  name: string;
  short_name?: string;
  province: string;
  region: string;
  canton: string;
  parroquia?: string;
  is_canton_capital?: boolean;
  is_country_capital?: boolean;
  geography: {
    altitude_m: number;
    area_km2?: number | null;
    population?: number | null;
    climate: {
      zone: string;
      avg_temp_c: { min: number; max: number };
      best_visit_months: string[];
      rainy_months?: string[];
    };
    notes?: string;
  };
  history_es?: string;
  attractions_es?: string[];
  gastronomy_es?: string[];
  events_es?: Array<{ name: string; when: string; description: string }>;
  going_coverage: {
    active: boolean;
    notes?: string;
    nearest_hub?: string | null;
    airport?: string;
    coming_soon?: boolean;
  };
  tags?: string[];
}

// ─── Documentos crudos (MD genéricos) ──────────────────────────────

export interface RawDoc {
  id: string;
  filename: string;
  raw: string;
}

// ─── Identidad de marca ────────────────────────────────────────────

export interface IdentityKB {
  tono: string;        // tono.md crudo
  no_decir: string;    // no-decir.md crudo
  brand_voice: string; // brand-voice.md crudo
}

// ─── Snapshot completo del KB ──────────────────────────────────────

/**
 * Objeto raíz que el loader devuelve después de parsear toda la carpeta.
 * Inmutable después de cargar (cache).
 */
export interface KnowledgeBaseSnapshot {
  loadedAt: Date;
  basePath: string;

  // YAMLs estructurados
  fleet: FleetKB;
  coverage: CoverageKB;
  contact: ContactKB;
  vehicles: Record<VehicleId, VehicleInfo>;
  premium_variants?: Record<string, {
    base_vehicle: VehicleId;
    label: string;
    premium_addon_usd: number;
    descripcion?: string;
  }>;
  zones: Record<string, CityZones>;
  dynamicSurcharges: {
    hora_del_dia: DynamicSurchargeRule[];
    dia_de_la_semana: DynamicSurchargeRule[];
    feriado: FeriadoSurcharge;
  };
  clientTypes: ClientTypeInfo[];
  rutas: RouteEntry[];           // consolidado de los 3 corredores
  envios: EnviosKB;

  // Lugares
  lugares: LugarInfo[];

  // Documentos MD crudos
  about: string;
  products: ProductDoc[];
  policies: RawDoc[];
  faq: RawDoc[];
  guiasUso: RawDoc[];
  legal: RawDoc[];
  identity: IdentityKB;

  // Warnings al parsear (archivos faltantes, parse errors, etc.)
  warnings: string[];
}

// ─── Resultado de cotización ───────────────────────────────────────

export interface FareBreakdownItem {
  type:
    | 'base'
    | 'origin_zone_surcharge'
    | 'hora_del_dia'
    | 'dia_de_la_semana'
    | 'feriado'
    | 'client_type'
    | 'discount';
  label: string;
  amount_usd: number;       // delta sobre el base (puede ser +/-)
  multiplier?: number;       // para items multiplicativos
}

export interface FareResult {
  routeId: string;
  basePrice: number;
  finalPrice: number;
  breakdown: FareBreakdownItem[];
  modality: Modality;
  vehicle: VehicleId;
  clientType: ClientTypeId;
  /** True si la ruta o algún parámetro está marcado `revisar` */
  revisar: boolean;
  /** True si el modelo es plenamente confiable (sin revisar flags). */
  trusted: boolean;
}
