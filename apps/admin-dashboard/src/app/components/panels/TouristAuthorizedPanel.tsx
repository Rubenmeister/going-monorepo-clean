'use client';

import { ShieldCheck, FileCheck, ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { Badge, Button } from '@going/shared-ui';

export function TouristAuthorizedPanel() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-neutral-900 border-l-4 border-success p-6 rounded-r-xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-4 opacity-10">
           <ShieldCheck size={120} className="text-success"/>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-heading font-black text-white uppercase tracking-tighter">Transporte Turístico Autorizado</h3>
            <Badge variant="default" className="bg-success text-white border-none font-bold px-3 py-1 flex gap-1 items-center">
               <CheckCircle2 size={12}/> VERIFICACIÓN ANT ✓
            </Badge>
          </div>
          <p className="text-neutral-500 text-sm max-w-2xl mb-6">
            Monitoreo de flota pesada y vans con permisos de operación nacional. Control estricto de boletas de viaje y seguros de pasajeros.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { label: 'VANs Activas', value: '18', icon: <FileCheck size={16}/> },
               { label: 'Buses en Ruta', value: '4', icon: <ClipboardList size={16}/> },
               { label: 'Boletas Emitidas', value: '42', icon: <FileCheck size={16}/> },
               { label: 'Cumplimiento', value: '100%', icon: <CheckCircle2 size={16}/> },
             ].map(stat => (
               <div key={stat.label} className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800 text-center">
                  <div className="flex justify-center text-success mb-2">{stat.icon}</div>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">{stat.label}</p>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-neutral-900 border border-border p-6 rounded-xl">
            <h4 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2">
               <ClipboardList size={16} className="text-success"/> Listado de Vehículos & Status ANT
            </h4>
            <div className="space-y-3">
               {[
                 { id: 'V-001', model: 'Mercedes Sprinter', provider: 'TransTour S.A.', status: 'Authorized', doc: 'v2024-10-15' },
                 { id: 'V-002', model: 'Scania Bus G450', provider: 'Expreso Nacional', status: 'Authorized', doc: 'v2024-12-01' },
                 { id: 'V-003', model: 'Hyundai H1', provider: 'Individual - Luis P.', status: 'Pending', doc: 'Exp. 2024-09' },
               ].map(vehicle => (
                 <div key={vehicle.id} className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-success/50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-success font-bold">
                          {vehicle.id.split('-')[1]}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">{vehicle.model}</p>
                          <p className="text-[10px] text-neutral-500">{vehicle.provider}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[10px] text-neutral-500 uppercase font-bold">Doc. Habilitación</p>
                          <p className="text-xs text-white font-mono">{vehicle.doc}</p>
                       </div>
                       {vehicle.status === 'Authorized' ? (
                          <Badge className="bg-success text-white border-none">✓ OK</Badge>
                       ) : (
                          <Badge variant="secondary" className="bg-going-yellow text-black border-none animate-pulse"><Clock size={10} className="mr-1"/> PEND</Badge>
                       )}
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-neutral-900 border border-border p-6 rounded-xl flex flex-col">
            <h4 className="text-sm font-bold text-white uppercase mb-6">Acciones de Control</h4>
            <div className="space-y-3">
               <Button variant="outline" className="w-full justify-start gap-2 border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white h-12">
                  📄 Validar Boleta de Viaje
               </Button>
               <Button variant="outline" className="w-full justify-start gap-2 border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white h-12">
                  🛡️ Verificar Póliza SPPAT
               </Button>
               <Button variant="outline" className="w-full justify-start gap-2 border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white h-12">
                  🚚 Reportar Incidencia ANT
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
