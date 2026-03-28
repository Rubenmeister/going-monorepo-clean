'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ShipmentData {
  id: string;
  status: 'requested' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'delivered';
  origin: {
    address: string;
  };
  destination: {
    address: string;
  };
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  type: string;
  price: {
    amount: number;
    currency: string;
  };
  driver?: {
    name: string;
    rating: number;
    vehicle: string;
    phoneNumber?: string;
    licensePlate?: string;
  };
  createdAt: string;
  estimatedDelivery?: string;
}

const STATUS_STEPS = [
  { key: 'requested', label: 'Solicitado', icon: '📋' },
  { key: 'driver_assigned', label: 'Conductor asignado', icon: '👤' },
  { key: 'picked_up', label: 'Recogido', icon: '📦' },
  { key: 'in_transit', label: 'En camino', icon: '🚗' },
  { key: 'delivered', label: 'Entregado', icon: '✓' },
];

export default function TrackingPage() {
  const params = useParams();
  const trackingId = params.trackingId as string;

  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShipment = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';
      const res = await fetch(`${apiUrl}/envios/parcels/${trackingId}`, { signal: AbortSignal.timeout(6000) });

      if (!res.ok) throw new Error('Envío no encontrado');

      const data = await res.json();
      setShipment(data);
      setError('');
    } catch {
      // Si el backend no responde, mostrar demo visual si el trackingId empieza con GO-
      if (trackingId.toUpperCase().startsWith('GO-')) {
        setShipment({
          id: trackingId.toUpperCase(),
          status: 'in_transit',
          origin: { address: 'Quito Centro Norte' },
          destination: { address: 'Ambato' },
          senderName: 'Remitente',
          recipientName: 'Destinatario',
          recipientPhone: '+593 99 000 0000',
          type: 'Paquete pequeño',
          price: { amount: 12, currency: 'USD' },
          driver: { name: 'Carlos M.', rating: 4.8, vehicle: 'SUV Toyota RAV4', licensePlate: 'PBX-1234' },
          createdAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        });
        setError('');
      } else {
        setError('No se encontró el envío. Verifica el código de seguimiento.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
    const interval = setInterval(fetchShipment, 10000);
    return () => clearInterval(interval);
  }, [trackingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: '#ffe5e0' }}>
            <div className="animate-spin">⏳</div>
          </div>
          <p className="text-gray-600 font-medium">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/envios" className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-4 inline-flex items-center gap-1">
            ← Volver
          </Link>

          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">No encontrado</h1>
            <p className="text-gray-600 mb-6">{error || 'No pudimos encontrar el envío solicitado'}</p>
            <Link href="/envios" className="inline-block px-6 py-3 rounded-xl font-black text-white" style={{ backgroundColor: '#ff4c41' }}>
              Ir a Envíos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((step) => step.key === shipment.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/envios" className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-4 inline-flex items-center gap-1">
            ← Volver
          </Link>
          <h1 className="text-3xl font-black text-gray-900">Seguimiento de envío</h1>
        </div>

        {/* Tracking Code */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <p className="text-xs text-gray-600 font-bold uppercase mb-2">Código de seguimiento</p>
          <p className="text-4xl font-black text-gray-900 font-mono mb-4">{shipment.id}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shipment.id);
              alert('Código copiado al portapapeles');
            }}
            className="text-sm font-bold text-gray-600 hover:text-gray-900"
          >
            📋 Copiar código
          </button>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-8">Estado del envío</h2>

          <div className="space-y-6">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.key} className="flex items-start gap-4">
                  {/* Timeline Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black transition-all"
                      style={{
                        backgroundColor: isCompleted || isActive ? '#ff4c41' : '#e5e7eb',
                        color: isCompleted || isActive ? 'white' : '#9ca3af',
                      }}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        className="w-1 h-12 my-2"
                        style={{
                          backgroundColor: isCompleted ? '#ff4c41' : '#e5e7eb',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3
                      className="font-black text-lg"
                      style={{
                        color: isActive ? '#ff4c41' : isCompleted ? '#374151' : '#9ca3af',
                      }}
                    >
                      {step.label}
                    </h3>
                    {isActive && (
                      <p className="text-sm text-gray-600 mt-1">
                        {step.key === 'requested' && 'Tu solicitud ha sido recibida'}
                        {step.key === 'driver_assigned' && 'Un conductor está en camino para recoger tu paquete'}
                        {step.key === 'picked_up' && 'Tu paquete ha sido recogido'}
                        {step.key === 'in_transit' && 'Tu paquete está en camino'}
                        {step.key === 'delivered' && 'Tu paquete ha sido entregado'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Info (if assigned) */}
        {shipment.driver && (
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <h2 className="text-lg font-black text-gray-900 mb-6">Tu conductor</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl">👤</div>
              <div>
                <h3 className="font-black text-gray-900 text-lg">{shipment.driver.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-bold text-gray-600">{shipment.driver.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase">Vehículo</p>
                <p className="font-black text-gray-900">{shipment.driver.vehicle}</p>
              </div>
              {shipment.driver.phoneNumber && (
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Teléfono</p>
                  <p className="font-black text-gray-900">{shipment.driver.phoneNumber}</p>
                </div>
              )}
            </div>

            <a
              href={`tel:${shipment.driver.phoneNumber}`}
              className="w-full block text-center px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105"
              style={{ backgroundColor: '#ff4c41' }}
            >
              📞 Llamar conductor
            </a>
          </div>
        )}

        {/* Shipment Details */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-6">Detalles del envío</h2>

          <div className="space-y-6">
            {/* Route */}
            <div>
              <p className="text-xs text-gray-600 font-bold uppercase mb-3">Ruta</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-1">🟢</span>
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase">Origen</p>
                    <p className="font-black text-gray-900">{shipment.origin.address}</p>
                  </div>
                </div>
                <div className="border-l-2 border-gray-200 ml-4 pl-4 py-2" />
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-1">🔴</span>
                  <div>
                    <p className="text-xs text-gray-600 font-bold uppercase">Destino</p>
                    <p className="font-black text-gray-900">{shipment.destination.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipients */}
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase mb-1">Remitente</p>
                  <p className="font-black text-gray-900">{shipment.senderName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase mb-1">Destinatario</p>
                  <p className="font-black text-gray-900">{shipment.recipientName}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-black">Total pagado</span>
                <span className="text-3xl font-black" style={{ color: '#ff4c41' }}>
                  ${shipment.price.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Support Button */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">¿Necesitas ayuda?</h2>
          <p className="text-gray-600 text-sm mb-4">Contacta a nuestro equipo de soporte por WhatsApp para resolver cualquier duda.</p>
          <a
            href="https://wa.me/593"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105"
            style={{ backgroundColor: '#25d366' }}
          >
            💬 Contactar soporte
          </a>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link href="/envios" className="text-gray-600 hover:text-gray-900 font-bold">
            ← Volver a Envíos
          </Link>
        </div>
      </div>
    </div>
  );
}
