'use client';

import React from 'react';
import { Badge, Button } from '@going/shared-ui';
import { 
  X,
  Map as MapIcon, 
  CreditCard,
  Clock,
  RotateCcw,
  Phone,
  AlertTriangle,
  Users
} from 'lucide-react';

export interface Trip {
  id: string;
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  from: string;
  to: string;
  passengers: {
    id: string;
    name: string;
    phone?: string;
    checkedIn: boolean;
    paymentStatus: 'paid' | 'pending' | 'failed';
  }[];
  driver?: {
    id: string;
    name: string;
    photo?: string;
    vehicle: string;
    plate: string;
    rating: number;
  };
  capacity: number;
  occupancy: number;
  eta: string;
  fare: number;
  createdAt: string;
  poolId?: string;
  timeline: {
    event: string;
    timestamp: string;
    details?: string;
  }[];
  payment: {
    total: number;
    commission: number;
    tip: number;
    method: string;
    status: 'success' | 'pending' | 'failed';
  };
}

interface TripDrawerProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onReassign?: (tripId: string) => void;
  onCancel?: (tripId: string, reason: string) => void;
  onContact?: (tripId: string, type: 'driver' | 'passenger') => void;
}

const statusConfig = {
  requested: { label: 'Solicitado', variant: 'secondary' as const }, // Yellow
  assigned: { label: 'Asignado', variant: 'outline' as const },
  in_progress: { label: 'En curso', variant: 'default' as const }, // Red
  completed: { label: 'Completado', variant: 'outline' as const }, // Greenish via class optionally
  cancelled: { label: 'Cancelado', variant: 'destructive' as const },
};

export function TripDrawer({
  trip,
  isOpen,
  onClose,
  onReassign,
  onCancel,
  onContact,
}: TripDrawerProps) {
  if (!isOpen || !trip) return null;

  const statusInfo = statusConfig[trip.status];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={() => onClose()}
      />

      <div className="fixed right-0 top-0 h-full w-[500px] bg-neutral-900 border-l border-neutral-800 z-50 overflow-y-auto shadow-2xl flex flex-col font-body">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900/95 border-b border-neutral-800 p-6 z-10 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-neutral-400">{trip.id}</Badge>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {trip.poolId && <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Users size={12} className="mr-1"/> Pool {trip.poolId}</Badge>}
             </div>
             <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
               <X size={24} />
             </button>
          </div>
          <h2 className="text-xl font-heading font-bold text-white leading-tight">
            {trip.from} <span className="text-neutral-600">→</span> {trip.to}
          </h2>
          <div className="flex gap-4 mt-3 text-sm text-neutral-400">
            <span className="flex items-center gap-1"><Users size={14}/> {trip.occupancy}/{trip.capacity}</span>
            <span className="flex items-center gap-1"><Clock size={14}/> {trip.eta}</span>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-8">
          
          {/* Map Preview */}
          <div className="aspect-video bg-neutral-800 rounded-lg border border-neutral-700 relative flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Map_of_Quito%2C_Ecuador.png')] bg-cover bg-center grayscale" />
             <div className="z-10 bg-neutral-900/80 px-4 py-2 rounded-full border border-neutral-700 flex items-center gap-2">
               <MapIcon size={16} className="text-primary"/>
               <span className="text-sm font-medium text-white">Ruta en vivo</span>
             </div>
          </div>

          {/* Driver Card */}
          <section>
             <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Conductor Asignado</h3>
             {trip.driver ? (
               <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center text-xl">
                   {trip.driver.photo ? <img src={trip.driver.photo} className="w-full h-full rounded-full"/> : '👮'}
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="font-bold text-white">{trip.driver.name}</p>
                       <p className="text-sm text-neutral-400">{trip.driver.vehicle} • <span className="font-mono text-neutral-300">{trip.driver.plate}</span></p>
                     </div>
                     <div className="text-right">
                       <span className="text-secondary font-bold">★ {trip.driver.rating}</span>
                     </div>
                   </div>
                 </div>
               </div>
             ) : (
                <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
                  <p className="text-neutral-500">Sin conductor asignado</p>
                  <Button variant="default" size="sm" className="mt-2" onClick={() => onReassign?.(trip.id)}>Asignar manualmente</Button>
                </div>
             )}
          </section>

          {/* Passengers */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pasajeros ({trip.passengers.length})</h3>
              {trip.poolId && <span className="text-xs text-blue-400">Grupo Pool Activo</span>}
            </div>
            <div className="space-y-2">
              {trip.passengers.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
                   <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${p.checkedIn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-600'}`}/>
                     <div>
                       <p className="text-sm font-medium text-white">{p.name}</p>
                       <p className="text-xs text-neutral-500">{p.phone || 'Sin teléfono'}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge variant={p.paymentStatus === 'paid' ? 'outline' : 'destructive'} className={p.paymentStatus === 'paid' ? 'text-green-500 border-green-500/20' : ''}>
                       {p.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                     </Badge>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* Finance Section */}
          <section className="bg-neutral-950 rounded-lg border border-neutral-800 p-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Desglose Financiero</h3>
            <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-neutral-400">Tarifa Total</span>
                 <span className="text-white font-mono">${trip.payment.total.toFixed(2)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-neutral-400">Comisión Going (20%)</span>
                 <span className="text-green-400 font-mono">+${trip.payment.commission.toFixed(2)}</span>
               </div>
               <div className="border-t border-neutral-800 pt-2 flex justify-between items-center">
                 <span className="text-neutral-400 flex items-center gap-2"><CreditCard size={14}/> {trip.payment.method}</span>
                 <Badge variant="outline" className="border-neutral-700">
                   {trip.payment.status === 'success' ? <span className="text-green-500">Cobrado</span> : 'Pendiente'}
                 </Badge>
               </div>
            </div>
          </section>

          {/* Timeline Audit */}
          <section>
             <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Audit Log</h3>
             <div className="border-l border-neutral-800 pl-4 space-y-4">
               {trip.timeline.map((event, i) => (
                 <div key={i} className="relative">
                   <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-700 border-2 border-neutral-900 group-last:bg-primary"/>
                   <p className="text-sm text-neutral-300">{event.event}</p>
                   <p className="text-xs text-neutral-600">{event.timestamp}</p>
                 </div>
               ))}
             </div>
          </section>

        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 sticky bottom-0 z-20">
          <div className="grid grid-cols-2 gap-3 mb-3">
             <Button variant="secondary" className="w-full" onClick={() => onReassign?.(trip.id)}>
               <RotateCcw className="mr-2 h-4 w-4" /> Reasignar
             </Button>
             <Button variant="outline" className="w-full" onClick={() => onContact?.(trip.id, 'driver')}>
               <Phone className="mr-2 h-4 w-4" /> Contactar
             </Button>
          </div>
          <Button variant="destructive" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20" onClick={() => onCancel?.(trip.id, 'Operador')}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Cancelar Viaje
          </Button>
        </div>
      </div>
    </>
  );
}
