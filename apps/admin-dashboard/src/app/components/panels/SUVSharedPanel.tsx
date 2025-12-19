'use client';

import { ShieldAlert, MapPin, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@going/shared-ui';

export function SUVSharedPanel() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-neutral-900 border-l-4 border-going-yellow p-6 rounded-r-xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-4 opacity-10">
           <ShieldAlert size={120} className="text-going-yellow"/>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Monitoreo SUV Compartido</h3>
            <Badge variant="secondary" className="bg-neutral-800 text-neutral-400 border-neutral-700 font-bold px-3 py-1">
               LEGALIDAD INDEFINIDA
            </Badge>
          </div>
          <p className="text-neutral-500 text-sm max-w-2xl mb-6">
            Seguimiento de rutas interurbanas y compartidas. Monitoreo preventivo de seguridad y cumplimiento de estándares internos de calidad Going.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800">
                <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Rutas Activas</p>
                <div className="space-y-3">
                   {['Quito ↔ Baños', 'Quito ↔ Mindo', 'Latacunga ↔ Quito'].map(route => (
                     <div key={route} className="flex justify-between items-center text-sm">
                        <span className="text-white font-medium">{route}</span>
                        <Badge variant="outline" className="text-primary border-primary/20">6 Unid.</Badge>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800">
                <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">KPIs Específicos SUV</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                       <span className="text-neutral-400">Ocupación Promedio</span>
                       <span className="text-success font-bold">78%</span>
                    </div>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                       <div className="h-full bg-success w-[78%]"/>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-neutral-400">Puntualidad Pick-up</span>
                     <span className="text-white font-bold">92%</span>
                  </div>
                </div>
             </div>

             <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex flex-col justify-center items-center text-center">
                <Users size={32} className="text-primary mb-2"/>
                <p className="text-2xl font-black text-white">425</p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Pasajeros Hoy</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-neutral-900 border border-border p-6 rounded-xl">
            <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
               <MapPin size={16} className="text-primary"/> Zonas de Alta Demanda
            </h4>
            <div className="space-y-2">
               {[
                 { name: 'Terminal Terrestre Carcelén', demand: 'Alta', trend: 'up' },
                 { name: 'Parque La Carolina', demand: 'Media', trend: 'stable' },
                 { name: 'Cumbayá (Centro)', demand: 'Alta', trend: 'up' },
               ].map(zone => (
                 <div key={zone.name} className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                    <span className="text-sm text-white">{zone.name}</span>
                    <Badge variant={zone.demand === 'Alta' ? 'destructive' : 'secondary'}>{zone.demand}</Badge>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-neutral-900 border border-border p-6 rounded-xl flex flex-col items-center justify-center border-dashed">
            <TrendingUp size={48} className="text-neutral-800 mb-4"/>
            <p className="text-sm text-neutral-500 font-medium italic">Optimización de flotas en curso...</p>
         </div>
      </div>
    </div>
  );
}
