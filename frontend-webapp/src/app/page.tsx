'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { ReviewsList } from './components/features/rating';

/* ── useInView ──────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, dir = 'up', className = '', style }: { children: React.ReactNode; delay?: number; dir?: 'up' | 'left' | 'right' | 'none'; className?: string; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  const translate = dir === 'up' ? 'translateY(32px)' : dir === 'left' ? 'translateX(-32px)' : dir === 'right' ? 'translateX(32px)' : 'none';
  return (
    <div ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : translate, transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────── */
const SLIDES = [
  { region: 'Sierra', subtitle: 'Andes · Volcanes · Cultura', img: '/images/Ciclista y Cotopaxi_RAPOSA.jpg', color: '#6366f1' },
  { region: 'Costa', subtitle: 'Mar · Playas · Atardeceres', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85&auto=format&fit=crop', color: '#0ea5e9' },
  { region: 'Amazonía', subtitle: 'Selva · Biodiversidad · Aventura', img: '/images/Orellana Pañacocha Laguna.jpg', color: '#16a34a' },
  { region: 'Galápagos', subtitle: 'Islas únicas en el mundo', img: '/images/galàpagos.png', color: '#f59e0b' },
];

const EC_CITIES = ['Quito','Guayaquil','Cuenca','Ambato','Riobamba','Loja','Manta','Portoviejo','Ibarra','Esmeraldas','Machala','Santo Domingo','Latacunga','Tulcán','Babahoyo','Lago Agrio','Tena','Puyo','Macas','Zamora','Guaranda'];

const REGIONS = {
  Sierra: {
    color: '#6366f1',
    destinations: [
      { name: 'Quito', desc: 'Capital histórica', img: '/images/calle venezuela quito.jpg' },
      { name: 'Baños', desc: 'Aventura & termas', img: '/images/baños 7.jpg' },
      { name: 'Riobamba', desc: 'Puerta del Chimborazo', img: '/images/chimborazo desde riobamba.jpg' },
      { name: 'Cotacachi', desc: 'Lago Cuicocha & artesanías', img: '/images/cuicocha.jpg' },
    ],
  },
  Costa: {
    color: '#0ea5e9',
    destinations: [
      { name: 'Guayaquil', desc: 'Puerto principal', img: '/images/GUAYAQUIL DE NOCHE.jpg' },
      { name: 'Manta', desc: 'Cruceros del Pacífico', img: '/images/CRUCEROS MANTA.jpg' },
      { name: 'Salinas', desc: 'Balneario ecuatoriano', img: '/images/Salinas.png' },
      { name: 'Montañita', desc: 'Surf & bohemia', img: '/images/Montañita.png' },
    ],
  },
  Amazonía: {
    color: '#16a34a',
    destinations: [
      { name: 'Tena', desc: 'Cascadas & rafting', img: '/images/AR PN AMAZONÍA19 TENA CASCADAS SAN RAFAEL_0502.JPG' },
      { name: 'Cuyabeno', desc: 'Reserva natural única', img: '/images/Copia de AR PN AMAZONÍA18 CUYABENO CANOA foto0026.jpg' },
      { name: 'Orellana', desc: 'Ríos & biodiversidad', img: '/images/Orellana Pañacocha Laguna.jpg' },
      { name: 'Zamora', desc: 'Fauna & mariposas', img: '/images/AR PN AMAZONIA ZAMORA FAUNA mariposas 0283.JPG' },
    ],
  },
  Galápagos: {
    color: '#f59e0b',
    destinations: [
      { name: 'Santa Cruz', desc: 'Centro de las Islas', img: '/images/GALÁPAGOS PAISAJE  .JPG' },
      { name: 'San Cristóbal', desc: 'La isla capital', img: '/images/AR PN GALÁPAGOS Baquerizo Moreno San Cristóbal2.jpg' },
      { name: 'Isabela', desc: 'Volcanes & tortugas', img: '/images/BUCEO GALÁPAGOS 001.jpg' },
      { name: 'Buceo', desc: 'Vida marina única', img: '/images/GALAPAGOS FAUNA BUCEO 038.jpg' },
    ],
  },
};

const TESTIMONIALS = [
  { name: 'María G.', city: 'Quito', text: 'Going cambió cómo me muevo en la ciudad. Puntual, seguro y más económico que lo que usaba antes.', rating: 5, avatar: '👩' },
  { name: 'Carlos R.', city: 'Guayaquil', text: 'El servicio de envíos es increíble. Mi paquete llegó el mismo día y pude seguirlo en tiempo real.', rating: 5, avatar: '👨' },
  { name: 'Andrea P.', city: 'Cuenca', text: 'Contraté un viaje privado para mi empresa y la experiencia fue de primer nivel. ¡100% recomendado!', rating: 5, avatar: '👩‍💼' },
];

const ACADEMY_COURSES = [
  { title: 'Cómo maximizar tus ganancias como conductora o conductor', level: 'Básico', duration: '45 min', icon: '🚗', color: '#ff4c41' },
  { title: 'Atención al cliente de excelencia', level: 'Intermedio', duration: '1.5 hrs', icon: '⭐', color: '#f59e0b' },
  { title: 'Manejo seguro y eficiente', level: 'Avanzado', duration: '2 hrs', icon: '🛡️', color: '#16a34a' },
];

/* ── LocationInput ──────────────────────────────────────────── */
function LocationInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const filtered = EC_CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase()) && value.length > 0);
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-gray-800 text-sm"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(c => (
            <li key={c} onMouseDown={() => { onChange(c); setOpen(false); }} className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
              📍 {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function HomePage() {
  const { auth } = useMonorepoApp();


  // Carousel
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  // Search
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ from: origin, to: dest, ...(date && { date }), ...(time && { time }) });
    window.location.href = `/ride?${params}`;
  };

  // Destinos
  const [activeRegion, setActiveRegion] = useState<keyof typeof REGIONS>('Sierra');

  return (
    <>
      {/* ── Hero Carousel ─────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh', backgroundColor: '#111' }}>
        {SLIDES.map((s, i) => (
          <div
            key={s.region}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${s.img}')`,
              opacity: i === slide ? 1 : 0,
              transition: 'opacity 1.2s ease',
              transform: i === slide ? 'scale(1.04)' : 'scale(1)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '1.2s, 8s',
            }}
          />
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.8) 100%)' }} />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: '100vh' }}>
          <div className="mb-4">
            <span className="inline-block text-white text-sm font-semibold uppercase tracking-[0.2em] opacity-70 mb-3">Ecuador · {SLIDES[slide].subtitle}</span>
          </div>
          <h1 className="text-white font-black mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.05, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
            {SLIDES[slide].region}
          </h1>
          <p className="text-white text-xl font-light opacity-80 mb-10 tracking-widest uppercase">Nos movemos contigo</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-2xl transition-all hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: '#ff4c41' }}
          >
            Buscar viaje →
          </Link>

          {/* Slide dots */}
          <div className="absolute bottom-10 flex gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className="rounded-full transition-all"
                style={{ width: i === slide ? 28 : 8, height: 8, backgroundColor: i === slide ? '#ff4c41' : 'rgba(255,255,255,0.5)' }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Search Card ───────────────────────────────────── */}
      <section id="search-card" className="relative z-20 max-w-4xl mx-auto px-4" style={{ marginTop: -64 }}>
        <FadeIn>
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-gray-900 font-black text-2xl mb-6 text-center">¿A dónde viajas hoy?</h2>
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">📍 Origen</label>
                  <LocationInput value={origin} onChange={setOrigin} placeholder="Ciudad de origen" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🎯 Destino</label>
                  <LocationInput value={dest} onChange={setDest} placeholder="Ciudad de destino" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">📅 Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-sm text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🕐 Hora</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-sm text-gray-800" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 text-white font-black text-lg rounded-2xl transition-all hover:opacity-90 hover:scale-[1.01] shadow-lg" style={{ backgroundColor: '#ff4c41' }}>
                Buscar viaje →
              </button>
            </form>
          </div>
        </FadeIn>
      </section>

      {/* ── Primeras Rutas Going ──────────────────────────── */}
      <section className="overflow-hidden" style={{ background: '#0f172a' }}>
        <div className="max-w-7xl mx-auto px-6 py-16">

          {/* Mapa visible completo */}
          <FadeIn dir="up" className="mb-12">
            <img
              src="/images/Mapa RUTAS A QUITO.png"
              alt="Rutas a Quito y el Aeropuerto Mariscal Sucre"
              className="w-full rounded-2xl shadow-2xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </FadeIn>

          {/* Info de rutas (debajo del mapa) */}
          <FadeIn dir="up" className="flex flex-col lg:flex-row lg:items-start gap-10">
            {/* Columna izquierda: título + descripción + botón */}
            <div className="lg:w-1/3">
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#ff4c41' }}>Primeras rutas</span>
              <h2 className="text-white font-black leading-tight mb-4" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.4rem)' }}>
                Rutas a Quito<br />y el aeropuerto de Quito
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                Viajes compartidos en <span className="text-white font-bold">SUV</span>, máximo <span className="text-white font-bold">3 pasajeros</span> por vehículo. Salidas <span className="font-bold" style={{ color: '#ff4c41' }}>cada hora</span>, ida y vuelta.
              </p>

              {/* Badges informativos */}
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  🕐 Salidas cada hora
                </span>
                <span className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  🚙 SUV · 3 pasajeros
                </span>
                <span className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  🔄 Ida y vuelta
                </span>
              </div>

              <Link href="/ride?type=shared" className="inline-flex items-center gap-2 text-white font-black px-7 py-3.5 rounded-xl hover:opacity-90 transition-all w-fit" style={{ backgroundColor: '#ff4c41' }}>
                Reservar viaje compartido →
              </Link>
            </div>

            {/* Columna derecha: lista de rutas */}
            <div className="lg:flex-1 space-y-3">
              {[
                { color: '#fb923c', route: 'Santo Domingo — Quito — Aeropuerto', time: '~2 h 45 min' },
                { color: '#60a5fa', route: 'Ambato — Latacunga — Quito — Aeropuerto', time: '~2 h 30 min' },
                { color: '#4ade80', route: 'Ibarra — Quito — Aeropuerto', time: '~2 h 15 min' },
              ].map((r) => (
                <div key={r.route} className="flex items-center gap-4 rounded-xl px-5 py-4" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-white font-semibold text-sm flex-1">{r.route}</span>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{r.time}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* 3 tarjetas de ruta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              {
                color: '#fb923c',
                route: 'Santo Domingo — Quito — Aeropuerto',
                detail: 'Acceso desde la Costa. Vía Calacalí o vía Alóag al centro de Quito y aeropuerto.',
                time: '~2 h 45 min', price: 'Desde $14',
              },
              {
                color: '#60a5fa',
                route: 'Ambato — Latacunga — Quito — Aeropuerto',
                detail: 'Ruta interandina. Conexión directa con la capital y el aeropuerto Mariscal Sucre.',
                time: '~2 h 30 min', price: 'Desde $12',
              },
              {
                color: '#4ade80',
                route: 'Ibarra — Quito — Aeropuerto',
                detail: 'Ruta norte de la Sierra. Directa a Quito y al aeropuerto Mariscal Sucre.',
                time: '~2 h 15 min', price: 'Desde $10',
              },
            ].map((r) => (
              <div key={r.route} className="rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all" style={{ background: '#1e293b' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-white font-black text-sm">{r.route}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{r.detail}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">⏱ {r.time}</span>
                  <span className="font-black text-sm" style={{ color: r.color }}>{r.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 Servicios Estrella ──────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>Nuestros servicios</span>
            <h2 className="text-gray-900 font-black text-4xl mt-2">Todo lo que necesitas para moverte</h2>
            <p className="text-gray-500 text-lg mt-3 max-w-xl mx-auto">Tres servicios diseñados para Ecuador, pensados para ti.</p>
          </FadeIn>

          {/* Viajes Compartidos — fila completa: foto izquierda, texto derecha */}
          <FadeIn delay={0} dir="up" className="mb-8">
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row">
              {/* Foto */}
              <div className="relative md:w-1/2 overflow-hidden" style={{ minHeight: 380 }}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/viaje compartido .png')" }} />
                <span className="absolute top-5 left-5 text-xs font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full z-10" style={{ backgroundColor: '#ff4c41' }}>Más popular</span>
              </div>
              {/* Texto */}
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <h3 className="text-gray-900 font-black text-4xl mb-3">Viajes Compartidos</h3>
                <p className="text-gray-500 text-base mb-6 leading-relaxed">
                  Viaja de ciudad en ciudad en SUV o VAN con otros pasajeros. Reserva desde la app en segundos, sigue tu ruta en tiempo real y paga sin efectivo. Conductoras y conductores verificados, precio fijo.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {[
                    '📲 Reserva desde la app',
                    '📍 Tracking en tiempo real',
                    '💳 Pago sin efectivo',
                    '⭐ Conductoras y conductores verificados',
                    '🔔 Notificaciones al instante',
                    '💬 Chat con la conductora o conductor',
                    '🛡️ Viaje asegurado',
                    '🚙 SUV y VAN disponibles',
                  ].map(f => (
                    <span key={f} className="text-gray-700 text-xs font-medium bg-gray-100 rounded-xl px-3 py-2.5">{f}</span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-400">Desde</span>
                    <span className="text-4xl font-black ml-2" style={{ color: '#ff4c41' }}>$5</span>
                    <span className="text-sm text-gray-400 ml-1">/ persona</span>
                  </div>
                  <Link href="/ride?type=shared" className="flex-1 block text-center text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#ff4c41' }}>
                    Reservar viaje compartido →
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Viajes Privados — foto izquierda, texto derecha */}
          <FadeIn delay={0.1} dir="up" className="mb-8">
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row">
              {/* Foto */}
              <div className="relative md:w-1/2 overflow-hidden" style={{ minHeight: 380 }}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/Viaje privado.png')" }} />
                <span className="absolute top-5 left-5 text-xs font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full z-10 bg-slate-700">Premium</span>
              </div>
              {/* Texto */}
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <h3 className="text-gray-900 font-black text-4xl mb-3">Viajes Privados</h3>
                <p className="text-gray-500 text-base mb-6 leading-relaxed">
                  Reserva un SUV, VAN o bus exclusivo para ti y tu grupo. Agenda por servicio o por día, monitorea la ruta en vivo y comunícate directo con tu conductora o conductor desde la app.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {[
                    '📲 Agendamiento en la app',
                    '🚙 SUV, VAN o bus',
                    '🗺️ Ruta en vivo',
                    '💬 Chat con tu conductora/conductor',
                    '🗓️ Por servicio o por día',
                    '👔 Conductora/conductor dedicado',
                    '📍 Tracking en tiempo real',
                    '🛡️ Viaje asegurado',
                  ].map(f => (
                    <span key={f} className="text-gray-700 text-xs font-medium bg-gray-100 rounded-xl px-3 py-2.5">{f}</span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-400">Desde</span>
                    <span className="text-4xl font-black ml-2 text-gray-900">$25</span>
                    <span className="text-sm text-gray-400 ml-1">/ servicio</span>
                  </div>
                  <Link href="/ride?type=premium" className="flex-1 block text-center text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90 bg-slate-800 hover:bg-slate-700">
                    Contratar transporte privado →
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Envíos — foto izquierda, texto derecha */}
          <FadeIn delay={0.2} dir="up">
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row">
              {/* Foto */}
              <div className="relative md:w-1/2 overflow-hidden" style={{ minHeight: 380 }}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/envìo.png')" }} />
                <span className="absolute top-5 left-5 text-xs font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full z-10" style={{ backgroundColor: '#1e3a8a' }}>Mismo día</span>
              </div>
              {/* Texto */}
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <h3 className="text-gray-900 font-black text-4xl mb-3">Envíos de Paquetes</h3>
                <p className="text-gray-500 text-base mb-6 leading-relaxed">
                  Envía sobres, documentos o paquetes del tamaño de una maleta de mano a cualquier ciudad del Ecuador el mismo día. Cotiza y rastrea tu envío desde la app.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {[
                    '📦 Sobres, documentos y paquetes pequeños',
                    '📲 Cotiza desde la app',
                    '⚡ Entrega mismo día',
                    '📡 Tracking en vivo',
                    '🛡️ Seguro incluido',
                    '💰 Precio justo sin sorpresas',
                    '🔔 Notificación de entrega',
                    '📸 Foto de confirmación',
                  ].map(f => (
                    <span key={f} className="text-gray-700 text-xs font-medium bg-gray-100 rounded-xl px-3 py-2.5">{f}</span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-400">Desde</span>
                    <span className="text-4xl font-black ml-2 text-gray-900">$3</span>
                    <span className="text-sm text-gray-400 ml-1">/ envío</span>
                  </div>
                  <Link href="/envios/cotizar" className="flex-1 block text-center text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#1e3a8a' }}>
                    Enviar un paquete →
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Cómo Funciona ────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #fff5f5, #fff)' }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>Simple y rápido</span>
            <h2 className="text-gray-900 font-black text-4xl mt-2">Cómo funciona Going</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gray-200" />
            {[
              { step: '01', icon: '📍', title: 'Elige origen y destino', desc: 'Ingresa de dónde saldrás y a dónde vas. Te mostramos las mejores opciones disponibles.' },
              { step: '02', icon: '💳', title: 'Confirma y paga', desc: 'Selecciona tu viaje, elige el tipo de servicio y paga de forma segura con tarjeta o efectivo.' },
              { step: '03', icon: '🚗', title: 'Viaja con tracking live', desc: 'Sigue tu viaje en tiempo real desde la app. Tu familia también puede ver tu ubicación.' },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.15} className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-5 mx-auto" style={{ backgroundColor: i === 0 ? '#ff4c41' : i === 1 ? '#1e3a8a' : '#16a34a' }}>
                  <span className="text-4xl">{item.icon}</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinos ─────────────────────────────────────────── */}
      <section id="destinos" className="py-24 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>4 mundos</span>
            <h2 className="text-white font-black text-4xl mt-2">Explora Ecuador con Going</h2>
            <p className="text-gray-400 text-lg mt-3">Cada región, una experiencia única. Going te lleva a todas.</p>
          </FadeIn>

          {/* Region tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {(Object.keys(REGIONS) as (keyof typeof REGIONS)[]).map(r => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className="px-6 py-2.5 rounded-full font-bold text-sm transition-all"
                style={{
                  backgroundColor: activeRegion === r ? REGIONS[r].color : 'transparent',
                  color: activeRegion === r ? '#fff' : '#9ca3af',
                  border: `2px solid ${activeRegion === r ? REGIONS[r].color : '#374151'}`,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Destination cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {REGIONS[activeRegion].destinations.map((d, i) => (
              <FadeIn key={d.name} delay={i * 0.08}>
                <div className="group relative rounded-2xl overflow-hidden cursor-pointer" style={{ height: 220 }}>
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${d.img}')` }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                  <div className="absolute bottom-0 p-4">
                    <h4 className="text-white font-black text-lg">{d.name}</h4>
                    <p className="text-gray-300 text-xs">{d.desc}</p>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-white text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: REGIONS[activeRegion].color }}>Ver viajes</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>Usuarios reales</span>
            <h2 className="text-gray-900 font-black text-4xl mt-2">Lo que dicen nuestros viajeros</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'María G.',
                city: 'Quito',
                photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80&auto=format&fit=crop&face',
                quote: '¡Excelente servicio! Puntual y cómodo. Me sentí muy segura durante todo el viaje.',
              },
              {
                name: 'Carlos R.',
                city: 'Guayaquil',
                photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop&face',
                quote: 'El conductor fue muy profesional y el vehículo impecable. ¡Totalmente recomendado!',
              },
              {
                name: 'Andrea P.',
                city: 'Cuenca',
                photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80&auto=format&fit=crop&face',
                quote: 'Gran experiencia con GOING. Viaje rápido y sin complicaciones. Volvería a usar la app sin dudarlo.',
              },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.12}>
                <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ aspectRatio: '3/4' }}>
                  {/* Photo background */}
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 45%, rgba(0,0,0,0.08) 100%)' }} />
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <p className="text-white font-black text-xl italic mb-1">{t.name} <span className="font-normal not-italic text-gray-300">de {t.city}</span></p>
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} className="w-5 h-5" viewBox="0 0 20 20" fill="#FACC15"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <p className="text-white text-sm leading-relaxed">"{t.quote}"</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Academia Going ───────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-300">Aprende con Going</span>
            <h2 className="text-white font-black text-4xl mt-2">Academia Going</h2>
            <p className="text-blue-200 text-lg mt-3 max-w-lg mx-auto">Capacitaciones gratuitas para conductores y emprendedores del transporte en Ecuador.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {ACADEMY_COURSES.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.1}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
                  <div className="text-4xl mb-4">{c.icon}</div>
                  <h4 className="text-white font-bold text-base mb-2">{c.title}</h4>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: c.color }}>{c.level}</span>
                    <span className="text-blue-300 text-xs">⏱ {c.duration}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center">
            <Link href="/academy" className="inline-flex items-center gap-2 bg-white text-gray-900 font-black px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all text-lg">
              Ver todos los cursos →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Únete a Going (pasajeros) ─────────────────────── */}
      {!auth?.user && (
        <>
          <section className="py-24 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <FadeIn className="text-center mb-16">
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>Para viajeros</span>
                <h2 className="text-gray-900 font-black mt-2 mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>¿Por qué viajar con Going?</h2>
                <p className="text-gray-500 text-xl max-w-2xl mx-auto">Seguridad, comodidad y precio claro en cada viaje. Descubre por qué miles de ecuatorianos ya usan Going.</p>
              </FadeIn>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
                {[
                  { icon: '🛡️', title: 'Viaja Seguro', desc: 'Antes de subir, ve el perfil de la conductora o conductor, la foto del vehículo y las calificaciones de otros viajeros. Tu trayecto queda registrado de inicio a fin.' },
                  { icon: '⭐', title: 'Conductoras y Conductores Confiables', desc: 'Cada conductora y conductor tiene calificaciones reales. Sabes quién te lleva y en qué carro viajarás antes de confirmar tu viaje.' },
                  { icon: '💰', title: 'Precio Claro, Sin Sorpresas', desc: 'La app te muestra el precio antes de confirmar. Sin negociar, sin cambios inesperados al final del recorrido.' },
                  { icon: '⚡', title: 'Rápido y Fácil', desc: 'Abre Going, escribe tu destino y en segundos tienes tu viaje en camino. Pedir transporte nunca fue tan simple.' },
                  { icon: '✈️', title: 'Aeropuerto & Viajes Largos', desc: 'Organiza tu traslado al aeropuerto o a otra ciudad con anticipación. Llega a tiempo, sin el estrés de buscar transporte de último minuto.' },
                  { icon: '👑', title: 'Servicio VIP Disponible', desc: 'Para reuniones importantes, eventos especiales o cuando quieres viajar con más comodidad. Elige el nivel de servicio que necesitas.' },
                  { icon: '📍', title: 'Tracking en Tiempo Real', desc: 'Sigue tu ruta en vivo desde la app. Tu familia también puede ver dónde estás durante el trayecto.' },
                  { icon: '🤝', title: 'Apoya la Comunidad Local', desc: 'Cada viaje genera ingresos para conductoras y conductores ecuatorianos de tu propia comunidad. Moverse con Going también es apoyar lo nuestro.' },
                  { icon: '📞', title: 'Soporte Siempre Disponible', desc: 'Nuestro equipo está listo para ayudarte ante cualquier duda, objeto olvidado o inconveniente. No estás sola ni solo en ningún viaje.' },
                ].map((b, i) => (
                  <FadeIn key={b.title} delay={i * 0.05}>
                    <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                      <span className="text-3xl flex-shrink-0 mt-0.5">{b.icon}</span>
                      <div>
                        <h4 className="font-black text-gray-900 text-base mb-1.5">{b.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn className="text-center">
                <p className="text-gray-400 text-base mb-6 italic">"Tu tranquilidad es lo primero. Con Going, cada viaje está pensado para que llegues seguro a tu destino."</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all hover:opacity-90 hover:scale-105 shadow-xl" style={{ backgroundColor: '#ff4c41' }}>
                    Registrarme gratis →
                  </Link>
                  <Link href="/auth/login" className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-gray-50 transition-all">
                    Ya tengo cuenta
                  </Link>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── Únete como Conductor ───────────────────────── */}
          <section className="py-24 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)' }}>
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-12 items-center">
                {/* Foto grande */}
                <FadeIn dir="left" className="md:w-1/2 w-full">
                  <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: 500 }}>
                    <div className="w-full bg-cover bg-center bg-top" style={{ backgroundImage: "url('/images/Conductor Gong.jpg')", minHeight: 500 }} />
                  </div>
                </FadeIn>
                {/* Beneficios */}
                <FadeIn dir="right" className="md:w-1/2 w-full">
                  <span className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-3 block">Para conductoras y conductores</span>
                  <h2 className="text-white font-black leading-tight mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                    Conduce con libertad.<br />Crece con Going.
                  </h2>
                  <p className="text-blue-200 text-lg mb-8 leading-relaxed">
                    Tu vehículo es una oportunidad. Únete a la comunidad Going y genera ingresos con total flexibilidad.
                  </p>
                  <ul className="space-y-4 mb-10">
                    {[
                      { icon: '🚗', text: 'Más viajes: conéctate y recibe solicitudes en tu zona' },
                      { icon: '🕐', text: 'Horarios flexibles: trabaja cuando quieras y como quieras' },
                      { icon: '💵', text: 'Pagos claros y transparentes, sin confusiones ni sorpresas' },
                      { icon: '🛡️', text: 'Viajes registrados: mayor respaldo y seguridad en cada trayecto' },
                      { icon: '⭐', text: 'Calificaciones que construyen tu reputación' },
                      { icon: '🎓', text: 'Academia Going: capacitación gratuita para conductoras y conductores' },
                      { icon: '🤝', text: 'Comunidad y soporte del equipo Going cuando lo necesites' },
                    ].map((item) => (
                      <li key={item.text} className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                        <span className="text-blue-100 text-base leading-relaxed">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/conductores" className="inline-flex items-center gap-2 bg-white text-gray-900 font-black px-8 py-4 rounded-2xl text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl">
                    Unirme como conductora/conductor →
                  </Link>
                </FadeIn>
              </div>
            </div>
          </section>

          {/* ── REVIEWS / VALORACIONES ── */}
          <ReviewsList />
        </>
      )}
    </>
  );
}
