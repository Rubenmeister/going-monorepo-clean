'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com/api';

type DocKey = 'cedula' | 'licencia' | 'matricula' | 'soat' | 'foto_vehiculo' | 'foto_conductor';

interface DocStatus {
  file: File | null;
  uploaded: boolean;
  error: string;
}

const REQUIRED_DOCS: { key: DocKey; label: string; desc: string; icon: string; required: boolean }[] = [
  {
    key: 'cedula',
    label: 'Cédula de Identidad',
    desc: 'Ambos lados. JPG, PNG o PDF. Máx. 5 MB.',
    icon: '🪪',
    required: true,
  },
  {
    key: 'licencia',
    label: 'Licencia de Conducir',
    desc: 'Tipo B o superior. Vigente. Frente y reverso.',
    icon: '📋',
    required: true,
  },
  {
    key: 'matricula',
    label: 'Matrícula del Vehículo',
    desc: 'Vigente. Debe coincidir con el vehículo que usarás.',
    icon: '🚗',
    required: true,
  },
  {
    key: 'soat',
    label: 'SOAT Vigente',
    desc: 'Seguro Obligatorio de Accidentes de Tránsito vigente.',
    icon: '🛡️',
    required: true,
  },
  {
    key: 'foto_vehiculo',
    label: 'Foto del Vehículo',
    desc: 'Foto exterior del vehículo en buen estado. Placa visible.',
    icon: '📸',
    required: true,
  },
  {
    key: 'foto_conductor',
    label: 'Foto de Perfil',
    desc: 'Foto tuya con buena iluminación, fondo claro, sin gafas.',
    icon: '🤳',
    required: true,
  },
];

const VEHICLE_TYPES = [
  { value: 'auto', label: 'Automóvil', seats: 4 },
  { value: 'suv', label: 'SUV', seats: 5 },
  { value: 'suvxl', label: 'SUV XL', seats: 7 },
  { value: 'van', label: 'VAN', seats: 8 },
  { value: 'vanxl', label: 'VAN XL', seats: 12 },
  { value: 'minibus', label: 'Minibús', seats: 20 },
  { value: 'bus', label: 'Bus', seats: 40 },
];

export default function DriverRegistroPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [vehicle, setVehicle] = useState({
    type: '',
    brand: '',
    model: '',
    year: '',
    plate: '',
    color: '',
  });
  const [docs, setDocs] = useState<Record<DocKey, DocStatus>>(() =>
    Object.fromEntries(
      REQUIRED_DOCS.map(d => [d.key, { file: null, uploaded: false, error: '' }])
    ) as Record<DocKey, DocStatus>
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleFileChange = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      setDocs(prev => ({ ...prev, [key]: { ...prev[key], error: 'El archivo supera 5 MB' } }));
      return;
    }
    setDocs(prev => ({ ...prev, [key]: { file, uploaded: !!file, error: '' } }));
  };

  const step1Valid = vehicle.type && vehicle.brand && vehicle.model && vehicle.year && vehicle.plate && vehicle.color;
  const step2Valid = REQUIRED_DOCS.filter(d => d.required).every(d => docs[d.key].file !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setGlobalError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const formData = new FormData();
      Object.entries(vehicle).forEach(([k, v]) => formData.append(k, v));
      REQUIRED_DOCS.forEach(d => {
        if (docs[d.key].file) formData.append(d.key, docs[d.key].file as File);
      });
      const res = await fetch(`${API_BASE}/drivers/onboarding`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Error al enviar documentos');
      setSubmitted(true);
    } catch {
      setGlobalError('Hubo un error al enviar tu solicitud. Intenta de nuevo o escríbenos a conductores@goingec.com');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
            style={{ backgroundColor: '#f0fdf4' }}>
            🎉
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Nuestro equipo revisará tus documentos en <strong>1–2 días hábiles</strong>.
            Te avisaremos por correo y en la app cuando tu cuenta esté activa.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 text-left space-y-3">
            {[
              { icon: '📧', text: 'Recibirás un correo de confirmación' },
              { icon: '🔍', text: 'Revisamos tus documentos en 24–48 h' },
              { icon: '✅', text: 'Te activamos y ya puedes comenzar a recibir viajes' },
              { icon: '📚', text: 'Mientras tanto, completa la Academia Going' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/academy"
              className="block w-full py-3 rounded-xl font-bold text-white text-center transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#ff4c41' }}>
              📚 Ir a la Academia Going
            </Link>
            <Link href="/"
              className="block w-full py-3 rounded-xl font-bold text-gray-700 text-center bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-10 px-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #ff4c4120 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <Link href="/conductores" className="text-gray-400 text-sm hover:text-white mb-4 inline-block">
            ← Volver a Conductores
          </Link>
          <h1 className="text-3xl font-bold mb-2">Activar tu cuenta de conductor</h1>
          <p className="text-gray-300 text-sm">
            Solo unos pasos para verificar tu vehículo y documentos. Proceso 100% digital.
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Vehículo' },
            { n: 2, label: 'Documentos' },
            { n: 3, label: 'Confirmar' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: step >= s.n ? '#ff4c41' : '#e5e7eb',
                    color: step >= s.n ? 'white' : '#9ca3af',
                  }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step > s.n ? 'bg-[#ff4c41]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Vehicle ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">🚗 Datos del vehículo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de vehículo</label>
                <select
                  name="type"
                  value={vehicle.type}
                  onChange={handleVehicleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50 text-gray-900">
                  <option value="">Selecciona el tipo</option>
                  {VEHICLE_TYPES.map(v => (
                    <option key={v.value} value={v.value}>{v.label} — hasta {v.seats} pasajeros</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Marca</label>
                  <input
                    name="brand" value={vehicle.brand} onChange={handleVehicleChange}
                    placeholder="Toyota, Chevrolet..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo</label>
                  <input
                    name="model" value={vehicle.model} onChange={handleVehicleChange}
                    placeholder="Hilux, Corsa..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Año</label>
                  <input
                    name="year" value={vehicle.year} onChange={handleVehicleChange}
                    placeholder="2019"
                    type="number" min="2010" max="2026"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <input
                    name="color" value={vehicle.color} onChange={handleVehicleChange}
                    placeholder="Blanco, Negro..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Placa</label>
                <input
                  name="plate" value={vehicle.plate} onChange={handleVehicleChange}
                  placeholder="ABC-1234"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50 text-gray-900 uppercase"
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                <strong>📋 Requisitos del vehículo:</strong> mínimo año 2010, buen estado físico y mecánico,
                asientos sin roturas, AC funcional para suelo caliente. Los vehículos para tours turísticos
                deben tener seguro adicional.
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#ff4c41' }}>
                Continuar con documentos →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Documents ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">📂 Documentos requeridos</h2>
            <p className="text-sm text-gray-500 mb-6">Sube fotos claras o PDFs. Máx. 5 MB por archivo.</p>

            <div className="space-y-4">
              {REQUIRED_DOCS.map(doc => {
                const status = docs[doc.key];
                return (
                  <div key={doc.key}
                    className={`rounded-xl border-2 p-4 transition-colors ${
                      status.uploaded ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-gray-900">{doc.label}</span>
                          {doc.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Requerido</span>
                          )}
                          {status.uploaded && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">✓ Listo</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{doc.desc}</p>

                        <label className="cursor-pointer">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            status.uploaded
                              ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}>
                            {status.uploaded ? `📎 ${status.file?.name.slice(0, 25)}...` : '📤 Subir archivo'}
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,application/pdf"
                            className="hidden"
                            onChange={e => handleFileChange(doc.key, e)}
                          />
                        </label>

                        {status.error && (
                          <p className="text-xs text-red-600 mt-1">⚠️ {status.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                ← Volver
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!step2Valid}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: '#ff4c41' }}>
                Revisar y enviar →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">✅ Resumen de tu solicitud</h2>

              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Vehículo</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Tipo', VEHICLE_TYPES.find(v => v.value === vehicle.type)?.label || vehicle.type],
                    ['Marca / Modelo', `${vehicle.brand} ${vehicle.model}`],
                    ['Año', vehicle.year],
                    ['Placa', vehicle.plate.toUpperCase()],
                    ['Color', vehicle.color],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span className="text-gray-400">{k}: </span>
                      <span className="font-medium text-gray-900">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Documentos</h3>
                <div className="space-y-1">
                  {REQUIRED_DOCS.map(doc => (
                    <div key={doc.key} className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">{doc.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
              <strong>⏱️ Tiempo de revisión:</strong> 1–2 días hábiles. Te notificamos por correo y notificación push en la app.
            </div>

            {globalError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                ⚠️ {globalError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                ← Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-2 flex-grow py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 hover:opacity-90"
                style={{ backgroundColor: '#ff4c41' }}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : 'Enviar solicitud 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
