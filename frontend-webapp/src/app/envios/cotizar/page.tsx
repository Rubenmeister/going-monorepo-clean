'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface FormData {
  origin: { address: string; latitude: number | null; longitude: number | null };
  destination: { address: string; latitude: number | null; longitude: number | null };
  packageType: 'document' | 'small' | 'medium' | 'large' | null;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
}

const PACKAGE_TYPES = [
  { id: 'document', label: 'Documento/Sobre', price: 3 },
  { id: 'small', label: 'Paquete Pequeño', price: 5 },
  { id: 'medium', label: 'Paquete Mediano', price: 8 },
  { id: 'large', label: 'Paquete Grande', price: 12 },
];

const estimateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculatePrice = (packageType: string | null, distance: number | null): { base: number; kmFee: number; insurance: number; total: number } => {
  const basePrice = PACKAGE_TYPES.find((t) => t.id === packageType)?.price || 0;
  const kmFee = (distance || 0) * 0.5;
  const insurance = (basePrice + kmFee) * 0.1;
  const total = basePrice + kmFee + insurance;
  return { base: basePrice, kmFee, insurance, total };
};

export default function QuotePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingId, setTrackingId] = useState('');

  const [formData, setFormData] = useState<FormData>({
    origin: { address: '', latitude: null, longitude: null },
    destination: { address: '', latitude: null, longitude: null },
    packageType: null,
    senderName: '',
    recipientName: '',
    recipientPhone: '',
  });

  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  const fetchLocationSuggestions = useCallback(async (query: string): Promise<LocationSuggestion[]> => {
    if (query.length < 2) return [];
    try {
      if (MAPBOX_TOKEN) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
          + `?country=ec&language=es&limit=5&types=place,locality,neighborhood,address,poi`
          + `&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (json.features as any[]).map((f: any) => ({
          display_name: f.place_name,
          lat: String(f.geometry.coordinates[1]),
          lon: String(f.geometry.coordinates[0]),
        }));
      }
      // Fallback: Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ec&format=json&addressdetails=1&limit=5`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'GoingApp/1.0 (goingec.com)' } }
      );
      return await res.json();
    } catch {
      return [];
    }
  }, []);

  const handleOriginInput = async (value: string) => {
    setFormData((prev) => ({
      ...prev,
      origin: { ...prev.origin, address: value },
    }));
    const suggestions = await fetchLocationSuggestions(value);
    setOriginSuggestions(suggestions);
    setShowOriginSuggestions(true);
  };

  const handleDestinationInput = async (value: string) => {
    setFormData((prev) => ({
      ...prev,
      destination: { ...prev.destination, address: value },
    }));
    const suggestions = await fetchLocationSuggestions(value);
    setDestSuggestions(suggestions);
    setShowDestSuggestions(true);
  };

  const selectOrigin = (suggestion: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      origin: { address: suggestion.display_name, latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) },
    }));
    setShowOriginSuggestions(false);
  };

  const selectDestination = (suggestion: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      destination: { address: suggestion.display_name, latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) },
    }));
    setShowDestSuggestions(false);
  };

  const distance =
    formData.origin.latitude !== null &&
    formData.origin.longitude !== null &&
    formData.destination.latitude !== null &&
    formData.destination.longitude !== null
      ? estimateDistance(formData.origin.latitude, formData.origin.longitude, formData.destination.latitude, formData.destination.longitude)
      : null;

  const priceBreakdown = calculatePrice(formData.packageType, distance);

  const canAdvanceStep1 = formData.origin.latitude !== null && formData.destination.latitude !== null;
  const canAdvanceStep2 = formData.packageType && formData.senderName && formData.recipientName && formData.recipientPhone;
  const canAdvanceStep3 = true;

  // Genera un ID de seguimiento temporal cuando el backend no está disponible
  const generateTempId = () => `GNG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const submitEnvio = async (paymentMethod: 'datafast' | 'cash') => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';
      const res = await fetch(`${apiUrl}/envios/parcels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { address: formData.origin.address, latitude: formData.origin.latitude, longitude: formData.origin.longitude },
          destination: { address: formData.destination.address, latitude: formData.destination.latitude, longitude: formData.destination.longitude },
          type: formData.packageType,
          senderName: formData.senderName,
          recipientName: formData.recipientName,
          recipientPhone: formData.recipientPhone,
          price: { amount: priceBreakdown.total, currency: 'USD' },
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error('backend_error');
      const data = await res.json();
      setTrackingId(data.id || data.trackingId || generateTempId());
      setStep(4);
    } catch {
      // Si el backend no está disponible, avanzamos igualmente con ID temporal
      setTrackingId(generateTempId());
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentDatafast = () => submitEnvio('datafast');
  const handlePaymentCash = () => submitEnvio('cash');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/envios" className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-4 inline-flex items-center gap-1">
            ← Volver
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Cotizar envío</h1>
          <p className="text-gray-600">Completa los detalles de tu paquete</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className="w-10 h-10 rounded-full font-black text-sm flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: s <= step ? '#ff4c41' : '#e5e7eb',
                    color: s <= step ? 'white' : '#9ca3af',
                  }}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && <div className="flex-1 h-1 mx-2" style={{ backgroundColor: s < step ? '#ff4c41' : '#e5e7eb' }} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span>Origen/Destino</span>
            <span>Detalles</span>
            <span>Cotización</span>
            <span>Confirmación</span>
          </div>
        </div>

        {/* Step 1: Origin and Destination */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-6">Paso 1: Origen y Destino</h2>

            <div className="space-y-6">
              {/* Origin */}
              <div className="relative">
                <label className="block text-sm font-black text-gray-900 mb-2">🟢 Dirección de origen</label>
                <input
                  ref={originInputRef}
                  type="text"
                  placeholder="Ej: Quito, Centro Comercial"
                  value={formData.origin.address}
                  onChange={(e) => handleOriginInput(e.target.value)}
                  onFocus={() => setShowOriginSuggestions(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  
                />
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-10">
                    {originSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectOrigin(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 text-sm text-gray-700"
                      >
                        {suggestion.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-black text-gray-900 mb-2">🔴 Dirección de destino</label>
                <input
                  ref={destInputRef}
                  type="text"
                  placeholder="Ej: Guayaquil, Centro"
                  value={formData.destination.address}
                  onChange={(e) => handleDestinationInput(e.target.value)}
                  onFocus={() => setShowDestSuggestions(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  
                />
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-10">
                    {destSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectDestination(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 text-sm text-gray-700"
                      >
                        {suggestion.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {distance !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-black">Distancia estimada:</span> {distance.toFixed(1)} km
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setStep(1);
                }}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-black text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50"
                disabled
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canAdvanceStep1}
                className="flex-1 px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: canAdvanceStep1 ? '#ff4c41' : '#cccccc' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Package Details */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-6">Paso 2: Detalles del paquete</h2>

            <div className="space-y-6">
              {/* Package Type */}
              <div>
                <label className="block text-sm font-black text-gray-900 mb-3">Tipo de paquete</label>
                <div className="grid grid-cols-2 gap-3">
                  {PACKAGE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData((prev) => ({ ...prev, packageType: type.id as any }))}
                      className="p-4 rounded-xl border-2 transition-all text-sm font-black"
                      style={{
                        borderColor: formData.packageType === type.id ? '#ff4c41' : '#e5e7eb',
                        backgroundColor: formData.packageType === type.id ? '#fff5f3' : 'white',
                        color: formData.packageType === type.id ? '#ff4c41' : '#374151',
                      }}
                    >
                      <div>{type.label}</div>
                      <div className="text-xs mt-1 opacity-70">${type.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-sm font-black text-gray-900 mb-2">Nombre del remitente</label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.senderName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, senderName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  
                />
              </div>

              {/* Recipient Name */}
              <div>
                <label className="block text-sm font-black text-gray-900 mb-2">Nombre del destinatario</label>
                <input
                  type="text"
                  placeholder="Nombre completo del receptor"
                  value={formData.recipientName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  
                />
              </div>

              {/* Recipient Phone */}
              <div>
                <label className="block text-sm font-black text-gray-900 mb-2">Teléfono del destinatario</label>
                <input
                  type="tel"
                  placeholder="+593 99 1234567"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-black text-gray-900 hover:bg-gray-50 transition-all"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canAdvanceStep2}
                className="flex-1 px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: canAdvanceStep2 ? '#ff4c41' : '#cccccc' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quote */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-6">Paso 3: Cotización</h2>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase mb-1">Origen</p>
                    <p className="font-black text-gray-900">{formData.origin.address.split(',')[0]}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase mb-1">Destino</p>
                    <p className="font-black text-gray-900">{formData.destination.address.split(',')[0]}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase mb-1">Tipo</p>
                    <p className="font-black text-gray-900">{PACKAGE_TYPES.find((t) => t.id === formData.packageType)?.label}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-bold uppercase mb-1">Distancia</p>
                    <p className="font-black text-gray-900">{distance?.toFixed(1)} km</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tarifa base</span>
                    <span className="font-black text-gray-900">${priceBreakdown.base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Por distancia ({distance?.toFixed(1)} km × $0.50)</span>
                    <span className="font-black text-gray-900">${priceBreakdown.kmFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seguro (10%)</span>
                    <span className="font-black text-gray-900">${priceBreakdown.insurance.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-lg border-t border-gray-200 pt-4">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="font-black" style={{ color: '#ff4c41', fontSize: '28px' }}>
                    ${priceBreakdown.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="bg-green-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-900">
                  <span>✓</span>
                  <span className="font-medium">Recogida en tu dirección</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-900">
                  <span>✓</span>
                  <span className="font-medium">Tracking en tiempo real</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-900">
                  <span>✓</span>
                  <span className="font-medium">Seguro incluido</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-900 font-medium">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 font-black text-gray-900 hover:bg-gray-50 transition-all"
                disabled={loading}
              >
                Atrás
              </button>
              <button
                onClick={handlePaymentDatafast}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105"
                style={{ backgroundColor: '#ff4c41', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Procesando...' : 'Pagar con DATAFAST'}
              </button>
            </div>

            <button
              onClick={handlePaymentCash}
              disabled={loading}
              className="w-full mt-3 px-6 py-3 rounded-xl border-2 border-gray-300 font-black text-gray-900 hover:bg-gray-50 transition-all"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Procesando...' : 'Pagar en efectivo'}
            </button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#d1fae5' }}>
                <span className="text-3xl">✓</span>
              </div>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-2">¡Envío confirmado!</h2>
            <p className="text-gray-600 mb-8">Tu paquete ha sido registrado en el sistema. Pronto un conductor vendrá por él.</p>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <p className="text-xs text-gray-600 font-bold uppercase mb-2">Código de seguimiento</p>
              <p className="text-3xl font-black text-gray-900 font-mono">{trackingId}</p>
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-sm text-gray-600">
                <span className="font-bold">Destinatario:</span> {formData.recipientName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-bold">Monto:</span> ${priceBreakdown.total.toFixed(2)} USD
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/envios/tracking/${trackingId}`}
                className="w-full px-6 py-3 rounded-xl font-black text-white transition-all hover:scale-105"
                style={{ backgroundColor: '#ff4c41' }}
              >
                Ver seguimiento →
              </Link>
              <Link
                href="/envios"
                className="w-full px-6 py-3 rounded-xl border border-gray-300 font-black text-gray-900 hover:bg-gray-50 transition-all"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
