import { useAuth } from '../../contexts';

import { useState } from 'react';
import { useAuth } from '../../contexts';

type Tab = 'services' | 'earnings' | 'requests' | 'notifications';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('services');

  // Placeholder - logic to show driver vs host
  const isDriver = true;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100/50">
        <div className="flex justify-between items-center max-w-4xl mx-auto p-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Panel Proveedor</h1>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">{isDriver ? 'Conductor' : 'Anfitrión'}</span>
            </div>
            <p className="text-sm font-medium text-gray-400 mt-0.5">{user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-green-500/10 text-green-700 rounded-full text-xs font-bold flex items-center gap-1.5 border border-green-500/20">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
               EN LÍNEA
             </div>
          </div>
        </div>

        {/* Navigation Tabs - Floating effect */}
        <div className="px-6 pb-4 max-w-4xl mx-auto overflow-x-auto hide-scrollbar">
          <div className="inline-flex p-1 bg-gray-100/80 rounded-xl gap-1">
            <TabButton active={activeTab === 'services'} onClick={() => setActiveTab('services')} label="Mis Servicios" icon="📋" />
            <TabButton active={activeTab === 'earnings'} onClick={() => setActiveTab('earnings')} label="Ganancias" icon="💰" />
            <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} label="Solicitudes" icon="zap" emoji="⚡" badge={3} />
            <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} label="Avisos" icon="bell" emoji="🔔" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
        
        {activeTab === 'services' && (
          <div className="space-y-6">
             {/* Quick Stats Row */}
             <div className="grid grid-cols-2 gap-4">
               <StatCard label="Total Viajes" value="124" trend="+12%" />
               <StatCard label="Calificación" value="4.9" sub="Excelencia" />
             </div>

             {/* Active Service Card - Hero style */}
             <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white p-8 shadow-xl">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <span className="text-9xl">🛡️</span>
               </div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-brand-yellow"></span>
                    <span className="text-xs font-bold tracking-widest text-brand-yellow uppercase">Estado Actual</span>
                 </div>
                 <h3 className="text-2xl font-black mb-1">Esperando asignación</h3>
                 <p className="text-gray-400 text-sm mb-6">Mantente en zonas de alta demanda para recibir más viajes.</p>
                 
                 <button className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg transform active:scale-95">
                   Ir al Mapa en Vivo
                 </button>
               </div>
             </div>

             {/* Recent Activity List */}
             <div>
               <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Historial Hoy</h3>
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="p-4 flex justify-between items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-pointer group">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg group-hover:bg-brand-red/10 group-hover:text-brand-red transition-colors">
                         🏁
                       </div>
                       <div>
                         <div className="font-bold text-gray-900 text-sm">Viaje Privado #{1000 + i}</div>
                         <div className="text-xs text-gray-500">Hace {i}h • Av. Amazonas</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-bold text-green-600">+$12.50</div>
                       <div className="text-[10px] text-gray-400">Efectivo</div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
               <div className="relative z-10">
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Disponible para retiro</div>
                 <div className="text-5xl font-black mb-6 tracking-tight">$450.00</div>
                 <button className="px-8 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(255,76,65,0.4)] transition transform hover:-translate-y-0.5">
                   Solicitar Retiro
                 </button>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <StatCard label="Esta Semana" value="$120.50" trend="+5%" />
               <StatCard label="Mes Anterior" value="$1,240.00" />
             </div>

             <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <span>📊</span> Desglose Estimado
               </h3>
               <div className="space-y-4">
                 <div className="flex justify-between text-sm items-center">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-400"></div>
                     <span className="text-gray-600 font-medium">Comisión Plataforma (15%)</span>
                   </div>
                   <span className="font-bold text-red-500">-$18.00</span>
                 </div>
                 <div className="flex justify-between text-sm items-center">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                     <span className="text-gray-600 font-medium">Impuestos</span>
                   </div>
                   <span className="font-bold text-red-500">-$2.40</span>
                 </div>
                 <div className="pt-4 border-t border-gray-100 flex justify-between">
                   <span className="font-black text-gray-900">Neto</span>
                   <span className="font-black text-green-600 text-lg">$100.10</span>
                 </div>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'requests' && (
           <div className="space-y-4">
             <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl text-sm shadow-md flex items-center gap-3">
               <span className="text-xl">🚀</span>
               <div className="font-medium leading-tight">
                 Tip Pro: Acepta solicitudes en menos de 10s para ganar bono de velocidad.
               </div>
             </div>

             {[1, 2, 3].map((i) => (
               <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-4">
                   <div className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider rounded font-bold">Viaje Privado</div>
                   <div className="font-black text-lg text-gray-900">$8.50</div>
                 </div>
                 
                 <div className="space-y-4 mb-6 relative pl-4 border-l-2 border-gray-100 ml-1">
                   <div className="relative">
                     <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white bg-green-500 shadow-sm"></span>
                     <div className="text-xs text-gray-400 font-bold uppercase mb-0.5">Recogida</div>
                     <span className="text-sm font-bold text-gray-900">CC El Bosque</span>
                   </div>
                   <div className="relative">
                     <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white bg-red-500 shadow-sm"></span>
                     <div className="text-xs text-gray-400 font-bold uppercase mb-0.5">Destino</div>
                     <span className="text-sm font-bold text-gray-900">Parque La Carolina</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <button className="py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition">RECHAZAR</button>
                   <button className="py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg hover:shadow-xl transition transform active:scale-95">ACEPTAR</button>
                 </div>
               </div>
             ))}
           </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
             <NotificationItem title="¡Bienvenido a GOING!" time="Hace 2 días" isNew emoji="🎉" />
             <NotificationItem title="Documentos verificados" time="Hace 5 días" emoji="✅" />
             <NotificationItem title="Nueva política de comisiones" time="Hace 1 semana" emoji="📢" />
          </div>
        )}

      </div>
    </div>
  );
}

/* --- Subcomponents --- */

function TabButton({ active, onClick, label, icon, emoji, badge }: { active: boolean; onClick: () => void; label: string; icon: string; emoji?: string; badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all
        ${active 
          ? 'bg-white text-gray-900 shadow-sm font-bold' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-white/50 font-medium'}
      `}
    >
      <span>{emoji || icon}</span>
      <span className="text-sm">{label}</span>
      {badge && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${active ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-600'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, trend, sub }: { label: string; value: string; trend?: string; sub?: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-black text-gray-900 tracking-tight">{value}</div>
        {trend && <div className="text-xs font-bold text-green-600 mb-1 bg-green-50 px-1.5 py-0.5 rounded">{trend}</div>}
        {sub && <div className="text-xs font-bold text-gray-400 mb-1">{sub}</div>}
      </div>
    </div>
  );
}

function NotificationItem({ title, time, isNew, emoji }: { title: string; time: string; isNew?: boolean; emoji?: string }) {
  return (
    <div className={`p-4 hover:bg-gray-50 transition cursor-pointer ${isNew ? 'bg-blue-50/30' : ''}`}>
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg shadow-inner">
          {emoji || 'ℹ️'}
        </div>
        <div className="flex-1">
           <div className="flex justify-between items-start">
            <h4 className={`text-sm ${isNew ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{title}</h4>
            {isNew && <span className="w-2 h-2 rounded-full bg-brand-red"></span>}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">{time}</p>
        </div>
      </div>
    </div>
  );
}
