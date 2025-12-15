'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilterBar } from './components/FilterBar';
import { LiveMap } from './components/LiveMap';
import { TripDrawer, Trip } from './components/TripDrawer';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Alert } from './components/ui/Alert';

// Icons (inline SVG for simplicity)
const Icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  trips: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  drivers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  finance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  shipments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  alerts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

// Sidebar navigation items
const navItems = [
  { icon: Icons.dashboard, label: 'Live Ops', href: '/', active: true },
  { icon: Icons.trips, label: 'Transporte', href: '/transport' },
  { icon: Icons.shipments, label: 'Logística', href: '/logistics' },
  { icon: Icons.users, label: 'Anfitriones', href: '/hosts' },
  { icon: Icons.drivers, label: 'Tours', href: '/tours' },
  { icon: Icons.settings, label: 'Creadores', href: '/creators' },
  { icon: Icons.finance, label: 'Finanzas', href: '/finance' },
  { icon: Icons.alerts, label: 'Alertas', href: '/alerts', badge: 3 },
  { icon: Icons.settings, label: 'Config', href: '/settings' },
];

// Mock trips data
const MOCK_TRIPS: Trip[] = [
  {
    id: 'T-001',
    status: 'in_progress',
    from: 'Aeropuerto Mariscal Sucre',
    to: 'Centro Histórico',
    passengers: [
      { id: 'P1', name: 'Carlos Mendoza', phone: '+593 99 123 4567', checkedIn: true, paymentStatus: 'paid' },
      { id: 'P2', name: 'Ana García', checkedIn: true, paymentStatus: 'pending' },
    ],
    driver: { id: 'D1', name: 'Roberto Pérez', vehicle: 'Toyota Corolla', plate: 'ABC-1234', rating: 4.8 },
    capacity: 4,
    occupancy: 2,
    eta: '15 min',
    fare: 25.50,
    createdAt: '2024-01-15T10:30:00',
    poolId: 'POOL-A1',
    timeline: [
      { event: 'Viaje creado', timestamp: '10:30 AM', details: 'Solicitud recibida' },
      { event: 'Conductor asignado', timestamp: '10:32 AM', details: 'Roberto Pérez aceptó' },
      { event: 'Pasajero 1 recogido', timestamp: '10:45 AM' },
      { event: 'Pasajero 2 recogido', timestamp: '10:52 AM' },
    ],
    payment: { total: 25.50, commission: 5.10, tip: 2.00, method: 'Tarjeta Visa', status: 'pending' },
  },
  {
    id: 'T-002',
    status: 'in_progress',
    from: 'La Carolina',
    to: 'Cumbayá',
    passengers: [
      { id: 'P3', name: 'María Luisa Torres', checkedIn: true, paymentStatus: 'paid' },
    ],
    driver: { id: 'D2', name: 'Juan Carlos López', vehicle: 'Hyundai Accent', plate: 'XYZ-5678', rating: 4.5 },
    capacity: 4,
    occupancy: 1,
    eta: '22 min',
    fare: 18.00,
    createdAt: '2024-01-15T10:35:00',
    timeline: [
      { event: 'Viaje creado', timestamp: '10:35 AM' },
      { event: 'Conductor asignado', timestamp: '10:37 AM' },
      { event: 'Pasajero recogido', timestamp: '10:50 AM' },
    ],
    payment: { total: 18.00, commission: 3.60, tip: 0, method: 'Efectivo', status: 'pending' },
  },
  {
    id: 'T-003',
    status: 'assigned',
    from: 'Quicentro Norte',
    to: 'El Batán',
    passengers: [
      { id: 'P4', name: 'Pedro Ramírez', checkedIn: false, paymentStatus: 'pending' },
      { id: 'P5', name: 'Laura Sánchez', checkedIn: false, paymentStatus: 'paid' },
      { id: 'P6', name: 'Diego Morales', checkedIn: false, paymentStatus: 'failed' },
    ],
    driver: { id: 'D3', name: 'Fernando Vega', vehicle: 'Kia Sportage', plate: 'DEF-9012', rating: 4.9 },
    capacity: 5,
    occupancy: 3,
    eta: '8 min',
    fare: 32.00,
    createdAt: '2024-01-15T10:40:00',
    poolId: 'POOL-B2',
    timeline: [
      { event: 'Viaje creado', timestamp: '10:40 AM' },
      { event: 'Conductor asignado', timestamp: '10:42 AM' },
    ],
    payment: { total: 32.00, commission: 6.40, tip: 0, method: 'Tarjeta Mastercard', status: 'pending' },
  },
];

// Mock alerts
const MOCK_ALERTS = [
  { id: 'A1', type: 'critical' as const, title: 'Conductor sin señal', description: 'V-004 sin GPS hace 5 minutos', tripId: 'T-001' },
  { id: 'A2', type: 'operational' as const, title: 'Demora en pickup', description: 'T-003 esperando más de 10 min', tripId: 'T-003' },
  { id: 'A3', type: 'operational' as const, title: 'Pago fallido', description: 'Diego Morales - T-003', tripId: 'T-003' },
];

type TabType = 'active' | 'queue' | 'alerts';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trips] = useState(MOCK_TRIPS);
  const [alerts] = useState(MOCK_ALERTS);

  // KPIs
  const activeTrips = trips.filter(t => t.status === 'in_progress').length;
  const pendingTrips = trips.filter(t => t.status === 'assigned' || t.status === 'requested').length;
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
  const totalSeats = trips.reduce((acc, t) => acc + t.capacity, 0);
  const occupiedSeats = trips.reduce((acc, t) => acc + t.occupancy, 0);
  const fillRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  const openTripDrawer = (trip: Trip) => {
    setSelectedTrip(trip);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-going-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-going-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-going-black">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1 className="text-2xl font-heading font-bold text-white">
            <span className="text-going-red">Going</span> Ops
          </h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) => (
            <a key={i} href={item.href} className={item.active ? 'active' : ''}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="critical" size="sm" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white">Live Ops</h2>
            <p className="text-white/50 text-sm">Operaciones en tiempo real</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="realtime-indicator">
              <span className="pulse"></span>
              <span>Tiempo real activo</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        {/* KPI Row - Command Center */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Transport Stats */}
          <div className="bg-surface rounded-lg p-4 border-l-4 border-going-red relative overflow-hidden group">
            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
              {Icons.drivers}
            </div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Transporte Activo</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">124</span>
              <span className="text-xs text-success">▲ 12%</span>
            </div>
          </div>

          {/* Tourism Stats */}
          <div className="bg-surface rounded-lg p-4 border-l-4 border-going-yellow relative overflow-hidden group">
             <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
              {Icons.users}
            </div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Turismo (Tours/Hosts)</p>
             <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">142</span>
              <span className="text-xs text-white/40">Pax</span>
            </div>
          </div>

          {/* Logistics Stats */}
          <div className="bg-surface rounded-lg p-4 border-l-4 border-blue-500 relative overflow-hidden group">
             <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
              {Icons.shipments}
            </div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Logística (Envíos)</p>
             <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">56</span>
              <span className="text-xs text-warning">● 3 delayed</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-surface rounded-lg p-4 border-l-4 border-success relative overflow-hidden group">
             <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition transform group-hover:scale-110">
              {Icons.finance}
            </div>
            <p className="text-[10px] uppercase tracking-wide text-white/40">Revenue (Hoy)</p>
             <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">$4.2k</span>
              <span className="text-xs text-success">▲ 8%</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar />

        {/* Main Split Layout: Map + Panel */}
        <div className="grid grid-cols-[65%_35%] gap-6 mt-6">
          {/* Map Section */}
          <LiveMap
            focusedTripId={selectedTrip?.id}
            onTripClick={(tripId) => {
              const trip = trips.find(t => t.id === tripId);
              if (trip) openTripDrawer(trip);
            }}
          />

          {/* Right Panel */}
          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {[
                { key: 'active' as const, label: 'Activos', count: activeTrips },
                { key: 'queue' as const, label: 'Cola', count: pendingTrips },
                { key: 'alerts' as const, label: 'Alertas', count: alerts.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition border-b-2 ${
                    activeTab === tab.key
                      ? 'border-going-red text-going-red bg-going-red/5'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                  <Badge variant={activeTab === tab.key ? 'active' : 'neutral'} size="sm" className="ml-2">
                    {tab.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 h-[calc(100vh-400px)] overflow-y-auto">
              {activeTab === 'active' && (
                <div className="space-y-3">
                  {trips.filter(t => t.status === 'in_progress').map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => openTripDrawer(trip)}
                      className="w-full text-left bg-charcoal rounded-lg p-4 border border-border hover:border-going-red/50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-going-red text-sm">{trip.id}</span>
                        <Badge variant="active">{trip.status === 'in_progress' ? 'En curso' : trip.status}</Badge>
                      </div>
                      <p className="text-white font-medium text-sm">{trip.from} → {trip.to}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                        <span>🪑 {trip.occupancy}/{trip.capacity}</span>
                        <span>⏱️ {trip.eta}</span>
                        <span>💵 ${trip.fare}</span>
                      </div>
                      {trip.poolId && (
                        <Badge variant="info" size="sm" className="mt-2">Pool {trip.poolId}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'queue' && (
                <div className="space-y-3">
                  {trips.filter(t => t.status === 'assigned' || t.status === 'requested').map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => openTripDrawer(trip)}
                      className="w-full text-left bg-charcoal rounded-lg p-4 border border-border hover:border-going-yellow/50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-going-yellow text-sm">{trip.id}</span>
                        <Badge variant="warning">{trip.status === 'assigned' ? 'Asignado' : 'Solicitado'}</Badge>
                      </div>
                      <p className="text-white font-medium text-sm">{trip.from} → {trip.to}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                        <span>👥 {trip.passengers.length} pasajeros</span>
                        <span>⏱️ ETA {trip.eta}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      type={alert.type}
                      title={alert.title}
                      description={alert.description}
                      actions={[
                        { label: 'Ver caso', onClick: () => {
                          const trip = trips.find(t => t.id === alert.tripId);
                          if (trip) openTripDrawer(trip);
                        }},
                        { label: 'Resolver', onClick: () => {}, variant: 'secondary' },
                      ]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Trip Drawer */}
      <TripDrawer
        trip={selectedTrip}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReassign={(tripId) => console.log('Reassign:', tripId)}
        onCancel={(tripId, reason) => console.log('Cancel:', tripId, reason)}
        onContact={(tripId, type) => console.log('Contact:', tripId, type)}
      />
    </div>
  );
}