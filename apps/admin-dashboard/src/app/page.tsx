'use client';

// Force dynamic rendering to avoid SSR issues with hooks during static generation
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Badge
} from '@going/shared-ui';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Settings, 
  CreditCard, 
  Bell, 
  Activity,
  LogOut,
  Home,
  Compass,
  Zap,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

import { TripDrawer, Trip } from './components/TripDrawer';
import { CommandSearch } from './components/CommandSearch';
import { KPITransportPanel } from './components/KPITransportPanel';
import { ProvidersManager } from './components/providers/ProvidersManager';
import { RevenueOverview } from './components/analytics/RevenueOverview';
import { UserAnalytics } from './components/analytics/UserAnalytics';
import { SUVSharedPanel } from './components/panels/SUVSharedPanel';
import { TouristAuthorizedPanel } from './components/panels/TouristAuthorizedPanel';

// Mock Data - Focus on SUV, VAN, Bus (No Sedans)
const MOCK_TRIPS: Trip[] = [
  { 
    id: 'T-001', 
    status: 'in_progress', 
    from: 'Quito (Centro)', 
    to: 'Baños', 
    driver: { id: 'D1', name: 'Roberto Pérez', vehicle: 'Toyota Fortuner (SUV)', plate: 'PBA-1234', rating: 4.8 },
    eta: '1h 45 min', 
    fare: 25.50,
    occupancy: 4,
    capacity: 6,
    createdAt: '2024-05-15T10:00:00',
    poolId: 'POOL-99',
    passengers: [
      { id: 'P1', name: 'Ana García', checkedIn: true, paymentStatus: 'paid' },
      { id: 'P2', name: 'Carlos Díaz', checkedIn: true, paymentStatus: 'pending' },
    ],
    timeline: [
      { event: 'Viaje Compartido Creado', timestamp: '10:00 AM' },
      { event: 'Conductor Asignado', timestamp: '10:05 AM' },
    ],
    payment: { total: 25.50, commission: 5.10, tip: 0, method: 'Tarjeta', status: 'pending' }
  },
  { 
    id: 'T-002', 
    status: 'requested', 
    from: 'Guayaquil (Puerto)', 
    to: 'Salinas', 
    eta: '1h 20 min', 
    fare: 80.00,
    occupancy: 0,
    capacity: 12,
    createdAt: '2024-05-15T10:15:00',
    passengers: [],
    timeline: [
       { event: 'Solicitud VAN Turística', timestamp: '10:15 AM' }
    ],
    payment: { total: 80.00, commission: 16.00, tip: 0, method: 'Transferencia', status: 'pending' }
  },
  { 
    id: 'T-003', 
    status: 'assigned', 
    from: 'Cuenca (Centro)', 
    to: 'Parque Cajas', 
    driver: { id: 'D2', name: 'Fernando Vega', vehicle: 'Mercedes Sprinter (VAN XL)', plate: 'PCC-5678', rating: 4.9 },
    eta: '45 min', 
    fare: 120.00,
    occupancy: 8,
    capacity: 15,
    createdAt: '2024-05-15T10:20:00',
    passengers: [
      { id: 'P4', name: 'Pedro S.', checkedIn: false, paymentStatus: 'paid' }
    ],
    timeline: [
       { event: 'Tour Grupal Asignado', timestamp: '10:22 AM' }
    ],
    payment: { total: 120.00, commission: 24.00, tip: 0, method: 'Tarjeta', status: 'success' }
  },
];

type DashboardView = 'control_center' | 'suv_shared' | 'tourist_authorized' | 'providers' | 'revenue' | 'users' | 'hosting' | 'tours' | 'experiences';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'queue' | 'alerts'>('active');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('control_center');

  useEffect(() => {
    // Simulating auth check
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-body">Iniciando Mission Control...</p>
        </div>
      </div>
    );
  }

  // Derived State for KPIs (simulated)
  const activeCount = MOCK_TRIPS.filter(t => t.status === 'in_progress').length;
  const queueCount = MOCK_TRIPS.filter(t => ['requested', 'assigned'].includes(t.status)).length;
  const alertCount = 2; // Hardcoded mock

  return (
    <div className="min-h-screen bg-neutral text-foreground flex font-body overflow-hidden">
      {/* Sidebar - Grouped by Sections */}
      <aside className="w-64 border-r border-black bg-[#111827] flex flex-col z-20 shadow-2xl">
        <div className="p-8 border-b-2 border-black bg-black">
          <div className="font-spaceGrotesk text-3xl font-black italic tracking-tighter text-white mb-2 underline decoration-brand-red decoration-4 text-center">GOING</div>
          <div className="text-[10px] font-black text-brand-red tracking-[0.3em] uppercase text-center">ECUADOR CONTROL 🇪🇨</div>
        </div>
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* SECTION: TRANSPORTE */}
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 px-3 text-neutral-500">Transporte</p>
            <div className="space-y-1">
              <SidebarItem icon={<LayoutDashboard size={18} />} label="Centro de Control" active={currentView === 'control_center'} onClick={() => setCurrentView('control_center')} />
              <SidebarItem icon={<Zap size={18} />} label="SUV Compartido" active={currentView === 'suv_shared'} onClick={() => setCurrentView('suv_shared')} />
              <SidebarItem icon={<ShieldCheck size={18} />} label="Turístico ANT" active={currentView === 'tourist_authorized'} onClick={() => setCurrentView('tourist_authorized')} />
              <SidebarItem icon={<Truck size={18} />} label="Conductores/Flota" active={currentView === 'providers'} onClick={() => setCurrentView('providers')} />
            </div>
          </div>

          {/* SECTION: VERTICALES */}
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 px-3 text-neutral-500">Verticales</p>
            <div className="space-y-1">
              <SidebarItem icon={<Home size={18} />} label="Alojamiento" active={currentView === 'hosting'} onClick={() => setCurrentView('hosting')} />
              <SidebarItem icon={<Compass size={18} />} label="Tours" active={currentView === 'tours'} onClick={() => setCurrentView('tours')} />
              <SidebarItem icon={<Activity size={18} />} label="Experiencias" active={currentView === 'experiences'} onClick={() => setCurrentView('experiences')} />
            </div>
          </div>

          {/* SECTION: ANALYTICS */}
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 px-3 text-neutral-500">Analytics & Ops</p>
            <div className="space-y-1">
              <SidebarItem icon={<CreditCard size={18} />} label="Finanzas (Revenue)" active={currentView === 'revenue'} onClick={() => setCurrentView('revenue')} />
              <SidebarItem icon={<BarChart3 size={18} />} label="Usuarios" active={currentView === 'users'} onClick={() => setCurrentView('users')} />
              <SidebarItem icon={<Bell size={18} />} label="Alertas" badge={3} />
            </div>
          </div>

          <SidebarItem icon={<Settings size={18} />} label="Configuración" />
        </nav>
      </aside>
      <main className="flex-1 flex flex-col bg-background/5 relative h-screen">
        
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-neutral flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-6 flex-1">
             <h2 className="text-lg font-heading font-bold text-white hidden md:block">Centro de Control de Operaciones</h2>
             <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>
             {/* Command Search */}
             <CommandSearch />
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary whitespace-nowrap">System Active</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-900/50">
          {/* Dashboard Header with KPIs */}
          <KPITransportPanel />

          {/* Render Active View */}
          {(() => {
            switch (currentView) {
              case 'control_center':
                return (
                  <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
                    {/* Map Area (65%) */}
                    <div className="flex-[2] bg-neutral-800 relative group overflow-hidden border border-border rounded-xl shadow-2xl">
                      <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Quito%2C_Ecuador.png')] bg-cover bg-center grayscale" />
                      
                      {/* Floating Map Controls */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                         <Button variant="secondary" size="sm" className="shadow-xl opacity-90 hover:opacity-100 backdrop-blur">🗺️ Clustering: On</Button>
                         <Button variant="secondary" size="sm" className="shadow-xl opacity-90 hover:opacity-100 backdrop-blur">Target: Ecuador National</Button>
                      </div>

                      <div className="absolute bottom-6 left-6 z-10 p-5 bg-neutral-900/90 backdrop-blur rounded-xl border border-neutral-700 shadow-2xl max-w-sm">
                         <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Resumen Operativo de Zona</h4>
                         <div className="flex gap-8">
                            <div>
                              <p className="text-3xl font-bold text-white tracking-tighter">85%</p>
                              <p className="text-[10px] text-neutral-500 uppercase font-bold">Utilización</p>
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-primary tracking-tighter">12</p>
                              <p className="text-[10px] text-neutral-500 uppercase font-bold">Alertas Activas</p>
                            </div>
                         </div>
                      </div>

                      <div className="z-0 h-full w-full flex items-center justify-center pointer-events-none">
                        <p className="text-white/10 font-heading text-4xl font-black italic uppercase tracking-[0.5em] select-none rotate-[-5deg]">Operational Map</p>
                      </div>
                    </div>

                    {/* Right Panel (35%) - "The Queue" */}
                    <div className="flex-1 bg-neutral-900 flex flex-col min-w-[350px] max-w-[450px] border border-border rounded-xl shadow-2xl overflow-hidden">
                      {/* Tabs */}
                      <div className="flex border-b border-border bg-neutral-950/20">
                        <TabButton label="En Ruta" count={activeCount} active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
                        <TabButton label="Cola" count={queueCount} active={activeTab === 'queue'} alertMode onClick={() => setActiveTab('queue')} />
                        <TabButton label="Alertas" count={alertCount} active={activeTab === 'alerts'} variant="destructive" onClick={() => setActiveTab('alerts')} />
                      </div>

                      {/* List Content */}
                      <div className="p-0 overflow-y-auto flex-1 bg-neutral-900/50">
                         {activeTab === 'active' && (
                           <div className="divide-y divide-neutral-800">
                             {MOCK_TRIPS.filter(t => t.status === 'in_progress').map(trip => (
                               <TripCard key={trip.id} trip={trip} onClick={() => setSelectedTrip(trip)} />
                             ))}
                           </div>
                         )}

                         {activeTab === 'queue' && (
                           <div className="divide-y divide-neutral-800">
                             {MOCK_TRIPS.filter(t => ['requested', 'assigned'].includes(t.status)).map(trip => (
                               <TripCard key={trip.id} trip={trip} onClick={() => setSelectedTrip(trip)} />
                             ))}
                           </div>
                         )}
                         
                         {activeTab === 'alerts' && (
                           <div className="p-12 text-center text-neutral-500 text-sm mt-10">
                             <Bell size={64} className="mx-auto mb-6 opacity-5 text-primary animate-pulse"/>
                             <p className="font-bold text-white mb-2">Sin Alertas Críticas</p>
                             <p className="text-xs text-neutral-600 leading-relaxed">El sistema de transporte opera bajo parámetros normales de seguridad y eficiencia.</p>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                );
              case 'suv_shared': return <SUVSharedPanel />;
              case 'tourist_authorized': return <TouristAuthorizedPanel />;
              case 'providers': return <ProvidersManager />;
              case 'revenue': return <RevenueOverview />;
              case 'users': return <UserAnalytics />;
              default: return (
                <div className="flex flex-col items-center justify-center h-[600px] border-2 border-dashed border-neutral-800 rounded-3xl opacity-30">
                   <LayoutDashboard size={80}/>
                   <p className="mt-4 font-heading font-bold text-xl uppercase tracking-[0.2em]">{currentView.replace('_', ' ')} Module</p>
                </div>
              );
            }
          })()}
        </div>
      </main>

      <TripDrawer 
        trip={selectedTrip} 
        isOpen={!!selectedTrip} 
        onClose={() => setSelectedTrip(null)} 
        onReassign={() => console.log('Reassign')}
      />
    </div>
  );
}

// Subcomponents
function TripCard({ trip, onClick }: { trip: Trip, onClick: () => void }) {
  const isQueue = ['requested', 'assigned'].includes(trip.status);
  
  return (
    <div onClick={onClick} className="p-4 hover:bg-neutral-800 cursor-pointer transition-all group border-l-2 border-transparent hover:border-primary">
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-2">
            <Badge variant={isQueue ? 'secondary' : 'default'} className="font-mono text-[10px] h-5 px-1.5 rounded-sm">
              {trip.id}
            </Badge>
            {trip.poolId && <Badge variant="outline" className="text-[10px] h-5 text-blue-400 border-blue-900 bg-blue-500/5">Pool</Badge>}
         </div>
         <span className={`text-[10px] font-bold uppercase tracking-tighter ${isQueue ? 'text-going-yellow' : 'text-success'}`}>
            {trip.status === 'in_progress' ? 'En ruta' : trip.status === 'assigned' ? 'Asignado' : 'Pendiente'}
         </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
         <div className="flex flex-col gap-0.5">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Ruta Actual</p>
            <p className="text-sm text-white font-medium truncate">{trip.from} <span className="text-primary italic mx-1">→</span> {trip.to}</p>
         </div>
      </div>
      <div className="flex justify-between items-center text-[11px] text-neutral-500 bg-neutral-950/50 p-2 rounded">
         <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><Users size={12} className="text-neutral-600"/> {trip.occupancy}/{trip.capacity}</span>
            <span className="flex items-center gap-1.5"><Truck size={12} className="text-neutral-600"/> <span className="truncate max-w-[80px]">{trip.driver?.name || '---'}</span></span>
         </div>
         <span className="font-mono text-neutral-400 bg-neutral-900 px-1 rounded">{trip.eta}</span>
      </div>
    </div>
  )
}

function SidebarItem({ icon, label, badge, active, onClick }: { icon: any, label: string, badge?: number, active?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer group ${active ? 'bg-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${active ? 'text-primary' : 'text-neutral-500 group-hover:text-primary transition-colors'}`}>
        {icon}
      </span>
      <span className="text-sm font-medium tracking-tight">{label}</span>
      {badge && <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">{badge}</Badge>}
    </div>
  );
}

function TabButton({ label, count, active, alertMode, variant, onClick }: any) {
  const activeClass = variant === 'destructive' 
     ? 'border-red-500 text-red-500 bg-red-500/5'
     : alertMode 
       ? 'border-going-yellow text-going-yellow bg-going-yellow/5'
       : 'border-primary text-primary bg-primary/5';

  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${active ? activeClass : 'border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
    >
      {label}
      {count !== undefined && <span className="ml-2 opacity-50 font-mono">[{count}]</span>}
    </button>
  );
}

