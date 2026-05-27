'use client';

import { useState, useEffect, useRef, type ReactElement } from 'react';
import Link from 'next/link';
import { useIsAuthenticated } from '@/lib/providers/auth-client';
import { ReviewsList } from './components/features/rating';
import { COLORS } from './components/design-tokens';
import {
  IconClock, IconSuv, IconVan, IconRoundTrip, IconPin, IconCard, IconCar, IconMobile,
  IconStar, IconBell, IconChat, IconShield, IconMap, IconCalendar, IconUser,
  IconPackage, IconLightning, IconSignal, IconMoney, IconCamera, IconArrowRight,
  IconSearch, IconUsers, IconCheckCircle, IconGraduation, IconRoute, IconPhone,
  IconHeadphones, IconBook, IconChevronDown, IconGooglePlay, IconApple,
  IconQrCode, IconDownload,
} from './components/icons';

// Links de descarga oficiales — actualizar cuando estén publicados.
// Android live: usa el package name @rubenmeister/going-mobile (Play Console).
// iOS pendiente: requiere Apple Developer account ($99/año), aún no submitted.
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.thornai.goingmobile';
const APP_STORE_URL  = '#';
const APP_STORE_AVAILABLE = false;

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

/* ── iPhone mockup ─────────────────────────────────────────
   Marco iPhone CSS-puro con UI mockeada de la app Going viajando.
   Sin imagen externa: todo SVG + divs. Refuerza la idea "el producto
   es una app móvil" en lugar de mostrar una foto de stock.
*/
function PhoneMockup() {
  return (
    <div
      className="relative"
      style={{ width: 280, height: 580 }}
    >
      {/* Frame exterior (negro mate, simula chasis iPhone) */}
      <div
        className="absolute inset-0 rounded-[44px] shadow-2xl"
        style={{
          backgroundColor: '#0a0a0a',
          padding: 10,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.06)',
        }}
      >
        {/* Pantalla interior */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 34,
          }}
        >
          {/* Notch */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
            style={{
              width: 100, height: 22,
              backgroundColor: '#0a0a0a',
              borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
            }}
          />
          {/* Status bar fake */}
          <div className="absolute top-1.5 left-0 right-0 px-6 flex items-center justify-between text-[10px] font-bold text-gray-800 z-20">
            <span>08:30</span>
            <span className="ml-auto inline-flex items-center gap-1">
              <span className="w-1 h-1.5 rounded-sm bg-gray-800" />
              <span className="w-1.5 h-2 rounded-sm bg-gray-800" />
              <span className="w-1.5 h-2.5 rounded-sm bg-gray-800" />
              <svg width="14" height="10" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M2 22h20V8L12 2 2 8z" /></svg>
              <svg width="18" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-1"><rect x="2" y="6" width="18" height="12" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>
            </span>
          </div>

          {/* App content */}
          <div className="absolute inset-0 pt-8 pb-3 px-3 flex flex-col gap-3">
            {/* App header con logo + estado */}
            <div className="flex items-center justify-between px-2 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.brand.red }}>
                  <IconCar size={14} className="text-white" />
                </span>
                <span className="font-black text-sm text-gray-900" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>Going</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                EN RUTA
              </span>
            </div>

            {/* Mini "map" simulated */}
            <div
              className="rounded-2xl flex-1 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #E0F2FE, #DBEAFE)' }}
            >
              {/* Route line */}
              <svg width="100%" height="100%" viewBox="0 0 200 240" preserveAspectRatio="none" className="absolute inset-0">
                <path d="M 40 30 Q 100 100 80 140 T 160 210" stroke={COLORS.brand.red} strokeWidth="3" fill="none" strokeDasharray="6 4" />
                <circle cx="40" cy="30" r="6" fill={COLORS.brand.red} />
                <circle cx="160" cy="210" r="6" fill={COLORS.brand.blue} />
              </svg>
              {/* Pin origen badge */}
              <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-white shadow text-[9px] font-bold text-gray-700">QUITO</div>
              {/* Pin destino badge */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-white shadow text-[9px] font-bold text-gray-700">AMBATO</div>

              {/* Car marker en medio */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: COLORS.brand.red }}>
                <IconCar size={18} className="text-white" />
              </div>
            </div>

            {/* Driver card */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
                <IconUser size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">Pablo M.</p>
                <p className="text-[10px] text-gray-500">SUV blanco · PBA-1234</p>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: COLORS.brand.yellowDark }}>
                <IconStar size={10} />
                4.9
              </div>
            </div>

            {/* CTA bar */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Total</p>
                <p className="text-base font-black" style={{ color: COLORS.brand.red }}>$10.00</p>
              </div>
              <button className="text-[10px] font-bold text-white px-4 py-2 rounded-xl" style={{ backgroundColor: COLORS.brand.red }}>
                Pagar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────── *
 * REGIONS son las 4 regiones turísticas de Ecuador. Los colores acá NO son
 * de marca Going — son tokens de identidad geográfica (Sierra=morado andino,
 * Costa=azul mar, Amazonía=verde selva, Galápagos=ámbar). Es legítimo que
 * estén fuera de la paleta de marca.
 *
 * El antiguo carousel de SLIDES del hero quedó obsoleto cuando el hero se
 * reorientó a transporte (la marca es sobre movimiento, no turismo —
 * Branding Guidelines 2024). El listado regional ahora vive solo en la
 * sección #destinos más abajo.
 */
const REGIONS = {
  Sierra: {
    color: '#6366F1',
    destinations: [
      { name: 'Quito',      desc: 'Capital histórica',           img: '/images/calle venezuela quito.jpg' },
      { name: 'Baños',      desc: 'Aventura y termas',           img: '/images/baños 7.jpg' },
      { name: 'Riobamba',   desc: 'Puerta del Chimborazo',       img: '/images/chimborazo desde riobamba.jpg' },
      { name: 'Cotacachi',  desc: 'Lago Cuicocha y artesanías',  img: '/images/cuicocha.jpg' },
    ],
  },
  Costa: {
    color: '#0EA5E9',
    destinations: [
      { name: 'Guayaquil',  desc: 'Puerto principal',            img: '/images/GUAYAQUIL DE NOCHE.jpg' },
      { name: 'Manta',      desc: 'Cruceros del Pacífico',       img: '/images/CRUCEROS MANTA.jpg' },
      { name: 'Salinas',    desc: 'Balneario ecuatoriano',       img: '/images/Salinas.png' },
      { name: 'Montañita',  desc: 'Surf y bohemia',              img: '/images/Montañita.png' },
    ],
  },
  Amazonía: {
    color: '#16A34A',
    destinations: [
      { name: 'Tena',       desc: 'Cascadas y rafting',          img: '/images/AR PN AMAZONÍA19 TENA CASCADAS SAN RAFAEL_0502.JPG' },
      { name: 'Cuyabeno',   desc: 'Reserva natural única',       img: '/images/Copia de AR PN AMAZONÍA18 CUYABENO CANOA foto0026.jpg' },
      { name: 'Orellana',   desc: 'Ríos y biodiversidad',        img: '/images/Orellana Pañacocha Laguna.jpg' },
      { name: 'Zamora',     desc: 'Fauna y mariposas',           img: '/images/AR PN AMAZONIA ZAMORA FAUNA mariposas 0283.JPG' },
    ],
  },
  Galápagos: {
    color: '#F59E0B',
    destinations: [
      { name: 'Santa Cruz',     desc: 'Centro de las Islas',     img: '/images/GALÁPAGOS PAISAJE  .JPG' },
      { name: 'San Cristóbal',  desc: 'La isla capital',         img: '/images/AR PN GALÁPAGOS Baquerizo Moreno San Cristóbal2.jpg' },
      { name: 'Isabela',        desc: 'Volcanes y tortugas',     img: '/images/BUCEO GALÁPAGOS 001.jpg' },
      { name: 'Buceo',          desc: 'Vida marina única',       img: '/images/GALAPAGOS FAUNA BUCEO 038.jpg' },
    ],
  },
};

interface AcademyCourse {
  title: string;
  level: string;
  duration: string;
  Icon: (props: { size?: number; className?: string }) => ReactElement;
  iconColor: string;
}

const ACADEMY_COURSES: AcademyCourse[] = [
  { title: 'Cómo maximizar tus ganancias como conductora o conductor', level: 'Básico',     duration: '45 min',  Icon: IconCar,    iconColor: COLORS.brand.red },
  { title: 'Atención al cliente de excelencia',                         level: 'Intermedio', duration: '1.5 hrs', Icon: IconStar,   iconColor: COLORS.brand.red },
  { title: 'Manejo seguro y eficiente',                                 level: 'Avanzado',   duration: '2 hrs',   Icon: IconShield, iconColor: COLORS.brand.blue },
];

/* ── Features data — ahora con Component icon ──────────────── */
interface Feature {
  Icon: (props: { size?: number; className?: string }) => ReactElement;
  text: string;
}

const SHARED_FEATURES: Feature[] = [
  { Icon: IconMobile,    text: 'Reserva desde la app' },
  { Icon: IconPin,       text: 'Tracking en tiempo real' },
  { Icon: IconCard,      text: 'Pago sin efectivo' },
  { Icon: IconStar,      text: 'Conductoras y conductores verificados' },
  { Icon: IconBell,      text: 'Notificaciones al instante' },
  { Icon: IconChat,      text: 'Chat con la conductora o conductor' },
  { Icon: IconShield,    text: 'Viaje asegurado' },
  { Icon: IconSuv,       text: 'SUV y VAN disponibles' },
];

const PRIVATE_FEATURES: Feature[] = [
  { Icon: IconMobile,    text: 'Agendamiento en la app' },
  { Icon: IconSuv,       text: 'SUV, VAN o bus' },
  { Icon: IconMap,       text: 'Ruta en vivo' },
  { Icon: IconChat,      text: 'Chat con tu conductora/conductor' },
  { Icon: IconCalendar,  text: 'Por servicio o por día' },
  { Icon: IconUser,      text: 'Conductora/conductor dedicado' },
  { Icon: IconPin,       text: 'Tracking en tiempo real' },
  { Icon: IconShield,    text: 'Viaje asegurado' },
];

const PARCEL_FEATURES: Feature[] = [
  { Icon: IconPackage,   text: 'Sobres, documentos y paquetes pequeños' },
  { Icon: IconMobile,    text: 'Cotiza desde la app' },
  { Icon: IconLightning, text: 'Entrega mismo día' },
  { Icon: IconSignal,    text: 'Tracking en vivo' },
  { Icon: IconShield,    text: 'Seguro incluido' },
  { Icon: IconMoney,     text: 'Precio justo sin sorpresas' },
  { Icon: IconBell,      text: 'Notificación de entrega' },
  { Icon: IconCamera,    text: 'Foto de confirmación' },
];

interface Benefit {
  Icon: (props: { size?: number; className?: string }) => ReactElement;
  title: string;
  desc: string;
}

const TRAVELER_BENEFITS: Benefit[] = [
  { Icon: IconShield,   title: 'Viaja Seguro',                              desc: 'Antes de subir, ve el perfil de la conductora o conductor, la foto del vehículo y las calificaciones de otros viajeros. Tu trayecto queda registrado de inicio a fin.' },
  { Icon: IconStar,     title: 'Conductoras y Conductores Confiables',      desc: 'Cada conductora y conductor tiene calificaciones reales. Sabes quién te lleva y en qué carro viajarás antes de confirmar tu viaje.' },
  { Icon: IconMoney,    title: 'Precio Claro, Sin Sorpresas',               desc: 'La app te muestra el precio antes de confirmar. Sin negociar, sin cambios inesperados al final del recorrido.' },
  { Icon: IconLightning,title: 'Rápido y Fácil',                            desc: 'Abre Going, escribe tu destino y en segundos tienes tu viaje en camino. Pedir transporte nunca fue tan simple.' },
  { Icon: IconRoute,    title: 'Aeropuerto y Viajes Largos',                desc: 'Organiza tu traslado al aeropuerto o a otra ciudad con anticipación. Llega a tiempo, sin el estrés de buscar transporte de último minuto.' },
  { Icon: IconUser,     title: 'Servicio VIP Disponible',                   desc: 'Para reuniones importantes, eventos especiales o cuando quieres viajar con más comodidad. Elige el nivel de servicio que necesitas.' },
  { Icon: IconPin,      title: 'Tracking en Tiempo Real',                   desc: 'Sigue tu ruta en vivo desde la app. Tu familia también puede ver dónde estás durante el trayecto.' },
  { Icon: IconUsers,    title: 'Apoya la Comunidad Local',                  desc: 'Cada viaje genera ingresos para conductoras y conductores ecuatorianos de tu propia comunidad. Moverse con Going también es apoyar lo nuestro.' },
  { Icon: IconPhone,    title: 'Soporte Siempre Disponible',                desc: 'Nuestro equipo está listo para ayudarte ante cualquier duda, objeto olvidado o inconveniente. No estás sola ni solo en ningún viaje.' },
];

interface DriverPerk {
  Icon: (props: { size?: number; className?: string }) => ReactElement;
  text: string;
}

const DRIVER_PERKS: DriverPerk[] = [
  { Icon: IconCar,        text: 'Más viajes: conéctate y recibe solicitudes en tu zona' },
  { Icon: IconClock,      text: 'Horarios flexibles: trabaja cuando quieras y como quieras' },
  { Icon: IconMoney,      text: 'Pagos claros y transparentes, sin confusiones ni sorpresas' },
  { Icon: IconShield,     text: 'Viajes registrados: mayor respaldo y seguridad en cada trayecto' },
  { Icon: IconStar,       text: 'Calificaciones que construyen tu reputación' },
  { Icon: IconGraduation, text: 'Academia Going: capacitación gratuita para conductoras y conductores' },
  { Icon: IconHeadphones, text: 'Comunidad y soporte del equipo Going cuando lo necesites' },
];

/* ── Main Page ──────────────────────────────────────────────── */
export default function HomePage() {
  // Fuente de verdad: el store de auth (vía useIsAuthenticated). Devuelve
  // false durante SSR y antes de hidratar para evitar mismatch.
  const isLoggedIn = useIsAuthenticated();

  // Destinos
  const [activeRegion, setActiveRegion] = useState<keyof typeof REGIONS>('Sierra');

  return (
    <>
      {/* ══ HERO Going — Transporte primero, no turismo ════════════════════════
         La marca Going es sobre MOVIMIENTO y transporte compartido (guía
         oficial 2024). El hero anterior era un carousel de paisajes de Ecuador
         que se sentía como sitio de turismo. Esta versión deja claro desde la
         primera mirada: viaje compartido, ruta, conductoras y conductores.
      */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${COLORS.brand.black} 0%, #1a1a1a 50%, ${COLORS.brand.red} 130%)`,
        }}
      >
        {/* Patrón sutil de vías de fondo (alusión a "patrón de vías y tejido
            urbano" mencionado en la guía de marca p.12). */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-20 flex flex-col items-center" style={{ minHeight: '100vh' }}>

          {/* ── HEAD del hero: logo + tagline + subtítulo ── */}
          <FadeIn dir="up" className="text-white text-center max-w-3xl mb-10">
            <img
              src="/going-logo-white-h.png"
              alt="Going"
              className="h-12 mx-auto mb-6"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
            />

            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: COLORS.brand.yellow }}>
              <IconMobile size={14} />
              App de transporte · Ecuador
            </span>

            <h1 className="font-black mb-4 leading-[0.95]" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
              Nos movemos <span style={{ color: COLORS.brand.red }}>contigo.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Descargá <strong className="text-white">Going</strong> y reservá tu viaje compartido,
              privado o un envío entre ciudades del Ecuador. Conductoras y conductores
              verificados, tracking en vivo y precio fijo desde el teléfono o la web.
            </p>
          </FadeIn>

          {/* ── 3 PRODUCTOS PRINCIPALES — corazón del hero ──
             El user reportó que el hero no mostraba los productos. Ahora
             las 3 cards son el elemento visual central, prominentes,
             con CTA clara cada una. Esto es lo que define qué es Going.
          */}
          <FadeIn dir="up" delay={0.15} className="w-full max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

              {/* CARD 1: Viaje Compartido */}
              <Link
                href="/ride?type=shared"
                className="group bg-white rounded-3xl p-6 flex flex-col text-left shadow-2xl hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(255,76,65,0.4)] transition-all relative overflow-hidden"
              >
                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: COLORS.brand.red }}>
                  Más popular
                </span>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
                  <IconSuv size={30} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                  Viaje Compartido
                </h3>
                <p className="text-xs text-gray-500 mb-4 flex-1">
                  De ciudad en ciudad, en SUV o VAN, pagás solo tu asiento.
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Desde</span>
                    <p className="text-2xl font-black" style={{ color: COLORS.brand.red, fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                      $10<span className="text-xs text-gray-400 font-normal ml-1">/persona</span>
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform" style={{ backgroundColor: COLORS.brand.red }}>
                    <IconArrowRight size={16} />
                  </span>
                </div>
              </Link>

              {/* CARD 2: Viaje Privado */}
              <Link
                href="/ride?type=van"
                className="group bg-white rounded-3xl p-6 flex flex-col text-left shadow-2xl hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(255,210,83,0.4)] transition-all relative overflow-hidden"
              >
                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.brand.yellow, color: COLORS.brand.black }}>
                  Premium
                </span>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.brand.yellowBg, color: COLORS.brand.yellowDark }}>
                  <IconVan size={30} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                  Viaje Privado
                </h3>
                <p className="text-xs text-gray-500 mb-4 flex-1">
                  SUV, VAN o bus exclusivo para vos y tu grupo, por servicio o por día.
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Desde</span>
                    <p className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                      $25<span className="text-xs text-gray-400 font-normal ml-1">/servicio</span>
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center group-hover:translate-x-0.5 transition-transform" style={{ backgroundColor: COLORS.brand.yellow, color: COLORS.brand.black }}>
                    <IconArrowRight size={16} />
                  </span>
                </div>
              </Link>

              {/* CARD 3: Envíos */}
              <Link
                href="/envios/cotizar"
                className="group bg-white rounded-3xl p-6 flex flex-col text-left shadow-2xl hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,0.4)] transition-all relative overflow-hidden"
              >
                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: COLORS.brand.black }}>
                  Mismo día
                </span>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.gray[100], color: COLORS.brand.black }}>
                  <IconPackage size={30} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                  Envíos
                </h3>
                <p className="text-xs text-gray-500 mb-4 flex-1">
                  Sobres, documentos o paquetes de puerta a puerta, dentro de Ecuador.
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Desde</span>
                    <p className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                      $8<span className="text-xs text-gray-400 font-normal ml-1">/paquete</span>
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform" style={{ backgroundColor: COLORS.brand.black }}>
                    <IconArrowRight size={16} />
                  </span>
                </div>
              </Link>

            </div>
          </FadeIn>

          {/* ── Download / Web CTAs ──
             Bandera secundaria: cómo accedés. Los 3 productos arriba ya
             son los CTAs principales; acá ofrecemos los CANALES (app o web).
          */}
          <FadeIn dir="up" delay={0.3} className="flex flex-col items-center gap-4 mb-6">
            <p className="text-xs text-white/60 font-bold uppercase tracking-[0.25em]">
              Disponible en
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-gray-900 hover:scale-[1.03] transition-all shadow-xl"
              >
                <IconGooglePlay size={26} />
                <span className="text-left">
                  <span className="block text-[10px] font-medium uppercase tracking-wider opacity-70">Disponible en</span>
                  <span className="block font-black text-sm leading-none">Google Play</span>
                </span>
              </a>
              {APP_STORE_AVAILABLE ? (
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-gray-900 hover:scale-[1.03] transition-all shadow-xl"
                >
                  <IconApple size={26} />
                  <span className="text-left">
                    <span className="block text-[10px] font-medium uppercase tracking-wider opacity-70">Descargar en</span>
                    <span className="block font-black text-sm leading-none">App Store</span>
                  </span>
                </a>
              ) : (
                <span
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-white/20 text-white/60 cursor-not-allowed"
                  title="App Store iOS estará disponible próximamente"
                >
                  <IconApple size={26} />
                  <span className="text-left">
                    <span className="block text-[10px] font-medium uppercase tracking-wider opacity-70">Próximamente en</span>
                    <span className="block font-black text-sm leading-none">App Store</span>
                  </span>
                </span>
              )}
              <span className="text-white/40 text-xs hidden sm:inline mx-2">o</span>
              <Link
                href="/ride"
                className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors underline underline-offset-4 decoration-white/30 px-2"
              >
                Reservá desde la web
                <IconArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>

          {/* Trust badges abajo */}
          <FadeIn dir="up" delay={0.4} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/70 mb-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,210,83,0.2)', color: COLORS.brand.yellow }}>
                <IconShield size={14} />
              </span>
              Conductoras y conductores verificados
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,210,83,0.2)', color: COLORS.brand.yellow }}>
                <IconPin size={14} />
              </span>
              Tracking en vivo
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,210,83,0.2)', color: COLORS.brand.yellow }}>
                <IconCard size={14} />
              </span>
              Pago sin efectivo
            </span>
          </FadeIn>

          {/* Indicador scroll */}
          <div className="flex items-center gap-2 text-xs text-white/50 mt-auto">
            <span>Conocé Ecuador con Going</span>
            <IconChevronDown size={16} />
          </div>
        </div>
      </section>

      {/* ══ COBERTURA — chips de ciudades ════════════════════════════════════
         Muestra concretamente dónde opera Going. Refuerza la idea de
         "interurbano Ecuador" sin necesidad de mirar el mapa.
      */}
      <section className="bg-white border-y border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap flex-shrink-0">
              Cobertura · 15 ciudades del Ecuador
            </span>
            <div className="flex flex-wrap gap-2 flex-1">
              {[
                'Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Riobamba',
                'Ibarra', 'Otavalo', 'Latacunga', 'Salcedo', 'Cayambe',
                'Tabacundo', 'Atuntaqui', 'Santo Domingo', 'La Concordia', 'El Carmen',
              ].map(city => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-red-50"
                  style={{ backgroundColor: COLORS.gray[50], color: COLORS.gray[700], border: `1px solid ${COLORS.gray[200]}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.brand.red }} />
                  {city}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.brand.yellowBg, color: COLORS.brand.yellowDark }}>
                + Aeropuerto Mariscal Sucre
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ STATS EN VIVO ════════════════════════════════════════════════════
         Cifras que transmiten que la plataforma está activa. Valores
         demo plausibles hasta que tengamos métricas reales conectadas al
         backend; cuando estén disponibles, reemplazar por fetch a
         /analytics/kpis/current.
      */}
      <section className="bg-gray-50 py-12 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>
              Going en números
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
              Una red viva, todos los días
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: '15+',  label: 'Ciudades cubiertas',                    sub: 'Sierra, Costa y Amazonía' },
              { value: '4.9',  label: 'Calificación promedio',                 sub: 'De 5 estrellas en viajes Going', accent: COLORS.brand.yellow },
              { value: '24/7', label: 'Soporte humano + IA',                   sub: 'Cuando lo necesites' },
              { value: '< 5m', label: 'Tiempo promedio de respuesta',          sub: 'Desde que pedís tu viaje' },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: stat.accent ?? COLORS.brand.red, fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">{stat.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIOS MINI — carousel auto ═════════════════════════════════
         Banda compacta con 3 testimonios visibles. En lugar de un carousel
         con dots (que requiere interacción), mostramos los 3 al mismo
         tiempo en desktop y rotamos en mobile.
      */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { stars: 5, name: 'María G.', role: 'Pasajera frecuente · Quito → Ambato', text: 'Salidas cada hora, precio fijo y conductora amable. Cambié para siempre el bus interprovincial.' },
              { stars: 5, name: 'Carlos R.', role: 'Conductor Going · Sierra Norte',     text: 'Ingresos predecibles, app fácil y nada de efectivo. Recomendado a 3 colegas y todos se sumaron.' },
              { stars: 5, name: 'Ana T.',    role: 'Anfitriona · Mindo',                 text: 'Mis huéspedes piden el traslado desde el aeropuerto por la app. Cero stress, todo gestionado.' },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="bg-gray-50 rounded-2xl p-5 h-full border border-gray-100">
                  <div className="flex items-center gap-1 mb-3" style={{ color: COLORS.brand.yellow }}>
                    {Array.from({ length: t.stars }).map((_, idx) => (
                      <IconStar key={idx} size={14} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search Card — "también sin app" ───────────────── *
         Posicionada como alternativa al download. Quien entra desde
         desktop o quiere reservar rápido sin instalar, puede hacerlo
         desde la webapp con la misma cuenta Going.
      */}
      <section id="search-card" className="relative z-20 max-w-4xl mx-auto px-4 -mt-12 mb-16">
        <FadeIn>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.brand.red }}>
              También desde el navegador
            </p>
            <h2 className="text-gray-900 font-black text-xl sm:text-2xl mb-1">¿A dónde viajas hoy?</h2>
            <p className="text-gray-500 text-sm mb-5">Reservá un viaje sin descargar nada. Tu cuenta funciona en app y web.</p>
            <Link
              href="/ride"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-white font-black rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
              style={{ backgroundColor: COLORS.brand.red }}
            >
              <IconSearch size={18} />
              Buscar viaje en la web
              <IconArrowRight size={18} />
            </Link>
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
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: COLORS.brand.red }}>Primeras rutas</span>
              <h2 className="text-white font-black leading-tight mb-4" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.4rem)' }}>
                Rutas a Quito<br />y su Aeropuerto
              </h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                Viajes compartidos en <span className="text-white font-bold">SUV</span>, máximo <span className="text-white font-bold">3 pasajeros</span> por vehículo. Salidas <span className="font-bold" style={{ color: COLORS.brand.red }}>cada hora</span>, ida y vuelta.
              </p>

              {/* Badges informativos */}
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <IconClock size={14} />
                  Salidas cada hora
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <IconSuv size={14} />
                  SUV · 3 pasajeros
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <IconRoundTrip size={14} />
                  Ida y vuelta
                </span>
              </div>

              <Link href="/ride?type=shared" className="inline-flex items-center gap-2 text-white font-black px-7 py-3.5 rounded-xl hover:opacity-90 transition-all w-fit" style={{ backgroundColor: COLORS.brand.red }}>
                Reservar viaje compartido
                <IconArrowRight size={18} />
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
                detail: 'Acceso desde la Costa. Vía Calacalí o vía Alóag al centro norte de Quito y aeropuerto.',
                time: '~2 h 45 min', price: 'Desde $15',
              },
              {
                color: '#60a5fa',
                route: 'Ambato — Latacunga — Quito — Aeropuerto',
                detail: 'Ruta interandina. Conexión directa con la capital y el aeropuerto Mariscal Sucre.',
                time: '~2 h 30 min', price: 'Desde $10',
              },
              {
                color: '#4ade80',
                route: 'Ibarra — Quito — Aeropuerto',
                detail: 'Ruta norte de la Sierra. Directa a Quito norte y al aeropuerto Mariscal Sucre.',
                time: '~2 h 15 min', price: 'Desde $15',
              },
            ].map((r) => (
              <div key={r.route} className="rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all" style={{ background: '#1e293b' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-white font-black text-sm">{r.route}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{r.detail}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs">
                    <IconClock size={12} />
                    {r.time}
                  </span>
                  <span className="font-black text-sm" style={{ color: r.color }}>{r.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DESCARGÁ LA APP — sección dedicada con mockup iPhone ════════════
         Refuerzo del mensaje principal: Going ES una app móvil. Esta
         sección muestra cómo se ve la app en uso (mockup iPhone) + QR +
         badges grandes para descarga.
      */}
      <section id="descarga" className="py-16 px-4" style={{ background: `linear-gradient(135deg, ${COLORS.brand.black} 0%, #1a1a1a 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">

            {/* ── Lado izquierdo: copy + badges + QR ── */}
            <FadeIn dir="left">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] mb-4 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,210,83,0.15)', color: COLORS.brand.yellow }}>
                <IconDownload size={14} />
                Descargá la app
              </span>
              <h2 className="text-white font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                Going vive en<br />
                <span style={{ color: COLORS.brand.red }}>tu teléfono.</span>
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
                La app oficial de Going para pasajeras y pasajeros. Reservá
                viajes compartidos o privados, mandá un envío, seguí tu ruta
                en vivo y pagá sin efectivo — todo desde el celular.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  'Notificaciones push',
                  'GPS en segundo plano',
                  'Pago con tarjeta · DATAFAST · DeUna',
                  'Soporte 24/7 dentro de la app',
                  'Funciona sin señal en ruta',
                ].map(feat => (
                  <span key={feat} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}>
                    <IconCheckCircle size={12} style={{ color: COLORS.brand.yellow }} />
                    {feat}
                  </span>
                ))}
              </div>

              {/* Layout: badges + QR lado a lado */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col gap-3">
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white text-gray-900 hover:scale-[1.03] transition-all shadow-xl"
                  >
                    <IconGooglePlay size={36} />
                    <span className="text-left">
                      <span className="block text-[11px] font-medium uppercase tracking-wider opacity-70">Disponible en</span>
                      <span className="block font-black text-lg leading-tight">Google Play</span>
                    </span>
                  </a>
                  {APP_STORE_AVAILABLE ? (
                    <a
                      href={APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white text-gray-900 hover:scale-[1.03] transition-all shadow-xl"
                    >
                      <IconApple size={36} />
                      <span className="text-left">
                        <span className="block text-[11px] font-medium uppercase tracking-wider opacity-70">Descargar en</span>
                        <span className="block font-black text-lg leading-tight">App Store</span>
                      </span>
                    </a>
                  ) : (
                    <span
                      className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-white/20 text-white/60 cursor-not-allowed"
                      title="App Store iOS estará disponible próximamente"
                    >
                      <IconApple size={36} />
                      <span className="text-left">
                        <span className="block text-[11px] font-medium uppercase tracking-wider opacity-70">Próximamente en</span>
                        <span className="block font-black text-lg leading-tight">App Store</span>
                      </span>
                    </span>
                  )}
                </div>

                {/* QR card */}
                <div className="bg-white rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2 text-gray-700">
                    <IconQrCode size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Escaneá</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(PLAY_STORE_URL)}&size=160x160&margin=8&color=000000`}
                    alt="QR para descargar Going en Google Play"
                    width={140}
                    height={140}
                    className="mx-auto rounded-lg"
                  />
                </div>
              </div>
            </FadeIn>

            {/* ── Lado derecho: MOCKUP iPHONE con UI Going adentro ── */}
            <FadeIn dir="right" className="hidden lg:flex justify-center items-center">
              <PhoneMockup />
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ── 3 Servicios Estrella ──────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-10">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>Nuestros servicios</span>
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
                <span className="absolute top-5 left-5 text-xs font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full z-10" style={{ backgroundColor: COLORS.brand.red }}>Más popular</span>
              </div>
              {/* Texto */}
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <h3 className="text-gray-900 font-black text-4xl mb-3">Viajes Compartidos</h3>
                <p className="text-gray-500 text-base mb-6 leading-relaxed">
                  Viaja de ciudad en ciudad en SUV o VAN con otros pasajeros. Reserva desde la app en segundos, sigue tu ruta en tiempo real y paga sin efectivo. Conductoras y conductores verificados, precio fijo.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {SHARED_FEATURES.map(({ Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-2 text-gray-700 text-xs font-medium bg-gray-100 rounded-xl px-3 py-2.5">
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{text}</span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-400">Desde</span>
                    <span className="text-4xl font-black ml-2" style={{ color: COLORS.brand.red }}>$10</span>
                    <span className="text-sm text-gray-400 ml-1">/ persona</span>
                  </div>
                  <Link href="/ride?type=shared" className="flex-1 inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90" style={{ backgroundColor: COLORS.brand.red }}>
                    Reservar viaje compartido
                    <IconArrowRight size={16} />
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
                <span className="absolute top-5 left-5 text-xs font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full z-10" style={{ backgroundColor: COLORS.brand.blue }}>Premium</span>
              </div>
              {/* Texto */}
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <h3 className="text-gray-900 font-black text-4xl mb-3">Viajes Privados</h3>
                <p className="text-gray-500 text-base mb-6 leading-relaxed">
                  Reserva un SUV, VAN o bus exclusivo para ti y tu grupo. Agenda por servicio o por día, monitorea la ruta en vivo y comunícate directo con tu conductora o conductor desde la app.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {PRIVATE_FEATURES.map(({ Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-2 text-gray-700 text-xs font-medium bg-gray-100 rounded-xl px-3 py-2.5">
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{text}</span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-400">Desde</span>
                    <span className="text-4xl font-black ml-2" style={{ color: COLORS.brand.blue }}>$25</span>
                    <span className="text-sm text-gray-400 ml-1">/ servicio</span>
                  </div>
                  <Link href="/ride?type=van" className="flex-1 inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90" style={{ backgroundColor: COLORS.brand.blue }}>
                    Contratar transporte privado
                    <IconArrowRight size={16} />
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
                <span className="absolute top-5 left-5 text-xs font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-full z-10" style={{ backgroundColor: COLORS.brand.blue }}>Mismo día</span>
              </div>
              {/* Texto */}
              <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                <h3 className="text-gray-900 font-black text-4xl mb-3">Envíos de Paquetes</h3>
                <p className="text-gray-500 text-base mb-6 leading-relaxed">
                  Envía sobres, documentos o paquetes del tamaño de una maleta de mano a cualquier ciudad del Ecuador el mismo día. Cotiza y rastrea tu envío desde la app.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-7">
                  {PARCEL_FEATURES.map(({ Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-2 text-gray-700 text-xs font-medium bg-gray-100 rounded-xl px-3 py-2.5">
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{text}</span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-400">Desde</span>
                    <span className="text-4xl font-black ml-2" style={{ color: COLORS.brand.blue }}>$8</span>
                    <span className="text-sm text-gray-400 ml-1">puerta a puerta</span>
                  </div>
                  <Link href="/envios/cotizar" className="flex-1 inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90" style={{ backgroundColor: COLORS.brand.blue }}>
                    Enviar un paquete
                    <IconArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Cómo Funciona ────────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: 'linear-gradient(135deg, #fff5f5, #fff)' }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-10">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>Simple y rápido</span>
            <h2 className="text-gray-900 font-black text-4xl mt-2">Cómo funciona Going</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gray-200" />
            {[
              { step: '01', Icon: IconPin,  title: 'Elige origen y destino', desc: 'Ingresa de dónde saldrás y a dónde vas. Te mostramos las mejores opciones disponibles.', bg: COLORS.brand.red },
              { step: '02', Icon: IconCard, title: 'Confirma y paga',         desc: 'Selecciona tu viaje, elige el tipo de servicio y paga de forma segura con tarjeta o efectivo.', bg: COLORS.brand.blue },
              { step: '03', Icon: IconCar,  title: 'Viaja con tracking live', desc: 'Sigue tu viaje en tiempo real desde la app. Tu familia también puede ver tu ubicación.', bg: COLORS.brand.red },
            ].map(({ step, Icon, title, desc, bg }, i) => (
              <FadeIn key={step} delay={i * 0.15} className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-5 mx-auto text-white" style={{ backgroundColor: bg }}>
                  <Icon size={42} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">{step}</span>
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinos ─────────────────────────────────────────── */}
      <section id="destinos" className="py-14 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>4 mundos</span>
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


      {/* ── Academia Going ───────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: `linear-gradient(135deg, #0f172a, ${COLORS.brand.blue})` }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-300">Aprende con Going</span>
            <h2 className="text-white font-black text-4xl mt-2" style={{ fontFamily: 'var(--font-academia, serif)' }}>Academia Going</h2>
            <p className="text-blue-200 text-lg mt-3 max-w-lg mx-auto">Capacitaciones gratuitas para conductoras, conductores y proveedores turísticos verificados.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {ACADEMY_COURSES.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.1}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4" style={{ backgroundColor: c.iconColor }}>
                    <c.Icon size={26} />
                  </div>
                  <h4 className="text-white font-bold text-base mb-2">{c.title}</h4>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: c.iconColor }}>{c.level}</span>
                    <span className="inline-flex items-center gap-1 text-blue-300 text-xs">
                      <IconClock size={12} />
                      {c.duration}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center">
            <Link href="/academy" className="inline-flex items-center gap-2 bg-white text-gray-900 font-black px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all text-lg">
              <IconBook size={20} />
              Ver todos los cursos
              <IconArrowRight size={20} />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Únete a Going (pasajeros) ─────────────────────── */}
      {!isLoggedIn && (
        <>
          <section className="py-14 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <FadeIn className="text-center mb-10">
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>Para viajeros</span>
                <h2 className="text-gray-900 font-black mt-2 mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>¿Por qué viajar con Going?</h2>
                <p className="text-gray-500 text-xl max-w-2xl mx-auto">Seguridad, comodidad y precio claro en cada viaje. Descubre por qué miles de ecuatorianos ya usan Going.</p>
              </FadeIn>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
                {TRAVELER_BENEFITS.map(({ Icon, title, desc }, i) => (
                  <FadeIn key={title} delay={i * 0.05}>
                    <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: i % 2 === 0 ? COLORS.brand.red : COLORS.brand.blue }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-base mb-1.5">{title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn className="text-center">
                <p className="text-gray-400 text-base mb-6 italic">&ldquo;Tu tranquilidad es lo primero. Con Going, cada viaje está pensado para que llegues seguro a tu destino.&rdquo;</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 text-white font-black px-10 py-4 rounded-2xl text-lg transition-all hover:opacity-90 hover:scale-105 shadow-xl" style={{ backgroundColor: COLORS.brand.red }}>
                    Registrarme gratis
                    <IconArrowRight size={22} />
                  </Link>
                  <Link href="/auth/login" className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-gray-50 transition-all">
                    Ya tengo cuenta
                  </Link>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── Únete como Conductor ───────────────────────── */}
          <section className="py-14 px-4" style={{ background: `linear-gradient(135deg, #0f172a, ${COLORS.brand.blue})` }}>
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
                    {DRIVER_PERKS.map(({ Icon, text }) => (
                      <li key={text} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                          <Icon size={18} />
                        </span>
                        <span className="text-blue-100 text-base leading-relaxed pt-1">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/conductores" className="inline-flex items-center gap-2 bg-white text-gray-900 font-black px-8 py-4 rounded-2xl text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl">
                    <IconCheckCircle size={20} />
                    Unirme como conductora/conductor
                    <IconArrowRight size={20} />
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
