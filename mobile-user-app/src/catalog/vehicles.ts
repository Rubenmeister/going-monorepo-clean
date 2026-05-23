/**
 * Catálogo de vehículos + categorías Going.
 *
 * SUV/SUV XL: viajes compartidos y privados, envíos (decisión #9)
 * VAN/VAN XL/BUS: solo privado (no entran en envíos ni en el lobby
 * compartido).
 */
import { TripMode, VehicleId, Category } from './types';

export interface VehicleOption {
  id:          VehicleId;
  label:       string;
  desc:        string;
  icon:        string;     // ionicons name
  capacity:    number;
  availableIn: TripMode[];
}

export const VEHICLES: VehicleOption[] = [
  {
    id:          'suv',
    label:       'SUV',
    desc:        '3 pasajeros',
    icon:        'car-sport-outline',
    capacity:    3,
    availableIn: ['compartido', 'privado'],
  },
  {
    id:          'suv_xl',
    label:       'SUV XL',
    desc:        '5 pasajeros',
    icon:        'car-sport-outline',
    capacity:    5,
    availableIn: ['privado'],
  },
  {
    id:          'van',
    label:       'VAN',
    desc:        '8 pasajeros',
    icon:        'bus-outline',
    capacity:    8,
    availableIn: ['compartido', 'privado'],
  },
  {
    id:          'van_xl',
    label:       'VAN XL',
    desc:        '12 pasajeros',
    icon:        'bus-outline',
    capacity:    12,
    availableIn: ['privado'],
  },
  {
    id:          'bus',
    label:       'BUS',
    desc:        '20+ pasajeros',
    icon:        'bus-outline',
    capacity:    20,
    availableIn: ['privado'],
  },
];

export interface CategoryOption {
  id:         Category;
  label:      string;
  desc:       string;
  multiplier: number;        // sobre precio base privado
  onlyIn?:    TripMode;      // si está definido, solo aparece en ese modo
}

/**
 * Categorías de servicio. Decisión brand rev 2026-05-23: Confort + Premium
 * para cliente final. Empresa es facturación corporativa B2B (NO tier
 * cliente, sino billing dimension) — visible solo si el usuario tiene
 * companyId asociado en su perfil.
 */
export const CATEGORIES: CategoryOption[] = [
  { id: 'confort',  label: 'Confort',  desc: 'Equipado y cómodo',                multiplier: 1.0 },
  { id: 'premium',  label: 'Premium',  desc: 'Gama alta · servicio exclusivo',   multiplier: 1.5 },
  { id: 'empresa',  label: 'Empresa',  desc: 'Descuento corporativo · privado',  multiplier: 0.7, onlyIn: 'privado' },
];

/** Especs internas — mapping a la clase de tarifa que usa PERSON_RATES. */
export const VEHICLE_SPECS: Record<VehicleId, { rateClass: 'suv' | 'van' | 'bus'; capacity: number }> = {
  suv:    { rateClass: 'suv', capacity: 3  },
  suv_xl: { rateClass: 'suv', capacity: 5  },
  van:    { rateClass: 'van', capacity: 8  },
  van_xl: { rateClass: 'van', capacity: 12 },
  bus:    { rateClass: 'bus', capacity: 20 },
};
