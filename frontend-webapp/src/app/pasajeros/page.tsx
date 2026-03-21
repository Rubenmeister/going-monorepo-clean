'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ── useInView ─────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── FadeIn ─────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, direction = 'up', className = '' }: {
  children: React.ReactNode; delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none'; className?: string;
}) {
  const { ref, inView } = useInView();
  const t: Record<string, string> = { up: 'translateY(28px)', left: 'translateX(-28px)', right: 'translateX(28px)', none: 'none' };
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : t[direction],
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}


/* ── Service card ──────────────────────────────────────────── */
function ServiceCard({ icon, title, desc, price, highlight }: { icon: string; title: string; desc: string; price?: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: highlight ? '#ff4c41' : '#fff',
        color: highlight ? '#fff' : '#1a1a1a',
        boxShadow: highlight ? '0 8px 40px rgba(255,76,65,0.32)' : '0 2px 16px rgba(0,0,0,0.07)',
        border: highlight ? 'none' : '1px solid #f0f0f0',
      }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <div className="font-extrabold text-lg mb-2">{title}</div>
      <div className="text-sm leading-relaxed mb-3" style={{ color: highlight ? 'rgba(255,255,255,0.85)' : '#666' }}>{desc}</div>
      {price && <div className="text-sm font-bold" style={{ color: highlight ? 'rgba(255,255,255,0.9)' : '#ff4c41' }}>{price}</div>}
    </div>
  );
}

/* ── Step ──────────────────────────────────────────────────── */
function Step({ num, title, desc }: { num: number; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-white text-lg mb-4 flex-shrink-0" style={{ background: '#ff4c41', boxShadow: '0 4px 20px rgba(255,76,65,0.35)' }}>
        {num}
      </div>
      <div className="font-bold text-gray-900 mb-1">{title}</div>
      {desc && <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>}
    </div>
  );
}

/* ── Price card ─────────────────────────────────────────────── */
function PriceCard({ route, shared, private: priv }: { route: string; shared: string; private: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="font-bold text-gray-900 mb-3">{route}</div>
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#fff7f7' }}>
          <div className="text-xs text-gray-500 mb-1">Compartido</div>
          <div className="font-extrabold text-sm" style={{ color: '#ff4c41' }}>{shared}</div>
        </div>
        <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#f9fafb' }}>
          <div className="text-xs text-gray-500 mb-1">Privado</div>
          <div className="font-extrabold text-sm text-gray-800">{priv}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Testimonial ───────────────────────────────────────────── */
function Testimonial({ quote, name, detail }: { quote: string; name: string; detail: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="text-4xl" style={{ color: '#ff4c41' }}>"</div>
      <p className="text-gray-700 leading-relaxed text-sm flex-1">{quote}</p>
      <div>
        <div className="font-bold text-gray-900">{name}</div>
        <div className="text-xs text-gray-400">{detail}</div>
      </div>
    </div>
  );
}

/* ── Feature pill ───────────────────────────────────────────── */
function FeaturePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-5 py-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-white">{text}</span>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function PasajerosPage() {

  return (
    <div className="min-h-screen font-sans antialiased" style={{ color: '#1a1a1a' }}>

      {/* ── HERO DESTINOS ────────────────────────────────────── */}
      <section className="pt-12 pb-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-10">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ff4c41' }}>Explora Ecuador</span>
            <h1 className="text-gray-900 font-black text-5xl mt-2">Destinos</h1>
            <p className="text-gray-500 text-lg mt-4 max-w-2xl mx-auto">
              Desde los Andes hasta las Islas Galápagos — viaja a cualquier rincón del país con Going.
            </p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { region: 'Sierra',    subtitle: 'Andes · Volcanes · Cultura',  img: '/images/Ciclista y Cotopaxi_RAPOSA.jpg', color: '#6366f1' },
              { region: 'Costa',     subtitle: 'Mar · Playas · Atardeceres',  img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85&auto=format&fit=crop', color: '#0ea5e9' },
              { region: 'Amazonía',  subtitle: 'Selva · Biodiversidad · Aventura', img: '/images/Orellana Pañacocha Laguna.jpg', color: '#16a34a' },
              { region: 'Galápagos', subtitle: 'Islas únicas en el mundo',    img: '/images/galàpagos.png', color: '#f59e0b' },
            ].map((d, i) => (
              <FadeIn key={d.region} delay={i * 80}>
                <div className="relative rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer" style={{ aspectRatio: '3/4' }}>
                  <img src={d.img} alt={d.region} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 40%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="w-2.5 h-2.5 rounded-full mb-2" style={{ backgroundColor: d.color }} />
                    <h3 className="text-white font-black text-xl">{d.region}</h3>
                    <p className="text-gray-300 text-xs mt-1">{d.subtitle}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="flex justify-center gap-4">
            <Link href="/auth/register" className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90" style={{ backgroundColor: '#ff4c41' }}>
              Buscar viaje →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── VENTAJAS ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Viajar con Going es diferente</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Diseñamos cada detalle para que tu viaje sea simple, seguro y predecible de principio a fin.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Confirmación instantánea', desc: 'Reserva tu viaje en segundos. Sin esperar respuesta ni incertidumbre de si hay cupo.' },
              { icon: '💳', title: 'Pago seguro con comprobante', desc: 'Paga con tarjeta, transferencia o efectivo. Siempre con factura y registro de la transacción.' },
              { icon: '📍', title: 'Seguimiento GPS en tiempo real', desc: 'Sigue la ubicación de tu conductor en el mapa. Sabes exactamente cuándo llega.' },
              { icon: '📋', title: 'Historial de todos tus viajes', desc: 'Consulta cualquier viaje pasado: fecha, ruta, costo y conductor. Todo en un solo lugar.' },
              { icon: '⭐', title: 'Conductores verificados y calificados', desc: 'Todos los conductores pasan por verificación de identidad, licencia y antecedentes.' },
              { icon: '🛡️', title: 'Seguro incluido en cada viaje', desc: 'Cada trayecto cuenta con cobertura de seguro. Viaja con la tranquilidad que mereces.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 60}>
                <div className="flex items-start gap-4 rounded-2xl p-5" style={{ background: '#f9fafb', border: '1px solid #f0f0f0' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#fff1f0' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">{item.title}</div>
                    <div className="text-sm text-gray-500 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f9fafb' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Todo lo que puedes reservar en Going</h2>
              <p className="text-gray-500">Un solo lugar. Múltiples soluciones de movilidad.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <FadeIn delay={0}><ServiceCard icon="🚗" title="Viajes Compartidos" desc="La forma más económica de viajar entre ciudades. Comparte el vehículo y el costo." price="Desde $3 por trayecto" highlight /></FadeIn>
            <FadeIn delay={80}><ServiceCard icon="🚙" title="Transporte Privado" desc="El vehículo es tuyo. Por trayecto o por días. Ideal para grupos y familias." price="Precio fijo desde el inicio" /></FadeIn>
            <FadeIn delay={160}><ServiceCard icon="📦" title="Envíos Express" desc="Envía paquetes a cualquier ciudad. Tracking en tiempo real incluido." price="Recolección en 30 minutos" /></FadeIn>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FadeIn delay={240}><ServiceCard icon="🏨" title="Alojamiento" desc="Hospedaje verificado en toda la ruta. Desde casas locales a hoteles." /></FadeIn>
            <FadeIn delay={300}><ServiceCard icon="🗺️" title="Tours" desc="Guías locales expertos. Descubre Ecuador con quien la conoce de verdad." /></FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW TO BOOK ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Reserva en 3 pasos</h2>
              <p className="text-gray-500">Sin llamadas, sin filas, sin complicaciones.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative">
            {/* connector lines — desktop only */}
            <div className="hidden md:block absolute top-7 left-1/3 right-1/3 h-px" style={{ background: '#ffd6d4', zIndex: 0 }} />
            <FadeIn delay={0}><Step num={1} title="Ingresa origen y destino" desc="Busca por ciudad o lugar específico. Rutas en todo Ecuador." /></FadeIn>
            <FadeIn delay={120}><Step num={2} title="Elige tipo de servicio" desc="Compartido, privado, envío u otro. Filtra por fecha y hora." /></FadeIn>
            <FadeIn delay={240}><Step num={3} title="Confirma y paga seguro" desc="Tarjeta, transferencia o efectivo. Precio fijo antes de confirmar." /></FadeIn>
          </div>
          <FadeIn delay={360}>
            <div className="rounded-2xl py-5 px-6 text-center" style={{ background: '#fff7f7', border: '1px solid #ffd6d4' }}>
              <p className="font-bold" style={{ color: '#c73b31' }}>
                ¡Listo! Sigue tu viaje en tiempo real desde la app. GPS, notificaciones y más.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Precios transparentes. Sin sorpresas.</h2>
              <p className="text-gray-500">Precio fijo antes de confirmar. Sin cargos ocultos.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <FadeIn delay={0}><PriceCard route="Latacunga ↔ Quito" shared="desde $12" private="desde $18" /></FadeIn>
            <FadeIn delay={60}><PriceCard route="Ambato ↔ Quito" shared="desde $15" private="desde $24" /></FadeIn>
            <FadeIn delay={120}><PriceCard route="Riobamba ↔ Quito" shared="desde $18" private="desde $30" /></FadeIn>
            <FadeIn delay={180}><PriceCard route="Aeropuerto Quito" shared="desde $15" private="desde $38" /></FadeIn>
          </div>
          <FadeIn delay={240}>
            <div className="rounded-2xl py-4 px-6 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-sm font-semibold" style={{ color: '#166534' }}>
                ✓ Precio fijo antes de confirmar. Sin cargos ocultos. Sin tarifas dinámicas.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Lo que dicen quienes ya viajan con Going</h2>
              <p className="text-gray-500">Miles de viajes completados. Historias reales.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FadeIn delay={0}><Testimonial quote="Viajé de Latacunga a Quito 3 veces esta semana. Puntual, cómodo y más barato que el bus ejecutivo." name="Gabriela T." detail="Latacunga" /></FadeIn>
            <FadeIn delay={100}><Testimonial quote="Envié los documentos de mi empresa a Guayaquil en el día. El tracking fue perfecto." name="Marco B." detail="Empresario, Quito" /></FadeIn>
            <FadeIn delay={200}><Testimonial quote="El conductor del aeropuerto esperó mi vuelo retrasado sin cobrar extra. Eso no pasa en taxi." name="Valeria C." detail="Frecuente viajera" /></FadeIn>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD APP ─────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#1a1a1a' }}>
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Lleva Going en tu bolsillo</h2>
            <p className="text-gray-400 mb-10">Disponible para Android. iOS próximamente.</p>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ background: '#16a34a', boxShadow: '0 4px 20px rgba(22,163,74,0.35)' }}
              >
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <div className="text-xs opacity-80">Descargar en</div>
                  <div className="text-base font-extrabold">Google Play</div>
                </div>
              </a>
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', cursor: 'not-allowed' }}>
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <div className="text-xs opacity-60">Próximamente</div>
                  <div className="text-base font-extrabold opacity-60">App Store</div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FeaturePill icon="📋" text="Historial de viajes" />
              <FeaturePill icon="🔔" text="Notificaciones en tiempo real" />
              <FeaturePill icon="💳" text="Paga con tarjeta o efectivo" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#ff4c41' }}>
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Comienza a viajar mejor hoy</h2>
            <p className="text-white mb-10 text-lg" style={{ opacity: 0.88 }}>
              Crea tu cuenta gratis en segundos. Sin tarjeta requerida.
            </p>
            <Link href="/auth/register" className="inline-block px-10 py-4 rounded-2xl font-extrabold text-base transition-all duration-200 hover:opacity-90 active:scale-95" style={{ background: '#fff', color: '#ff4c41', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
              Registrarme gratis →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="py-10 px-6 text-center" style={{ background: '#1a1a1a', color: '#666' }}>
        <Link href="/" className="font-extrabold text-lg mb-2 block" style={{ color: '#ff4c41' }}>Going</Link>
        <p className="text-xs mb-4">Movilidad inteligente en Ecuador</p>
        <div className="flex justify-center gap-6 text-xs">
          <Link href="/legal/terms" className="hover:text-white transition-colors">Términos</Link>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacidad</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contacto</Link>
          <Link href="/conductores" className="hover:text-white transition-colors">Para Conductores</Link>
        </div>
      </footer>
    </div>
  );
}
