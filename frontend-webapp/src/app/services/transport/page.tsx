'use client';

import { useState } from 'react';
import Link from 'next/link';

const PRIVATE_OPTIONS = [
  {
    type: 'economy',
    icon: '🚗',
    label: 'Economy',
    tagline: 'Económico y confiable',
    description:
      'Vehículos compactos y sedanes para traslados cotidianos. La opción más accesible.',
    baseFare: '$2.50',
    perKm: '$0.50',
    capacity: '1–4 pasajeros',
    features: [
      'Conductores verificados',
      'Seguimiento en tiempo real',
      'Pago con tarjeta o efectivo',
      'Cancelación gratuita',
    ],
    color: '#10B981',
    bgColor: '#f0fdf4',
    badge: 'Más popular',
  },
  {
    type: 'comfort',
    icon: '🚙',
    label: 'Comfort',
    tagline: 'Más espacio y comodidad',
    description:
      'SUVs y sedanes premium para mayor espacio. Ideal para viajes con equipaje o grupos.',
    baseFare: '$3.25',
    perKm: '$0.65',
    capacity: '1–4 pasajeros',
    features: [
      'Vehículos de mayor categoría',
      'Aire acondicionado garantizado',
      'Espacio para equipaje',
      'Conductor profesional',
    ],
    color: '#3B82F6',
    bgColor: '#eff6ff',
    badge: null,
  },
  {
    type: 'premium',
    icon: '🚘',
    label: 'Premium',
    tagline: 'Experiencia ejecutiva',
    description:
      'Vehículos de alta gama para viajes ejecutivos, aeropuerto o eventos especiales.',
    baseFare: '$4.00',
    perKm: '$0.80',
    capacity: '1–4 pasajeros',
    features: [
      'Vehículos de lujo (BMW, Mercedes)',
      'Conductor profesional con uniforme',
      'Agua y amenidades incluidas',
      'Reserva anticipada disponible',
    ],
    color: '#F59E0B',
    bgColor: '#fffbeb',
    badge: 'Ejecutivo',
  },
];

const SHARED_FEATURES = [
  {
    icon: '💰',
    title: 'Hasta 60% más barato',
    desc: 'Divide el costo con otros pasajeros en la misma ruta.',
  },
  {
    icon: '🌱',
    title: 'Más sostenible',
    desc: 'Menos vehículos en circulación, menor huella de carbono.',
  },
  {
    icon: '🗺️',
    title: 'Rutas frecuentes',
    desc: 'Disponible en las rutas más solicitadas de cada ciudad.',
  },
  {
    icon: '⏱️',
    title: 'Tiempo estimado',
    desc: 'El sistema optimiza las paradas para minimizar el desvío.',
  },
];

const COMPARISON = [
  { feature: 'Precio por km', private: 'Desde $0.50', shared: 'Desde $0.20' },
  { feature: 'Viaje exclusivo', private: '✓', shared: '✗' },
  { feature: 'Pasajeros extra', private: '✗', shared: '✓' },
  { feature: 'Disponibilidad', private: '24/7', shared: 'Horario punta' },
  { feature: 'Tiempo de espera', private: '2–8 min', shared: '5–15 min' },
  {
    feature: 'Ideal para',
    private: 'Velocidad y privacidad',
    shared: 'Ahorro en rutas fijas',
  },
];

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<'privado' | 'compartido'>(
    'privado'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative py-20 px-4 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ff4c41 0%, #e63a2f 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full bg-white/15">
            🚗 Transporte Going
          </span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            El servicio de transporte
            <br />
            más completo de Ecuador
          </h1>
          <p className="text-white/85 text-xl max-w-2xl mb-8">
            Elige entre viaje <strong>privado</strong> — solo tú y tu conductor
            — o <strong>compartido</strong> — viaja con otros pasajeros a menor
            costo.
          </p>

          {/* Tab selector */}
          <div className="inline-flex bg-white/15 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('privado')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'privado'
                  ? 'bg-white text-[#ff4c41] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              🚗 Privado
            </button>
            <button
              onClick={() => setActiveTab('compartido')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'compartido'
                  ? 'bg-white text-[#ff4c41] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              👥 Compartido
            </button>
          </div>
        </div>
      </section>

      {/* ── Transporte Privado ───────────────────────── */}
      {activeTab === 'privado' && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Transporte Privado
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              El vehículo es exclusivamente para ti. Sin paradas extra, sin
              esperas, directo a tu destino.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {PRIVATE_OPTIONS.map((opt) => (
              <div
                key={opt.type}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
              >
                {/* Top color bar */}
                <div className="h-1.5" style={{ backgroundColor: opt.color }} />

                <div className="p-6 flex-1 flex flex-col">
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{opt.icon}</span>
                    {opt.badge && (
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${opt.color}18`,
                          color: opt.color,
                        }}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {opt.label}
                  </h3>
                  <p
                    className="text-sm font-medium mb-3"
                    style={{ color: opt.color }}
                  >
                    {opt.tagline}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
                    {opt.description}
                  </p>

                  {/* Pricing */}
                  <div
                    className="rounded-xl p-4 mb-5"
                    style={{ backgroundColor: opt.bgColor }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                          Tarifa base
                        </div>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: opt.color }}
                        >
                          {opt.baseFare}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                          Por km
                        </div>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: opt.color }}
                        >
                          {opt.perKm}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">
                      👥 {opt.capacity}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {opt.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <span
                          className="font-bold"
                          style={{ color: opt.color }}
                        >
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/ride?type=${opt.type}`}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm text-center transition-all hover:opacity-90 hover:shadow-md"
                    style={{ backgroundColor: opt.color }}
                  >
                    Reservar {opt.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Surge pricing note */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4 items-start">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="font-bold text-orange-800 mb-1">
                Precio dinámico (surge)
              </h4>
              <p className="text-orange-700 text-sm leading-relaxed">
                En horas pico (lun–vie 8–9am y 5–7pm) la tarifa aumenta hasta{' '}
                <strong>1.5×</strong> por alta demanda. Fuera de esas horas
                siempre pagas el precio base.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Transporte Compartido ────────────────────── */}
      {activeTab === 'compartido' && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Transporte Compartido
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Viaja con otros pasajeros que van en la misma dirección. Paga solo
              tu asiento y ahorra hasta un 60%.
            </p>
          </div>

          {/* How shared works */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              ¿Cómo funciona el compartido?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  num: '01',
                  title: 'Solicita tu viaje',
                  desc: 'Ingresa origen y destino. El sistema busca rutas compatibles.',
                },
                {
                  num: '02',
                  title: 'Matching automático',
                  desc: 'Te emparejamos con pasajeros en la misma ruta en tiempo real.',
                },
                {
                  num: '03',
                  title: 'Un conductor, varios pasajeros',
                  desc: 'El conductor realiza máximo 2 paradas adicionales.',
                },
                {
                  num: '04',
                  title: 'Paga tu parte',
                  desc: 'Solo pagas por tu asiento. El sistema divide el costo automáticamente.',
                },
              ].map((step, i) => (
                <div key={step.num} className="text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold mx-auto mb-3"
                    style={{ backgroundColor: '#ff4c41' }}
                  >
                    {step.num}
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {SHARED_FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 shadow-sm"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: '#fff2f2' }}
                >
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing example */}
          <div
            className="rounded-2xl p-8 mb-8 text-white"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            }}
          >
            <h3 className="text-xl font-bold mb-2">Ejemplo de precio</h3>
            <p className="text-gray-400 text-sm mb-6">
              Quito Norte → Centro Histórico (~8 km, ~20 min)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-gray-400 text-xs mb-1">
                  Privado Economy
                </div>
                <div className="text-2xl font-bold text-white">$6.50</div>
                <div className="text-gray-500 text-xs mt-1">
                  vehículo completo
                </div>
              </div>
              <div
                className="rounded-xl p-4 text-center relative border-2"
                style={{ backgroundColor: '#ff4c4122', borderColor: '#ff4c41' }}
              >
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  ✓ Recomendado
                </div>
                <div className="text-gray-300 text-xs mb-1">Compartido</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: '#ff6b60' }}
                >
                  $2.60
                </div>
                <div className="text-gray-500 text-xs mt-1">por pasajero</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-gray-400 text-xs mb-1">Ahorro</div>
                <div className="text-2xl font-bold text-green-400">60%</div>
                <div className="text-gray-500 text-xs mt-1">
                  menos que privado
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/ride?type=shared"
            className="block w-full max-w-sm mx-auto py-4 rounded-2xl text-white font-bold text-center text-lg transition-all hover:shadow-lg hover:opacity-90"
            style={{ backgroundColor: '#ff4c41' }}
          >
            👥 Buscar viaje compartido
          </Link>
        </section>
      )}

      {/* ── Tabla comparativa ───────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Privado vs. Compartido — comparativa
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500 p-4 border-b border-gray-100">
            <div>Característica</div>
            <div className="text-center">🚗 Privado</div>
            <div className="text-center" style={{ color: '#ff4c41' }}>
              👥 Compartido
            </div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 p-4 text-sm ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <div className="font-medium text-gray-700">{row.feature}</div>
              <div className="text-center text-gray-600">{row.private}</div>
              <div
                className="text-center font-semibold"
                style={{ color: '#ff4c41' }}
              >
                {row.shared}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/ride?type=economy"
            className="flex-1 py-3.5 rounded-xl text-white font-bold text-center text-sm transition-all hover:shadow-md"
            style={{ backgroundColor: '#ff4c41' }}
          >
            Reservar viaje privado
          </Link>
          <Link
            href="/ride?type=shared"
            className="flex-1 py-3.5 rounded-xl font-bold text-center text-sm border-2 transition-all hover:shadow-md"
            style={{ borderColor: '#ff4c41', color: '#ff4c41' }}
          >
            Buscar viaje compartido
          </Link>
        </div>
      </section>
    </div>
  );
}
