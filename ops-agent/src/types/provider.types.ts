/**
 * Going - Tipos de proveedores para el Agente de Operaciones
 * Jerarquía geográfica: Provincia → Cantón → Parroquia
 */

export interface GeoLocation {
  provincia: string;
  canton: string;
  parroquia: string;
  lat: number;
  lon: number;
  address: string;
}

export interface CompanyData {
  nombre: string;
  ruc: string;
  permisos: string[];        // ANT, municipio, etc.
  gerente: string;
  telefono: string;
  email: string;
  direccion: string;
  sitioWeb?: string;
}

export interface VehicleData {
  placa: string;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  tipo: 'sedan' | 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'minibus' | 'bus';
  capacidad: number;
  soatExpiry: string;        // ISO date
  revisionTecnicaExpiry: string;
}

export interface LicenseData {
  tipo: 'B' | 'C' | 'D' | 'E' | 'F';
  numero: string;
  expiry: string;            // ISO date
}

export interface InsuranceData {
  company: string;
  policy: string;
  expiry: string;            // ISO date
}

export interface RatingData {
  average: number;
  count: number;
  lastUpdated: string;
}

export interface ServiceHours {
  date: string;              // YYYY-MM-DD
  hoursConnected: number;
  hoursActive: number;       // en viaje
  hoursIdle: number;         // conectado pero sin viaje
  lastSeen: string;          // ISO timestamp
}

export interface RevenueData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyTarget: number;          // $100 default
  lastRideAt?: string;
  goalCelebratedToday?: boolean; // true si ya se envió alerta de meta $100 alcanzada hoy
}

export interface AcademyData {
  completedCourses: string[];
  certifications: string[];
  totalScore: number;        // 0-100
  lastActivityAt?: string;
  pendingCourses: string[];
}

// ─── DRIVER ────────────────────────────────────────────────────
export interface Driver {
  id: string;
  userId: string;
  companyId?: string;        // si pertenece a una empresa
  status: 'available' | 'busy' | 'offline' | 'suspended';
  personal: {
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
    email: string;
    fotoUrl?: string;
  };
  location: GeoLocation;
  vehicle: VehicleData;
  license: LicenseData;
  insurance: InsuranceData;
  rating: RatingData;
  serviceHours: ServiceHours;
  revenue: RevenueData;
  academy: AcademyData;
  createdAt: string;
  updatedAt: string;
}

// ─── TRANSPORT COMPANY ─────────────────────────────────────────
export interface TransportProvider {
  id: string;
  type: 'transport';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  location: GeoLocation;
  company: CompanyData;
  rating: RatingData;
  totalDrivers: number;
  activeDrivers: number;
  revenue: RevenueData;
  academy: AcademyData;
  createdAt: string;
  updatedAt: string;
}

// ─── HOST (Anfitrión) ──────────────────────────────────────────
export interface HostProvider {
  id: string;
  type: 'host';
  status: 'active' | 'pending' | 'suspended';
  personal: {
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
    email: string;
  };
  company?: CompanyData;     // si es empresa
  location: GeoLocation;
  properties: HostProperty[];
  rating: RatingData;
  revenue: RevenueData;
  academy: AcademyData;
  createdAt: string;
  updatedAt: string;
}

export interface HostProperty {
  id: string;
  nombre: string;
  tipo: 'habitacion' | 'departamento' | 'casa' | 'hosteria' | 'hotel' | 'glamping';
  capacidad: number;
  precioNoche: number;
  amenidades: string[];
  fotos: string[];
  rating: RatingData;
  status: 'active' | 'inactive';
}

// ─── LOCAL GUIDE (Promotor Local) ─────────────────────────────
export interface GuideProvider {
  id: string;
  type: 'guide';
  status: 'active' | 'pending' | 'suspended';
  personal: {
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
    email: string;
    fotoUrl?: string;
  };
  location: GeoLocation;
  idiomas: string[];
  especialidades: string[];  // gastronomía, historia, aventura, etc.
  certificaciones: string[];
  experiencias: GuideExperience[];
  rating: RatingData;
  revenue: RevenueData;
  academy: AcademyData;
  createdAt: string;
  updatedAt: string;
}

export interface GuideExperience {
  id: string;
  nombre: string;
  descripcion: string;
  duracionHoras: number;
  precio: number;
  maxPersonas: number;
  idiomas: string[];
  status: 'active' | 'inactive';
}

// ─── TOUR OPERATOR ────────────────────────────────────────────
export interface OperatorProvider {
  id: string;
  type: 'operator';
  status: 'active' | 'pending' | 'suspended';
  company: CompanyData;
  location: GeoLocation;
  licenciaTurismo: string;
  tours: TourPackage[];
  rating: RatingData;
  revenue: RevenueData;
  academy: AcademyData;
  createdAt: string;
  updatedAt: string;
}

export interface TourPackage {
  id: string;
  nombre: string;
  descripcion: string;
  destinos: string[];
  duracionDias: number;
  precio: number;
  incluye: string[];
  noIncluye: string[];
  maxPersonas: number;
  idiomas: string[];
  dificultad: 'facil' | 'moderado' | 'dificil';
  status: 'active' | 'inactive';
}

// ─── ALERT ────────────────────────────────────────────────────
export type AlertType =
  | 'no_driver_assigned'     // viaje sin conductor +10 min
  | 'driver_idle'            // conductor conectado +2h sin viaje
  | 'below_revenue_target'   // menos de $50 al mediodía
  | 'license_expiring'       // licencia vence en 15 días
  | 'insurance_expiring'     // seguro vence en 15 días
  | 'soat_expiring'          // SOAT vence en 15 días
  | 'low_rating'             // calificación bajo 4.0
  | 'academy_inactive'       // sin capacitación +30 días
  | 'driver_offline_peak'    // offline en hora pico
  | 'daily_target_achieved'; // alcanzó $100 del día 🎉

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  providerId: string;
  providerName: string;
  message: string;
  data: Record<string, unknown>;
  sentAt: string;
  resolvedAt?: string;
  sentToTelegram: boolean;
}
