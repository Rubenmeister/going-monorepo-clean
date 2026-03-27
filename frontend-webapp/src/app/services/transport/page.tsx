'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   Vehículos privados — Going Ecuador
   ───────────────────────────────────────────── */
const PRIVATE_VEHICLES = [
  {
    id: 'suv',
    icon: '🚙',
    label: 'SUV',
    tagline: 'Espacio y confort',
    desc: 'SUV medianas para mayor comodidad. Ideal para grupos pequeños o equipaje extra.',
    seats: '1–4 pasajeros',
    luggage: '3 maletas',
    color: '#3B82F6',
    badge: null,
    photo: '/images/SUV EN LA CIUDAD NOCHE.png',
  },
  {
    id: 'suvxl',
    icon: '🚐',
    label: 'SUV XL',
    tagline: 'Grupos y equipaje grande',
    desc: 'SUV de mayor tamaño para familias o grupos con bastante equipaje.',
    seats: '1–6 pasajeros',
    luggage: '5 maletas',
    color: '#8B5CF6',
    badge: null,
    photo: '/images/SUV de lujo.png',
  },
  {
    id: 'van',
    icon: '🚌',
    label: 'VAN',
    tagline: 'Grupos medianos',
    desc: 'Furgoneta para grupos medianos, viajes intercantonales o traslados de equipos.',
    seats: '1–9 pasajeros',
    luggage: '6 maletas',
    color: '#F59E0B',
    badge: null,
    photo: '/images/Puerta a puerta entre ciudades.png',
  },
  {
    id: 'vanxl',
    icon: '🚐',
    label: 'VAN XL',
    tagline: 'Grupos grandes con equipaje',
    desc: 'Furgoneta ampliada para grupos más grandes o con mucho equipaje.',
    seats: '1–12 pasajeros',
    luggage: '8 maletas',
    color: '#EF4444',
    badge: null,
    photo: '/images/viaje compartido .png',
  },
  {
    id: 'minibus',
    icon: '🚍',
    label: 'Minibús',
    tagline: 'Excursiones y eventos',
    desc: 'Para excursiones, visitas empresariales o eventos con grupos numerosos.',
    seats: '1–20 pasajeros',
    luggage: 'Bodega incluida',
    color: '#0891B2',
    badge: null,
    photo: '/images/43.png',
  },
  {
    id: 'bus',
    icon: '🚎',
    label: 'Bus',
    tagline: 'Grupos corporativos y tours',
    desc: 'Para grandes grupos, tours intercantonales o necesidades corporativas.',
    seats: '1–40 pasajeros',
    luggage: 'Bodega incluida',
    color: '#DC2626',
    badge: 'Corporativo',
    photo: '/images/42.png',
  },
];

const SHARED_CATEGORIES = [
  {
    id: 'confort',
    icon: '🚙',
    label: 'Confort',
    desc: 'SUV y SUVXL. Viaja cómodo con otros pasajeros en la misma ruta.',
    vehicles: 'SUV / SUV XL',
    color: '#3B82F6',
    bg: '#eff6ff',
    badge: 'Más usado',
  },
  {
    id: 'premium',
    icon: '⭐',
    label: 'Premium',
    desc: 'SUV XL y VAN en rutas de alta demanda. Más espacio, mejor experiencia.',
    vehicles: 'SUV XL / VAN / VAN XL',
    color: '#F59E0B',
    bg: '#fffbeb',
    badge: 'Mayor confort',
  },
];


type Tab = 'privado' | 'compartido' | 'empresa';

export default function TransportPage() {
  const [tab, setTab] = useState<Tab>('privado');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative py-20 px-4 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full bg-white/15">
            🚗 Transporte Going Ecuador
          </span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Transporte para cada<br />necesidad y grupo
          </h1>
          <p className="text-white/85 text-xl max-w-2xl mb-8">
            Desde una SUV para ti solo hasta un bus para 40 personas.
            Privado exclusivo, compartido económico, o corporativo de élite.
          </p>
          <div className="inline-flex bg-white/15 rounded-2xl p-1 gap-1 flex-wrap">
            {(['privado','compartido','empresa'] as Tab[]).map((t, i) => {
              const labels = ['🚗 Privado', '👥 Compartido', '💼 Empresa'];
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-white/80 hover:text-white'
                  }`}>
                  {labels[i]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Privado ── */}
      {tab === 'privado' && (
        <section className="max-w-6xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Transporte Privado</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              El vehículo es exclusivamente para tu grupo. Elige el tamaño que necesitas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {PRIVATE_VEHICLES.map(v => (
              <div key={v.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
                {/* Foto del vehículo */}
                <div className="relative h-44 overflow-hidden">
                  <img src={v.photo} alt={v.label}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {v.badge && (
                    <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-white shadow-sm"
                      style={{ color: v.color }}>
                      {v.badge}
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">{v.label}</h3>
                  <p className="text-sm font-medium mb-2" style={{ color: v.color }}>{v.tagline}</p>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{v.desc}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mb-4">
                    <span className="bg-gray-50 px-2.5 py-1 rounded-full">👥 {v.seats}</span>
                    <span className="bg-gray-50 px-2.5 py-1 rounded-full">🧳 {v.luggage}</span>
                  </div>
                  <Link href={`/ride?type=${v.id}`}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm text-center transition-all hover:opacity-90"
                    style={{ backgroundColor: v.color }}>
                    Reservar {v.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Compartido ── */}
      {tab === 'compartido' && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Transporte Compartido</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Viaja con otros pasajeros que van en la misma dirección. Dos categorías según comodidad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {SHARED_CATEGORIES.map(cat => (
              <div key={cat.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="h-1.5" style={{ backgroundColor: cat.color }} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.label}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{cat.desc}</p>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-5">
                    🚗 Vehículos: <strong>{cat.vehicles}</strong>
                  </div>
                  <div className="rounded-xl p-4 flex items-center mb-5"
                    style={{ backgroundColor: cat.bg }}>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Espera estimada</div>
                      <div className="text-xl font-bold text-gray-700">5–15 min</div>
                    </div>
                  </div>
                  <Link href={`/ride?type=shared&category=${cat.id}`}
                    className="block w-full py-3 rounded-xl text-white font-bold text-sm text-center transition-all hover:opacity-90"
                    style={{ backgroundColor: cat.color }}>
                    Buscar {cat.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">¿Cómo funciona?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { num: '01', title: 'Solicita', desc: 'Ingresa origen y destino.' },
                { num: '02', title: 'Matching', desc: 'Te emparejamos con pasajeros en la misma ruta.' },
                { num: '03', title: 'Máx. 2 paradas', desc: 'El conductor no se desvía mucho.' },
                { num: '04', title: 'Paga tu parte', desc: 'Solo pagas tu asiento.' },
              ].map(s => (
                <div key={s.num} className="text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold mx-auto mb-3"
                    style={{ backgroundColor: '#ff4c41' }}>{s.num}</div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Empresa ── */}
      {tab === 'empresa' && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-10">
            <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
              💼 Servicio Corporativo
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Going para Empresas</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Los mejores conductores, los mejores vehículos, tiempos de espera extendidos.
              El estándar más alto de Going, diseñado para negocios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {[
              { icon: '🏆', title: 'Conductores Elite', desc: 'Top 10% de la flota. Entrenados en protocolo empresarial, bilingüismo y discreción.' },
              { icon: '🚙', title: 'Flota Premium', desc: 'SUV XL, VAN, VAN XL y Bus con mantenimiento certificado y limpieza ejecutiva.' },
              { icon: '⏳', title: 'Espera extendida', desc: 'Hasta 60 minutos sin cargo. Ideal para reuniones, vuelos con escala y eventos.' },
              { icon: '📊', title: 'Facturación centralizada', desc: 'Dashboard con control de gastos, informes mensuales y factura electrónica.' },
              { icon: '🔒', title: 'Privacidad garantizada', desc: 'NDA disponible con conductores. Viajes con máxima confidencialidad.' },
              { icon: '📞', title: 'Coordinador dedicado', desc: 'Un coordinador Going asignado para gestionar reservas, rutas y situaciones especiales.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: '#fff8e1' }}>
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>


          <div className="text-center">
            <a href="mailto:empresas@goingec.com"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#ff4c41' }}>
              💼 Contactar equipo corporativo
            </a>
            <p className="text-gray-400 text-sm mt-3">empresas@goingec.com · Respuesta en menos de 2 horas</p>
          </div>
        </section>
      )}

      {/* ── Ventajas por modalidad ── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">¿Cuál es la mejor opción para ti?</h2>
          <p className="text-gray-500">Tres modalidades de transporte para cada situación y cada viajero.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Compartido */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all">
            <div className="h-2 bg-[#ff4c41]" />
            <div className="p-7 flex-1 flex flex-col">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Viaje Compartido</h3>
              <p className="text-sm text-[#ff4c41] font-semibold mb-4">La forma más inteligente de viajar</p>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  'Comparte el vehículo y el costo del trayecto',
                  'Ideal para rutas intercantonales frecuentes',
                  'Siempre acompañado — nunca viajas solo',
                  'Horarios flexibles con salidas frecuentes',
                  'Conductor verificado y calificado',
                  'Ideal para estudiantes, trabajadores y mochileros',
                ].map(v => (
                  <li key={v} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-[#ff4c41] font-bold mt-0.5">✓</span>{v}
                  </li>
                ))}
              </ul>
              <Link href="/ride?type=shared"
                className="w-full py-3 rounded-xl text-white font-bold text-sm text-center hover:opacity-90 transition-all"
                style={{ backgroundColor: '#ff4c41' }}>
                Buscar viaje compartido →
              </Link>
            </div>
          </div>

          {/* Privado */}
          <div className="bg-gray-900 rounded-3xl overflow-hidden flex flex-col hover:shadow-xl transition-all" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div className="h-2 bg-[#3B82F6]" />
            <div className="p-7 flex-1 flex flex-col">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-black text-white mb-1">Transporte Privado</h3>
              <p className="text-sm text-blue-400 font-semibold mb-4">El vehículo es solo para tu grupo</p>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  'Vehículo exclusivo — sin otros pasajeros',
                  'Elige el tamaño: SUV, VAN, Minibús o Bus',
                  'Perfecto para familias, grupos y viajes de larga distancia',
                  'Reserva anticipada con conductor asignado',
                  'Puntualidad garantizada y puerta a puerta',
                  'Amplia disponibilidad de equipaje',
                ].map(v => (
                  <li key={v} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 font-bold mt-0.5">✓</span>{v}
                  </li>
                ))}
              </ul>
              <Link href="/ride"
                className="w-full py-3 rounded-xl text-gray-900 font-bold text-sm text-center bg-white hover:opacity-90 transition-all">
                Reservar transporte privado →
              </Link>
            </div>
          </div>

          {/* Empresas */}
          <div className="bg-white rounded-3xl border border-yellow-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all">
            <div className="h-2 bg-yellow-400" />
            <div className="p-7 flex-1 flex flex-col">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Transporte para Empresas</h3>
              <p className="text-sm text-yellow-600 font-semibold mb-4">El estándar más alto de Going</p>
              <ul className="space-y-3 flex-1 mb-6">
                {[
                  'Conductores elite — top 10% de la flota Going',
                  'Protocolo empresarial, bilingüismo y discreción',
                  'Hasta 60 min de espera sin cargo adicional',
                  'Facturación centralizada con informe mensual',
                  'Dashboard de control de gastos y aprobaciones',
                  'Coordinador Going dedicado a tu cuenta',
                ].map(v => (
                  <li key={v} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-yellow-500 font-bold mt-0.5">✓</span>{v}
                  </li>
                ))}
              </ul>
              <a href="mailto:empresas@goingec.com"
                className="w-full py-3 rounded-xl font-bold text-sm text-center text-white hover:opacity-90 transition-all block"
                style={{ backgroundColor: '#d97706' }}>
                Contactar equipo corporativo →
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECCIÓN CONDUCTORES ── */}
      <section className="py-0 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ background: '#1a1a1a' }}>
            {/* Foto */}
            <div className="md:w-2/5 flex-shrink-0">
              <img
                src="/images/SUV de lujo.png"
                alt="Conductor Going en Ecuador"
                className="w-full h-full object-cover"
                style={{ minHeight: '380px', maxHeight: '520px' }}
              />
            </div>
            {/* Contenido */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
              <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-full w-fit"
                style={{ backgroundColor: 'rgba(255,76,65,0.18)', color: '#ff4c41', border: '1px solid rgba(255,76,65,0.3)' }}>
                🚗 ¿Eres conductora o conductor?
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Maneja tus tiempos,<br />
                <span style={{ color: '#ff4c41' }}>multiplica tus ingresos</span>
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                Únete a la flota Going. Sin jefes, sin horarios fijos. Tú decides cuándo y cuánto trabajar.
                Ganas el <strong className="text-white">80% de cada viaje</strong>, con pagos garantizados en 24 horas.
              </p>

              {/* Ganancias estimadas */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { plan: 'Part-time', hours: '20 h/sem', range: '$480–$650' },
                  { plan: 'Full-time', hours: '40 h/sem', range: '$900–$1,200', highlight: true },
                  { plan: 'Full-time+', hours: '40 h/sem', range: '$1,400–$1,800' },
                ].map(e => (
                  <div key={e.plan} className="rounded-2xl p-4 text-center"
                    style={{ background: e.highlight ? '#ff4c41' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-xs font-bold text-white/70 uppercase mb-1">{e.plan}</div>
                    <div className="text-xs text-white/50 mb-2">{e.hours}</div>
                    <div className="text-lg font-extrabold text-white">{e.range}</div>
                    <div className="text-xs text-white/60 mt-0.5">por mes est.</div>
                  </div>
                ))}
              </div>

              {/* Requisitos rápidos */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  { icon: '📄', text: 'Cédula de Identidad' },
                  { icon: '🚗', text: 'Licencia tipo B o profesional' },
                  { icon: '📋', text: 'Matrícula (vehículo 2015+)' },
                  { icon: '📋', text: 'Permiso ANT y SOAT vigente' },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{r.icon}</span><span>{r.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/register?rol=driver"
                  className="flex-1 py-3.5 rounded-xl text-white font-bold text-center text-sm hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#ff4c41' }}>
                  Registrarme como conductor →
                </Link>
                <Link href="/auth/login?from=/services/conductores"
                  className="flex-1 py-3.5 rounded-xl font-bold text-center text-sm border border-white/20 text-white hover:bg-white/10 transition-all">
                  Ya soy conductor → Mi panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fotos strip conductores ── */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <img src="/images/43.png" alt="Trabaja cuando quieres" className="w-full rounded-2xl shadow-md object-cover aspect-square" />
          <img src="/images/41.png" alt="Sé parte del equipo Going" className="w-full rounded-2xl shadow-md object-cover aspect-square" />
          <img src="/images/42.png" alt="Sé tu propio jefe" className="w-full rounded-2xl shadow-md object-cover aspect-square" />
        </div>
      </section>

      {/* ── Rutas disponibles ── */}
      <section className="py-10 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Rutas disponibles para conductores</h2>
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">
            <img
              src="/images/nuevas%20rutas.png"
              alt="Nuevas rutas Going — cobertura y expansión de zonas"
              className="w-full object-contain"
              style={{ maxHeight: '520px', background: '#fff' }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
