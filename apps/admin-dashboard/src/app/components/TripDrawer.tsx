'use client';

import React from 'react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

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
  requested: { label: 'Solicitado', variant: 'neutral' as const },
  assigned: { label: 'Asignado', variant: 'info' as const },
  in_progress: { label: 'En curso', variant: 'active' as const },
  completed: { label: 'Completado', variant: 'success' as const },
  cancelled: { label: 'Cancelado', variant: 'warning' as const },
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => onClose()}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[450px] bg-charcoal border-l border-border z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-charcoal border-b border-border p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-going-red text-sm">{trip.id}</span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <button onClick={() => onClose()} className="text-white/40 hover:text-white text-xl">
              ✕
            </button>
          </div>

          <h3 className="font-heading text-lg font-semibold text-white">
            {trip.from} → {trip.to}
          </h3>

          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
            <span>🪑 {trip.occupancy}/{trip.capacity} asientos</span>
            <span>⏱️ ETA: {trip.eta}</span>
            {trip.poolId && <Badge variant="info" size="sm">Pool {trip.poolId}</Badge>}
          </div>
        </div>

        {/* Mini Map Placeholder */}
        <div className="h-40 bg-surface m-4 rounded-lg border border-border flex items-center justify-center">
          <div className="text-center text-white/40">
            <span className="text-2xl">🗺️</span>
            <p className="text-xs mt-1">Mapa de ruta</p>
          </div>
        </div>

        {/* Driver Section */}
        {trip.driver && (
          <div className="px-4 pb-4">
            <h4 className="text-xs uppercase tracking-wide text-white/40 mb-2">Conductor</h4>
            <div className="bg-surface rounded-lg p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-going-red/20 rounded-full flex items-center justify-center text-going-red text-lg">
                {trip.driver.photo ? (
                  <img src={trip.driver.photo} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  '🚗'
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{trip.driver.name}</p>
                <p className="text-white/50 text-sm">{trip.driver.vehicle} • {trip.driver.plate}</p>
              </div>
              <div className="text-right">
                <span className="text-going-yellow">★ {trip.driver.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Passengers Section */}
        <div className="px-4 pb-4">
          <h4 className="text-xs uppercase tracking-wide text-white/40 mb-2">
            Pasajeros ({trip.passengers.length})
          </h4>
          <div className="space-y-2">
            {trip.passengers.map((passenger) => (
              <div
                key={passenger.id}
                className="bg-surface rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={passenger.checkedIn ? 'text-success' : 'text-white/40'}>
                    {passenger.checkedIn ? '✓' : '○'}
                  </span>
                  <div>
                    <p className="text-white text-sm">{passenger.name}</p>
                    {passenger.phone && (
                      <p className="text-white/40 text-xs">{passenger.phone}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={passenger.paymentStatus === 'paid' ? 'success' : passenger.paymentStatus === 'pending' ? 'warning' : 'critical'}
                  size="sm"
                >
                  {passenger.paymentStatus === 'paid' ? 'Pagado' : passenger.paymentStatus === 'pending' ? 'Pendiente' : 'Fallido'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="px-4 pb-4">
          <h4 className="text-xs uppercase tracking-wide text-white/40 mb-2">Timeline</h4>
          <div className="relative pl-4 border-l border-border">
            {trip.timeline.map((event, i) => (
              <div key={i} className="relative pb-3 last:pb-0">
                <span className="absolute -left-[21px] w-3 h-3 bg-going-red rounded-full border-2 border-charcoal" />
                <p className="text-white text-sm">{event.event}</p>
                <p className="text-white/40 text-xs">{event.timestamp}</p>
                {event.details && (
                  <p className="text-white/50 text-xs mt-1">{event.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="px-4 pb-4">
          <h4 className="text-xs uppercase tracking-wide text-white/40 mb-2">Pagos</h4>
          <div className="bg-surface rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total</span>
              <span className="text-white font-medium">${trip.payment.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Comisión</span>
              <span className="text-white/80">-${trip.payment.commission.toFixed(2)}</span>
            </div>
            {trip.payment.tip > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Propina</span>
                <span className="text-going-yellow">+${trip.payment.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-white/60">Método</span>
              <span className="text-white/80">{trip.payment.method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Estado</span>
              <Badge
                variant={trip.payment.status === 'success' ? 'success' : trip.payment.status === 'pending' ? 'warning' : 'critical'}
                size="sm"
              >
                {trip.payment.status === 'success' ? 'Exitoso' : trip.payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-charcoal border-t border-border p-4">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onReassign?.(trip.id)}
            >
              🔄 Reasignar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onContact?.(trip.id, 'driver')}
            >
              📞
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={() => onCancel?.(trip.id, 'operador')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
