'use client';

import { useRideStore } from '@/stores/rideStore';
import { VEHICLE_TYPES } from '@/types';
import type { VehicleType, ServiceTier } from '@/types';

const COMPANY_CUT  = 0.20; // 20%
const DRIVER_CUT   = 0.80; // 80%

interface RideAccountingProps {
  amount:        number;
  paymentMethod: string; // 'card' | 'cash' | 'transfer'
  onDone:        () => void;
}

export function RideAccounting({ amount, paymentMethod, onDone }: RideAccountingProps) {
  const { activeRide } = useRideStore();

  const companyCut = Math.round(amount * COMPANY_CUT * 100) / 100;
  const driverCut  = Math.round(amount * DRIVER_CUT  * 100) / 100;

  const vehicleType  = (activeRide?.vehicleType  as VehicleType)  || 'suv';
  const serviceTier  = (activeRide?.serviceTier  as ServiceTier)  || 'confort';
  const vehicleLabel = VEHICLE_TYPES[vehicleType]?.label ?? 'SUV';
  const tierLabel    = serviceTier === 'premium' ? '⭐ Premium' : '✓ Confort';

  const methodLabel: Record<string, string> = {
    card:     '💳 Tarjeta',
    cash:     '💵 Efectivo',
    transfer: '🏦 Transferencia',
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">

      {/* ── Encabezado ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #fff2f2 0%, #fff 100%)' }}>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
          <p className="text-sm font-medium text-gray-400">Pago completado</p>
          <p className="text-4xl font-black text-gray-900 mt-1">${amount.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-1">{dateStr} · {timeStr}</p>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* Detalles del viaje */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            {activeRide && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Origen</span>
                  <span className="font-medium text-gray-900 max-w-[60%] text-right truncate">{activeRide.pickup.address}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Destino</span>
                  <span className="font-medium text-gray-900 max-w-[60%] text-right truncate">{activeRide.dropoff.address}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Distancia</span>
                  <span className="font-medium text-gray-900">{activeRide.distance.toFixed(1)} km · ~{activeRide.duration} min</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Vehículo</span>
              <span className="font-medium text-gray-900">{vehicleLabel} <span style={{ color: serviceTier === 'premium' ? '#B45309' : '#ff4c41' }}>{tierLabel}</span></span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Método de pago</span>
              <span className="font-medium text-gray-900">{methodLabel[paymentMethod] ?? paymentMethod}</span>
            </div>
          </div>

          {/* Desglose financiero */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Distribución del pago</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff4c41]" />
                  <span className="text-sm text-gray-600">Going (plataforma)</span>
                  <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">20%</span>
                </div>
                <span className="font-bold text-gray-900">${companyCut.toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Conductor</span>
                  <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">80%</span>
                </div>
                <span className="font-bold text-gray-900">${driverCut.toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
                <span className="text-sm font-bold text-gray-700">Total</span>
                <span className="font-black text-gray-900">${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ID de transacción */}
          <div className="flex justify-between items-center px-2 text-xs text-gray-400">
            <span>ID transacción</span>
            <span className="font-mono">{activeRide?.tripId?.slice(-12).toUpperCase() ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Botón continuar ── */}
      <button
        onClick={onDone}
        className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 shadow-lg"
        style={{ backgroundColor: '#ff4c41' }}
      >
        Valorar al conductor →
      </button>
    </div>
  );
}
