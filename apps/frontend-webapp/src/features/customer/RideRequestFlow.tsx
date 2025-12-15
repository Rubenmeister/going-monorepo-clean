'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SearchFromTo,
  ServiceSwitcher,
  CapacityPicker,
  TripStatusTimeline,
  PaymentStatusBadge,
  ServiceType,
  Location,
  TimelineEvent,
} from '@going/shared-ui';

interface FareEstimate {
  base: number;
  distance: number;
  total: number;
  eta: string;
  distance_km: string;
}

const MOCK_FARE: FareEstimate = {
  base: 2.50,
  distance: 8.75,
  total: 11.25,
  eta: '15-20 min',
  distance_km: '8.5 km',
};

export function RideRequestFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [step, setStep] = useState<'details' | 'confirm' | 'searching' | 'matched'>('details');
  const [serviceType, setServiceType] = useState<ServiceType>((searchParams.get('type') as ServiceType) || 'private');
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [passengers, setPassengers] = useState(Number(searchParams.get('passengers')) || 1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [fare, setFare] = useState<FareEstimate | null>(null);

  // Simulate fare calculation
  useEffect(() => {
    if (fromLocation && toLocation) {
      setTimeout(() => setFare(MOCK_FARE), 500);
    }
  }, [fromLocation, toLocation]);

  const handleConfirm = () => {
    setStep('searching');
    // Simulate driver matching
    setTimeout(() => {
      setStep('matched');
      // Redirect to tracking after match
      setTimeout(() => {
        navigate('/c/ride/T-' + Date.now());
      }, 2000);
    }, 3000);
  };

  const timelineEvents: TimelineEvent[] = [
    { id: '1', status: step === 'details' ? 'active' : 'completed', title: 'Detalles del viaje', icon: '📍' },
    { id: '2', status: step === 'confirm' ? 'active' : step === 'details' ? 'pending' : 'completed', title: 'Confirmar solicitud', icon: '✓' },
    { id: '3', status: step === 'searching' ? 'active' : step === 'matched' ? 'completed' : 'pending', title: 'Buscando conductor', icon: '🔍' },
    { id: '4', status: step === 'matched' ? 'active' : 'pending', title: 'Conductor asignado', icon: '🚗' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            ← Volver
          </button>
          <h1 className="font-semibold text-gray-900">
            {serviceType === 'shared' ? 'Viaje compartido' : serviceType === 'shipment' ? 'Envío' : 'Viaje privado'}
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress Timeline */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <TripStatusTimeline events={timelineEvents} />
        </div>

        {/* Step: Details */}
        {step === 'details' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">¿A dónde vamos?</h2>
            
            <SearchFromTo
              fromValue={fromLocation}
              toValue={toLocation}
              onFromChange={setFromLocation}
              onToChange={setToLocation}
              className="mb-4"
            />

            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="font-medium text-gray-700 mb-3">Tipo de servicio</h3>
              <ServiceSwitcher
                value={serviceType}
                onChange={setServiceType}
                size="md"
              />
            </div>

            {serviceType === 'shared' && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <CapacityPicker
                  value={passengers}
                  onChange={setPassengers}
                  min={1}
                  max={4}
                  label="Pasajeros"
                />
              </div>
            )}

            {fare && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Distancia estimada</span>
                  <span className="font-medium">{fare.distance_km}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tiempo estimado</span>
                  <span className="font-medium">{fare.eta}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total estimado</span>
                  <span className="font-bold text-going-red">${fare.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('confirm')}
              disabled={!fromLocation || !toLocation}
              className={`
                w-full mt-6 py-3 rounded-xl font-semibold transition
                ${fromLocation && toLocation
                  ? 'bg-going-red text-white hover:bg-going-red-dark'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Confirmar solicitud</h2>
            
            {/* Route Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full bg-going-red"></span>
                <span className="text-gray-900">{fromLocation?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-going-yellow"></span>
                <span className="text-gray-900">{toLocation?.name}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-700 mb-3">Método de pago</h3>
              <div className="space-y-2">
                {[
                  { id: 'card', label: 'Tarjeta •••• 4242', icon: '💳' },
                  { id: 'cash', label: 'Efectivo', icon: '💵' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`
                      w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition
                      ${paymentMethod === method.id
                        ? 'border-going-red bg-going-red/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                    {paymentMethod === method.id && <PaymentStatusBadge status="pending" className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-sm text-gray-500">
                🕐 Cancela gratis hasta 2 minutos después de la asignación del conductor.
                Después se aplica cargo de $2.50.
              </p>
            </div>

            {/* Total & Confirm */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex justify-between items-center text-xl mb-4">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-going-red">${fare?.total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-going-red text-white rounded-xl font-semibold hover:bg-going-red-dark transition"
              >
                Confirmar viaje
              </button>
            </div>
          </div>
        )}

        {/* Step: Searching */}
        {step === 'searching' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 border-4 border-going-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Buscando conductor...</h2>
            <p className="text-gray-500">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Step: Matched */}
        {step === 'matched' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">¡Conductor encontrado!</h2>
            <p className="text-gray-500">Redirigiendo al seguimiento...</p>
          </div>
        )}
      </div>
    </div>
  );
}


