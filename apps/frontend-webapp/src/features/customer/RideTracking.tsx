'use client';

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrackingMapPanel,
  TripStatusTimeline,
  PaymentStatusBadge,
  TimelineEvent,
  TripRoute,
} from '@going/shared-ui';

const MOCK_TRIP: TripRoute = {
  origin: { lat: -0.1807, lng: -78.4678, name: 'Aeropuerto Mariscal Sucre' },
  destination: { lat: -0.2105, lng: -78.4936, name: 'Centro Histórico, Quito' },
  eta: '18 min',
  distance: '12.5 km',
};

const MOCK_DRIVER = {
  name: 'Carlos Mendoza',
  rating: 4.9,
  vehicle: 'Toyota Corolla Gris',
  plate: 'PBA-1234',
  phone: '+593 99 123 4567',
};

export function RideTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'en_route_pickup' | 'arrived_pickup' | 'en_route_destination' | 'arrived'>('en_route_pickup');

  const timelineEvents: TimelineEvent[] = [
    { id: '1', status: 'completed', title: 'Viaje confirmado', timestamp: '10:30 AM', icon: '✓' },
    { id: '2', status: 'completed', title: 'Conductor asignado', timestamp: '10:32 AM', description: MOCK_DRIVER.name, icon: '🚗' },
    { id: '3', status: status === 'en_route_pickup' ? 'active' : 'completed', title: 'En camino a recogerte', timestamp: status !== 'en_route_pickup' ? '10:35 AM' : undefined, icon: '📍' },
    { id: '4', status: status === 'arrived_pickup' ? 'active' : status === 'en_route_pickup' ? 'pending' : 'completed', title: 'Llegó al punto de recogida', icon: '🛬' },
    { id: '5', status: status === 'en_route_destination' ? 'active' : ['en_route_pickup', 'arrived_pickup'].includes(status) ? 'pending' : 'completed', title: 'En camino al destino', icon: '🚀' },
    { id: '6', status: status === 'arrived' ? 'completed' : 'pending', title: 'Llegaste a tu destino', icon: '🎉' },
  ];

  // Simulate status changes for demo
  React.useEffect(() => {
    const timers = [
      setTimeout(() => setStatus('arrived_pickup'), 5000),
      setTimeout(() => setStatus('en_route_destination'), 8000),
      setTimeout(() => setStatus('arrived'), 15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">Viaje en curso</h1>
            <p className="text-sm text-gray-500">ID: {id}</p>
          </div>
          <PaymentStatusBadge status="pending" amount={11.25} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Map */}
        <TrackingMapPanel
          trip={MOCK_TRIP}
          driverName={MOCK_DRIVER.name}
          vehicleType="car"
          status={status}
        />

        {/* Driver Card */}
        <div className="bg-white mx-4 -mt-4 relative z-10 rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-going-red/10 flex items-center justify-center text-2xl">
              🚗
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{MOCK_DRIVER.name}</h3>
                <span className="text-going-yellow">★ {MOCK_DRIVER.rating}</span>
              </div>
              <p className="text-sm text-gray-500">{MOCK_DRIVER.vehicle} • {MOCK_DRIVER.plate}</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                💬
              </button>
              <a 
                href={`tel:${MOCK_DRIVER.phone}`}
                className="w-10 h-10 rounded-full bg-going-red text-white flex items-center justify-center hover:bg-going-red-dark transition"
              >
                📞
              </a>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Estado del viaje</h3>
          <TripStatusTimeline events={timelineEvents} />
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition">
            📤 Compartir estado
          </button>
          <button className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition">
            🆘 Soporte
          </button>
          {status !== 'arrived' && (
            <button 
              onClick={() => {
                if (confirm('¿Cancelar el viaje? Se aplicará cargo de $2.50')) {
                  navigate('/c/activity');
                }
              }}
              className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* Completed State */}
        {status === 'arrived' && (
          <div className="mx-4 mb-6 bg-green-50 rounded-xl p-6 text-center border border-green-100">
            <span className="text-4xl mb-3 block">🎉</span>
            <h3 className="text-lg font-semibold text-green-700 mb-2">¡Llegaste a tu destino!</h3>
            <p className="text-green-600 mb-4">Gracias por viajar con Going</p>
            <button 
              onClick={() => navigate('/c/activity')}
              className="px-6 py-2 bg-going-red text-white rounded-lg font-medium hover:bg-going-red-dark transition"
            >
              Calificar viaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


