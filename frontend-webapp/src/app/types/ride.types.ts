/**
 * Ride and Location types
 */

export interface Location {
  address: string;
  lat: number;
  lon: number;
  city?: string;
}

export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface DriverInfo {
  name: string;
  rating: number;
  photo: string;
  vehicle: string;
  licensePlate: string;
}

export interface Ride {
  tripId: string;
  passengerId: string;
  driverId?: string;
  pickup: Location;
  dropoff: Location;
  estimatedFare: number;
  finalFare?: number;
  distance: number;
  duration: number;
  status: RideStatus;
  createdAt: Date;
  completedAt?: Date;
  driverLocation?: Location;
  driverInfo?: DriverInfo;
  passengers?: number;
  vehicleType?: VehicleType;
  serviceTier?: ServiceTier;
}

/* ─────────────────────────────────────────────────────────────────────
   Vehicle types — capacity-based
   SUV: 1-4 | SUV XL: 3-5 | VAN: 6-7 | VAN XL: 7-14 | MINIBUS: 15-25 | BUS: 26+
   ───────────────────────────────────────────────────────────────────── */
export type VehicleType = 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'minibus' | 'bus' | 'other';

/** Service quality tier — applies to every vehicle type */
export type ServiceTier = 'confort' | 'premium';

/** Legacy alias kept for backward compatibility */
export type RideType = VehicleType;

export interface VehicleConfig {
  label:        string;
  minPax:       number;
  maxPax:       number;
  desc:         string;
  /** Unsplash photo URL for display */
  imageConfort: string;
  imagePremium: string;
  /** Base price multiplier relative to SUV Confort */
  multiplierConfort:  number;
  multiplierPremium:  number;
  priceFromConfort:   string;
  priceFromPremium:   string;
  /** Features included per tier */
  featuresConfort: string[];
  featuresPremium: string[];
}

export const VEHICLE_TYPES: Record<VehicleType, VehicleConfig> = {
  suv: {
    label:    'SUV',
    minPax: 1, maxPax: 4,
    desc:     'Hasta 4 pasajeros',
    imageConfort:  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80',
    multiplierConfort: 1.0,  multiplierPremium: 1.5,
    priceFromConfort:  'desde $2.50',  priceFromPremium:  'desde $3.75',
    featuresConfort: ['AC', 'Música'],
    featuresPremium: ['AC', 'WiFi', 'Agua', 'USB', 'Privacidad'],
  },
  suv_xl: {
    label:    'SUV XL',
    minPax: 3, maxPax: 5,
    desc:     'Hasta 5 pasajeros',
    imageConfort:  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&q=80',
    multiplierConfort: 1.4,  multiplierPremium: 2.0,
    priceFromConfort:  'desde $3.50',  priceFromPremium:  'desde $5.00',
    featuresConfort: ['AC', 'Maletero amplio'],
    featuresPremium: ['AC Premium', 'WiFi', 'Agua', 'USB x4', 'Techo panorámico'],
  },
  van: {
    label:    'VAN',
    minPax: 5, maxPax: 7,
    desc:     'Hasta 7 pasajeros',
    imageConfort:  'https://images.unsplash.com/photo-1558981852-426c349d7b49?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1570294646112-26ede6deb685?w=600&q=80',
    multiplierConfort: 2.0,  multiplierPremium: 2.8,
    priceFromConfort:  'desde $5.00',  priceFromPremium:  'desde $7.00',
    featuresConfort: ['AC', 'Espacio de equipaje'],
    featuresPremium: ['AC Premium', 'WiFi', 'Agua', 'Asientos reclinables', 'USB'],
  },
  van_xl: {
    label:    'VAN XL',
    minPax: 7, maxPax: 14,
    desc:     'Hasta 14 pasajeros',
    imageConfort:  'https://images.unsplash.com/photo-1570294646112-26ede6deb685?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=600&q=80',
    multiplierConfort: 3.0,  multiplierPremium: 4.0,
    priceFromConfort:  'desde $7.50',  priceFromPremium:  'desde $10.00',
    featuresConfort: ['AC', 'Maletero XL', 'Audio'],
    featuresPremium: ['AC Premium', 'WiFi', 'Agua', 'TV', 'USB x8', 'Conductor bilingüe'],
  },
  minibus: {
    label:    'Minibús',
    minPax: 15, maxPax: 25,
    desc:     '15 a 25 pasajeros',
    imageConfort:  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=600&q=80',
    multiplierConfort: 5.0,  multiplierPremium: 7.0,
    priceFromConfort:  'desde $12.00', priceFromPremium:  'desde $17.00',
    featuresConfort: ['AC', 'Audio', 'Compartimento de maletas'],
    featuresPremium: ['AC Premium', 'WiFi', 'Agua', 'TV', 'Asientos Premium', 'Guía disponible'],
  },
  bus: {
    label:    'Bus',
    minPax: 26, maxPax: 100,
    desc:     '26 o más pasajeros',
    imageConfort:  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=600&q=80',
    multiplierConfort: 10.0, multiplierPremium: 14.0,
    priceFromConfort:  'desde $25.00', priceFromPremium:  'desde $35.00',
    featuresConfort: ['AC', 'Audio', 'WC', 'Maletero'],
    featuresPremium: ['AC Premium', 'WiFi', 'Agua/Snacks', 'TV', 'WC Premium', 'Conductor bilingüe'],
  },
  other: {
    label:    'Especial',
    minPax: 1, maxPax: 8,
    desc:     'Vehículo especial / adaptado',
    imageConfort:  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80',
    imagePremium:  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80',
    multiplierConfort: 1.5,  multiplierPremium: 2.2,
    priceFromConfort:  'desde $4.00',  priceFromPremium:  'desde $5.50',
    featuresConfort: ['AC', 'Accesibilidad'],
    featuresPremium: ['AC Premium', 'WiFi', 'Rampa', 'Asistencia especializada'],
  },
};

/** Backward-compat alias used by fareCalculator */
export const RIDE_TYPES = Object.fromEntries(
  Object.entries(VEHICLE_TYPES).map(([k, v]) => [k, {
    label:      v.label,
    emoji:      '🚗',
    multiplier: v.multiplierConfort,
    minPax:     v.minPax,
    maxPax:     v.maxPax,
    desc:       v.desc,
    priceFrom:  v.priceFromConfort,
  }])
) as Record<VehicleType, { label: string; emoji: string; multiplier: number; minPax: number; maxPax: number; desc: string; priceFrom: string }>;

/** Recommended (smallest fitting) vehicle for a given passenger count */
export function recommendVehicleForPax(pax: number): VehicleType {
  if (pax <= 4)  return 'suv';
  if (pax <= 5)  return 'suv_xl';
  if (pax <= 7)  return 'van';
  if (pax <= 14) return 'van_xl';
  if (pax <= 25) return 'minibus';
  return 'bus';
}

/** All vehicle types that can accommodate the given number of passengers */
export function availableVehiclesForPax(pax: number): VehicleType[] {
  return (Object.keys(VEHICLE_TYPES) as VehicleType[]).filter(
    (t) => VEHICLE_TYPES[t].maxPax >= pax
  );
}

export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  pending:     'Buscando conductor',
  accepted:    'Conductor asignado',
  in_progress: 'Viaje en curso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};
