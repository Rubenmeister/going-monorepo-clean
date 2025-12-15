import { useAuth } from '../../contexts';

import { useState } from 'react';
import { useAuth } from '../../contexts';

type Tab = 'services' | 'earnings' | 'requests' | 'notifications';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('services');

  // Placeholder data - In real app, this comes from API based on user role (driver vs host)
  const isDriver = true; // Simulating a driver view for now

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile styled */}
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel Proveedor 💼</h1>
            <p className="text-sm text-gray-500">
              {isDriver ? 'Conductor' : 'Anfitrión'} • {user?.name}
            </p>
          </div>
          <div className="flex gap-2">
             <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">
               ● En línea
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 hide-scrollbar">
          <TabButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} label="Mis Servicios" icon="📋" />
          <TabButton active={activeTab === 'earnings'} onClick={() => setActiveTab('earnings')} label="Ganancias" icon="💰" />
          <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} label="Solicitudes" icon="🔔" badge={3} />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} label="Avisos" icon="📢" />
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          
          {activeTab === 'services' && (
            <div className="space-y-4">
               {/* Quick Stats */}
               <div className="grid grid-cols-2 gap-4">
                 <StatCard label="Total Viajes" value="124" />
                 <StatCard label="Calificación" value="4.9 ⭐" />
               </div>

               {/* Active Service */}
               <div className="bg-white rounded-xl shadow-sm border border-brand-red/20 p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/10 rounded-full -mr-10 -mt-10" />
                 <h3 className="font-bold text-gray-900 z-10 relative">Servicio Actual</h3>
                 <div className="mt-4 z-10 relative">
                   <div className="text-sm text-gray-500">Estado</div>
                   <div className="font-semibold text-brand-red">Esperando asignación...</div>
                 </div>
                 <button className="mt-4 w-full py-2 bg-brand-red text-white rounded-lg font-semibold hover:bg-red-600 transition">
                   Ir al Mapa
                 </button>
               </div>

               {/* Recents list */}
               <div>
                 <h3 className="font-bold text-gray-800 mb-3">Historial Reciente</h3>
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divider-gray-100">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="p-4 flex justify-between items-center">
                       <div>
                         <div className="font-semibold text-gray-800">Viaje Privado #{1000 + i}</div>
                         <div className="text-xs text-gray-500">Hace {i} horas • Completado</div>
                       </div>
                       <div className="font-bold text-green-600">+$12.50</div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
               <div className="bg-gray-900 text-white rounded-2xl p-6 text-center">
                 <div className="text-gray-400 text-sm mb-1">Ganancias Disponibles</div>
                 <div className="text-4xl font-bold mb-4">$450.00</div>
                 <button className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition">
                   Retirar Fondos
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <StatCard label="Esta Semana" value="$120.50" />
                 <StatCard label="Mes Anterior" value="$1,240.00" />
               </div>

               <div className="bg-white rounded-xl border border-gray-100 p-4">
                 <h3 className="font-bold text-gray-800 mb-4">Desglose de Gastos (Estimado)</h3>
                 {/* Placeholder for Expenses Chart/List */}
                 <div className="space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">Comisión Plataforma (15%)</span>
                     <span className="font-medium text-red-500">-$18.00</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600">Impuestos</span>
                     <span className="font-medium text-red-500">-$2.40</span>
                   </div>
                   <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                     <span>Neto</span>
                     <span className="text-green-600">$100.10</span>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'requests' && (
             <div className="space-y-4">
               <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                 💡 Tip: Acepta solicitudes rápido para mantener tu tasa de aceptación alta.
               </div>

               {[1, 2, 3].map((i) => (
                 <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start mb-3">
                     <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-bold">Viaje Privado</div>
                     <div className="font-bold text-gray-900">$8.50</div>
                   </div>
                   
                   <div className="space-y-3 mb-4">
                     <div className="flex items-center gap-2">
                       <span className="text-green-500 text-xs">🟢</span>
                       <span className="text-sm font-medium">CC El Bosque</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-red-500 text-xs">🔴</span>
                       <span className="text-sm font-medium">Parque La Carolina</span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <button className="py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Ignorar</button>
                     <button className="py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black">Aceptar</button>
                   </div>
                 </div>
               ))}
             </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
               <NotificationItem title="¡Bienvenido a GOING!" time="Hace 2 días" isNew />
               <NotificationItem title="Documentos verificados" time="Hace 5 días" />
               <NotificationItem title="Nueva política de comisiones" time="Hace 1 semana" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* --- Subcomponents --- */

function TabButton({ active, onClick, label, icon, badge }: { active: boolean; onClick: () => void; label: string; icon: string; badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border
        ${active 
          ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
      `}
    >
      <span>{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
      {badge && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function NotificationItem({ title, time, isNew }: { title: string; time: string; isNew?: boolean }) {
  return (
    <div className={`p-4 ${isNew ? 'bg-blue-50/50' : ''}`}>
      <div className="flex justify-between items-start">
        <h4 className={`text-sm ${isNew ? 'font-bold text-blue-900' : 'font-medium text-gray-800'}`}>{title}</h4>
        {isNew && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
      </div>
      <p className="text-xs text-gray-500 mt-1">{time}</p>
    </div>
  );
}
