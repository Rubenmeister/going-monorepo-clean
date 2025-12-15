export interface GeoLocation {
  lat: number;
  lng: number;
}

export type EntityStatus = 'active' | 'idle' | 'warning' | 'critical' | 'offline';

export interface DashboardEntity {
  id: string;
  type: 'driver' | 'tour_guide' | 'courier' | 'host' | 'creator';
  name: string;
  location: GeoLocation;
  status: EntityStatus;
  details: Record<string, any>;
  lastUpdate: string;
}

// Centro de Quito approx: -0.1807, -78.4678

export const MOCK_DRIVERS: DashboardEntity[] = [
  {
    id: 'D-001',
    type: 'driver',
    name: 'Roberto Pérez',
    location: { lat: -0.176, lng: -78.480 },
    status: 'active',
    details: { vehicle: 'Toyota Corolla', plate: 'PBA-1234', tripId: 'T-101' },
    lastUpdate: 'Just now'
  },
  {
    id: 'D-002',
    type: 'driver',
    name: 'Juan López',
    location: { lat: -0.165, lng: -78.475 },
    status: 'idle',
    details: { vehicle: 'Chevrolet Sail', plate: 'PCD-5678' },
    lastUpdate: '5m ago'
  },
  {
    id: 'D-003',
    type: 'driver',
    name: 'Maria Sanchez',
    location: { lat: -0.190, lng: -78.490 },
    status: 'warning',
    details: { vehicle: 'Kia Rio', plate: 'PXX-9999', alert: 'Low Battery' },
    lastUpdate: '1m ago'
  }
];

export const MOCK_TOURS: DashboardEntity[] = [
  {
    id: 'TR-055',
    type: 'tour_guide',
    name: 'Luis "El Profe" - Quito Histórico',
    location: { lat: -0.219, lng: -78.513 }, // Centro Histórico
    status: 'active',
    details: { groupSize: 12, tourName: 'Leyendas de Quito', progress: '65%' },
    lastUpdate: '2m ago'
  },
  {
    id: 'TR-088',
    type: 'tour_guide',
    name: 'Andrea - Cotopaxi Adventure',
    location: { lat: -0.600, lng: -78.500 }, // Rute to Cotopaxi
    status: 'active',
    details: { groupSize: 4, tourName: 'Volcano Hiking', progress: '20%' },
    lastUpdate: '10m ago'
  }
];

export const MOCK_HOSTS: DashboardEntity[] = [
  {
    id: 'H-300',
    type: 'host',
    name: 'Casa del Sol - Suite 1',
    location: { lat: -0.210, lng: -78.490 },
    status: 'active', // Occupied
    details: { guestName: 'Familia Smith', checkout: 'Tomorrow' },
    lastUpdate: '1h ago'
  },
  {
    id: 'H-302',
    type: 'host',
    name: 'Loft Moderno La Carolina',
    location: { lat: -0.185, lng: -78.485 },
    status: 'idle', // Vacant
    details: { nextCheckIn: 'In 2 days' },
    lastUpdate: '4h ago'
  }
];

export const MOCK_COURIERS: DashboardEntity[] = [
  {
    id: 'C-999',
    type: 'courier',
    name: 'MotoExpress 1',
    location: { lat: -0.178, lng: -78.479 },
    status: 'active',
    details: { packageId: 'PKG-1111', destination: 'Cumbayá' },
    lastUpdate: '30s ago'
  }
];

export const ALL_ENTITIES = [
  ...MOCK_DRIVERS,
  ...MOCK_TOURS,
  ...MOCK_HOSTS,
  ...MOCK_COURIERS
];

export const KPIS = {
  transport: { active: 124, idle: 45, accidents: 0 },
  tourism: { activeTours: 15, totalTourists: 142, occupiedProperties: 85 },
  logistics: { activeDeliveries: 56, pending: 12, delayed: 3 }
};
