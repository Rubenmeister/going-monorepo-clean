'use client';

import { useState, useEffect, useRef, type ReactElement, type MouseEvent } from 'react';
import Link from 'next/link';
import { useIsAuthenticated } from '@/lib/providers/auth-client';
import { ReviewsList } from './components/features/rating';
import { WebAppInstallBadge } from './components/WebAppInstallBadge';
import { COLORS } from './components/design-tokens';
import {
  IconClock, IconSuv, IconRoundTrip, IconPin, IconCard, IconCar, IconMobile,
  IconStar, IconBell, IconChat, IconShield, IconMap, IconCalendar, IconUser,
  IconPackage, IconLightning, IconSignal, IconMoney, IconCamera, IconArrowRight,
  IconSearch, IconUsers, IconCheckCircle, IconGraduation, IconRoute, IconPhone,
  IconHeadphones, IconBook, IconChevronDown, IconGooglePlay, IconApple,
  IconQrCode, IconDownload,
} from './components/icons';

// Links de descarga oficiales.
// Android LIVE: package com.goingappecuador (Play Console). Mismo ID en footer y contacto.
// iOS: NO publicado aún (requiere Apple Developer $99/año) → App Store se muestra como "Próximamente".
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.goingappecuador';
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
   Marco iPhone CSS-puro con UI mockeada de la app Going App viajando.
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
                <span className="font-black text-sm text-gray-900" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>Going App</span>
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
                <p className="text-base font-black" style={{ color: COLORS.brand.red }}>$ —.—</p>
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
 * de marca Going App — son tokens de identidad geográfica (Sierra=morado andino,
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
  { Icon: IconLightning,title: 'Rápido y Fácil',                            desc: 'Abre Going App, escribe tu destino y en segundos tienes tu viaje en camino. Pedir transporte nunca fue tan simple.' },
  { Icon: IconRoute,    title: 'Aeropuerto y Viajes Largos',                desc: 'Organiza tu traslado al aeropuerto o a otra ciudad con anticipación. Llega a tiempo, sin el estrés de buscar transporte de último minuto.' },
  { Icon: IconUser,     title: 'Servicio VIP Disponible',                   desc: 'Para reuniones importantes, eventos especiales o cuando quieres viajar con más comodidad. Elige el nivel de servicio que necesitas.' },
  { Icon: IconPin,      title: 'Tracking en Tiempo Real',                   desc: 'Sigue tu ruta en vivo desde la app. Tu familia también puede ver dónde estás durante el trayecto.' },
  { Icon: IconUsers,    title: 'Apoya la Comunidad Local',                  desc: 'Cada viaje genera ingresos para conductoras y conductores ecuatorianos de tu propia comunidad. Moverse con Going App también es apoyar lo nuestro.' },
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
  { Icon: IconGraduation, text: 'Academia Going App: capacitación gratuita para conductoras y conductores' },
  { Icon: IconHeadphones, text: 'Comunidad y soporte del equipo Going App cuando lo necesites' },
];

/* ── ServiceCard ────────────────────────────────────────────────
   Cards de servicios del hero con tilt 3D siguiendo el cursor +
   título que crece en hover. Pensado para transmitir "tech" sin
   sobrecargar la composición. Solo activo en desktop (pointer:fine);
   en touch devices queda como Link estático con scale en activo.

   Feedback 29-may del founder: las cards iniciales (solo icon + texto)
   se veían planas. Ahora foto top + tilt + hover-grow dan dinamismo
   sin que la composición pierda elegancia.
*/
function ServiceCard({
  href,
  image,
  alt,
  title,
  description,
  cta,
  ctaColor,
}: {
  href: string;
  image: string;
  alt: string;
  title: string;
  description: string;
  cta: string;
  ctaColor: string;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // -0.5 a 0.5 desde el centro
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    // rotateX se invierte (mouse arriba → tilt arriba mirando a la cámara)
    // Cap a ±7° para que el efecto sea sutil, no mareador.
    setTilt({ rx: -py * 7, ry: px * 7 });
  };

  const handleLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <Link
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group bg-white rounded-3xl flex flex-col text-left shadow-xl hover:shadow-2xl relative overflow-hidden border border-gray-100 will-change-transform"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0)`,
        transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Sutil gradient bottom para que el blanco de abajo no corte tan duro */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3
          className="font-black text-gray-900 mb-2 transition-all duration-300 ease-out group-hover:tracking-tight"
          style={{
            fontFamily: 'var(--font-nunito-sans), sans-serif',
            fontSize: '1.25rem', // base 20px
          }}
        >
          {/* span con escala on hover — grow visual sin causar layout shift */}
          <span className="inline-block transition-transform duration-300 ease-out origin-left group-hover:scale-110">
            {title}
          </span>
        </h3>
        <p className="text-sm text-gray-600 mb-5 flex-1 leading-relaxed">
          {description}
        </p>
        <span
          className="inline-flex items-center gap-2 font-bold text-sm group-hover:gap-4 transition-all duration-300"
          style={{ color: ctaColor }}
        >
          {cta}
          <IconArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function HomePage() {
  // Fuente de verdad: el store de auth (vía useIsAuthenticated). Devuelve
  // false durante SSR y antes de hidratar para evitar mismatch.
  const isLoggedIn = useIsAuthenticated();

  // Destinos
  const [activeRegion, setActiveRegion] = useState<keyof typeof REGIONS>('Sierra');

  return (
    <>
      {/* ══ HERO Going App — Transporte primero, no turismo ════════════════════════
         La marca Going App es sobre MOVIMIENTO y transporte compartido (guía
         oficial 2024). El hero anterior era un carousel de paisajes de Ecuador
         que se sentía como sitio de turismo. Esta versión deja claro desde la
         primera mirada: viaje compartido, ruta, conductoras y conductores.
      */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          minHeight: '100vh',
          /* Foto Hero oficial Going App: carretera ecuatoriana entre Sierra y Costa.
             Sirve también como referencia para el splash de las apps móviles
             (la versión vertical para mobile vive en mobile-user-app/assets). */
          backgroundImage: "url('/images/going-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 55%',
        }}
      >
        {/* Overlay claro · v5 minimalista. Feedback: la foto se apreciaba
            poco con v4 (top 0.42). v5 deja la parte superior casi sin
            overlay (0.12 → solo un velo) para que el paisaje del fondo se
            vea pleno. La legibilidad del texto ya está garantizada por el
            text-shadow blanco fuerte en h1/p. El medio sube gradualmente
            para que las cards descansen sobre fondo casi sólido al final. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0.35) 100%)',
          }}
        />

        {/* ── Celular flotando a la derecha, sobre la foto del hero ──
            Va FUERA del flujo centrado (absolute) para que el logo, el texto
            y las 3 cajas queden perfectamente centrados y solo el teléfono
            quede a un costado, sobre el paisaje. Solo en pantallas anchas
            (en móvil estorbaría al contenido centrado). */}
        <img
          src="/images/going-phone-clean.png"
          alt="App Going App en un celular"
          className="hidden lg:block absolute right-2 xl:right-12 top-[15%] z-20 w-[235px] xl:w-[290px] h-auto pointer-events-none"
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 lg:py-14 flex flex-col items-center" style={{ minHeight: '100vh' }}>

          {/* ── Logo arriba (marca paraguas centrada) ── */}
          <FadeIn dir="up" className="text-center mb-8">
            <img
              src="/images/going-logo-v-trans.png"
              alt="Going App"
              className="h-24 md:h-32 mx-auto"
              style={{ filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.12))' }}
            />
          </FadeIn>

          {/* ── Headline + texto (centrado) ── */}
          <FadeIn dir="up" className="text-center max-w-3xl mb-10">
            <h1
              className="font-black text-gray-900 mb-5 leading-[0.95] whitespace-nowrap"
              style={{
                fontSize: 'clamp(1.6rem, 6vw, 4rem)',
                fontFamily: 'var(--font-nunito-sans), sans-serif',
                textShadow: '0 2px 24px rgba(255,255,255,0.85), 0 1px 2px rgba(255,255,255,0.95)',
              }}
            >
              Nos movemos <span style={{ color: COLORS.brand.red }}>contigo.</span>
            </h1>
            <p
              className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed"
              style={{ textShadow: '0 1px 12px rgba(255,255,255,0.9)' }}
            >
              La app de movilidad del Ecuador. Pide tu viaje dentro de la ciudad,
              viaja compartido entre ciudades o envía tus paquetes puerta a puerta —
              todo desde tu teléfono.
            </p>
          </FadeIn>

          {/* ── 3 PRODUCTOS PRINCIPALES — corazón del hero ──
             Cards simples y limpias: icono + título + descripción + CTA.
             SIN precios ni chips numéricos para evitar inconsistencias
             cuando se ajusten tarifas; el detalle de tarifa/cupos vive
             en /ride y /envios/cotizar, fuente única.
          */}
          <FadeIn dir="up" delay={0.15} className="w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

              {/* 3 CARDS DE SERVICIOS — usan <ServiceCard /> con tilt 3D
                 siguiendo el cursor + título escala en hover. Sin emojis ni
                 icon badges sobre la foto (feedback 29-may: queremos que la
                 foto respire). El feel "tech" lo da el tilt + el hover scale. */}
              <ServiceCard
                href="/ride?type=shared"
                image="/images/pasajeros.JPG"
                alt="Pasajeros viajando en Going App"
                title="Viaje Compartido"
                description="Viajes compartidos puerta a puerta entre ciudades del Ecuador. Pagas solo tu asiento."
                cta="Reservar"
                ctaColor={COLORS.brand.red}
              />
              <ServiceCard
                href="/ride?type=van"
                image="/images/Viaje%20privado.png"
                alt="Vehículo privado Going App"
                title="Viaje Privado"
                description="Auto, SUV, VAN, Minibús o Bus exclusivo para ti y tu grupo, dentro o entre ciudades."
                cta="Cotizar"
                ctaColor={COLORS.brand.yellowDark}
              />
              <ServiceCard
                href="/envios/cotizar"
                image="/images/envio.png"
                alt="Mensajero entregando paquete a domicilio"
                title="Envíos"
                description="Sobres, documentos o paquetes puerta a puerta — dentro de la ciudad o entre ciudades."
                cta="Cotizar envío"
                ctaColor={COLORS.brand.black}
              />

            </div>
          </FadeIn>

          {/* ── Download / Web CTAs · solo Play Store (iOS aún no submitted)
              + botón "Reserva en la web" con el mismo estilo del Play Store
              para visual consistency. Feedback 29-may. ── */}
          <FadeIn dir="up" delay={0.3} className="flex flex-col items-center gap-4 mb-6">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-[0.25em]">
              Disponible en
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-white hover:scale-[1.03] transition-all shadow-lg"
                style={{ backgroundColor: COLORS.brand.black }}
              >
                <IconGooglePlay size={26} />
                <span className="text-left">
                  <span className="block text-[10px] font-medium uppercase tracking-wider opacity-70">Disponible en</span>
                  <span className="block font-black text-sm leading-none">Google Play</span>
                </span>
              </a>
              {/* "Reserva en la web" con estilo Play Store. Mismo wrapper,
                 fondo brand red para distinguir del Play Store negro. */}
              <Link
                href="/ride"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-white hover:scale-[1.03] transition-all shadow-lg"
                style={{ backgroundColor: COLORS.brand.red }}
              >
                <IconMobile size={26} />
                <span className="text-left">
                  <span className="block text-[10px] font-medium uppercase tracking-wider opacity-80">Reserva en</span>
                  <span className="block font-black text-sm leading-none">la web</span>
                </span>
              </Link>
            </div>
          </FadeIn>

          {/* Indicador scroll · las 3 ventajas pasaron a sección propia
              después del hero (mejor contraste + más espacio para visuals). */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
            <span>Conoce Ecuador con Going App</span>
            <IconChevronDown size={16} />
          </div>
        </div>
      </section>

      {/* ══ VENTAJAS GoingApp — sección dedicada con visuals únicos ═════════
         Feedback 29-may: las cards en el hero perdían contraste contra la
         foto de fondo y los icons solos se veían planos. Ahora:
           - Sección propia con fondo blanco sólido (contraste pleno)
           - Cada card tiene su VISUAL ÚNICO arriba (no icon repetido):
             * Conductoras → foto real de conductor Going App
             * Tracking → mini phone mockup con mapa SVG animado (pulse GPS)
             * Pago → stack visual de métodos (Visa/Master/DeUna/transfer)
           - Hover lift + scale del visual + borde brand
      */}
      <section className="bg-white py-16 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>
              Lo que hace especial a Going App
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 leading-tight"
              style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
            >
              Tecnología que cuida tu viaje
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARD 1: Conductoras verificadas · foto real */}
            <FadeIn delay={0.1}>
              <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  <img
                    src="/images/Conductor%20Gong.jpg"
                    alt="Conductor verificado Going App"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* badge verificado top-right */}
                  <div
                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-md"
                    style={{ backgroundColor: COLORS.brand.red }}
                  >
                    <IconShield size={12} />
                    VERIFICADO
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3
                    className="text-lg font-black text-gray-900 mb-2 leading-tight"
                    style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
                  >
                    Conductoras y conductores verificados
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Documentos, antecedentes y vehículo aprobados antes del primer viaje.
                    Cada conductora y conductor con foto y calificación visible.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* CARD 2: Tracking en vivo · mockup tech SVG con GPS pulse */}
            <FadeIn delay={0.2}>
              <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Mockup mapa con pin GPS animado + ruta dashed */}
                <div
                  className="relative w-full h-48 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.brand.black} 0%, #1a2332 100%)`,
                  }}
                >
                  {/* Grid pattern tech background */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#ffffff" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Ruta SVG con dash animation + pin pulsante */}
                  <svg
                    viewBox="0 0 400 200"
                    className="absolute inset-0 w-full h-full"
                    aria-hidden="true"
                  >
                    {/* Path de ruta dashed (animation via CSS @keyframes en
                       style global; fallback estático si no soportada) */}
                    <path
                      d="M 50 160 Q 120 80 200 110 T 350 50"
                      fill="none"
                      stroke={COLORS.brand.red}
                      strokeWidth="3"
                      strokeDasharray="8 6"
                      strokeLinecap="round"
                      opacity="0.9"
                      style={{ animation: 'dashFlow 1.8s linear infinite' }}
                    />
                    {/* Inline keyframes para la animation del dash */}
                    <style>{`
                      @keyframes dashFlow {
                        from { stroke-dashoffset: 0; }
                        to { stroke-dashoffset: -28; }
                      }
                    `}</style>
                    {/* Origen (verde) */}
                    <circle cx="50" cy="160" r="6" fill="#4ade80" />
                    <circle cx="50" cy="160" r="6" fill="#4ade80" opacity="0.4" className="animate-ping" />
                    {/* Destino (rojo brand) */}
                    <circle cx="350" cy="50" r="8" fill={COLORS.brand.red} />
                    <circle cx="350" cy="50" r="14" fill={COLORS.brand.red} opacity="0.3" className="animate-pulse" />
                    {/* Vehículo en movimiento (yellow) */}
                    <g transform="translate(220, 95)">
                      <circle r="10" fill={COLORS.brand.yellowDark} />
                      <circle r="16" fill={COLORS.brand.yellowDark} opacity="0.35" className="animate-pulse" />
                      <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="900" fill="white">
                        ●
                      </text>
                    </g>
                  </svg>

                  {/* Etiqueta "EN VIVO" */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-red-500 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    EN VIVO
                  </div>

                  {/* ETA mini-card bottom-right */}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Llegando en</div>
                    <div className="text-base font-black" style={{ color: COLORS.brand.red }}>
                      4 min
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3
                    className="text-lg font-black text-gray-900 mb-2 leading-tight"
                    style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
                  >
                    Tracking en vivo
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Mirá tu ruta y la del vehículo en tiempo real. Compartí el viaje
                    con tus contactos de confianza con un toque.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* CARD 3: Múltiples formas de pago · stack de métodos */}
            <FadeIn delay={0.3}>
              <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                {/* Visual con stack de payment methods */}
                <div
                  className="relative w-full h-48 overflow-hidden flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.brand.redBg} 0%, ${COLORS.brand.yellowBg} 100%)`,
                  }}
                >
                  {/* Decorative circles backdrop */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
                  <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />

                  {/* Payment method chips en stack */}
                  <div className="relative z-10 flex flex-col gap-2.5">
                    {[
                      { label: 'Visa', color: '#1a1f71' },
                      { label: 'Mastercard', color: '#eb001b' },
                      { label: 'DeUna', color: '#00a8e1' },
                      { label: 'Transferencia', color: '#374151' },
                    ].map((m, i) => (
                      <div
                        key={m.label}
                        className="bg-white rounded-lg px-4 py-2 shadow-md flex items-center gap-2 transition-transform duration-300"
                        style={{
                          marginLeft: `${i * 14}px`,
                          transform: `rotate(${(i - 1.5) * 2}deg)`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-xs font-black text-gray-800">{m.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* "Y MÁS" badge top-right */}
                  <div
                    className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-md"
                    style={{ backgroundColor: COLORS.brand.black }}
                  >
                    <IconCard size={12} />
                    Y MÁS
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3
                    className="text-lg font-black text-gray-900 mb-2 leading-tight"
                    style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
                  >
                    Múltiples formas de pago
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Tarjeta de crédito, débito, DeUna, transferencia bancaria.
                    Pagás como te resulte más cómodo, sin efectivo a bordo.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ COBERTURA — 15 ciudades + Aeropuerto Quito ═══════════════════════
         Sección prominente que destaca el alcance operativo inicial de
         Going App. Feedback 29-may: tenía bajo peso visual; ahora título
         grande + chips con border-l accent + el Aeropuerto destacado
         como ancla destino. */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3" style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}>
              <IconMap size={14} />
              Empezamos con 3 rutas
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight"
              style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
            >
              Rutas a <span style={{ color: COLORS.brand.red }}>Quito</span> y al{' '}
              <span style={{ color: COLORS.brand.yellowDark }}>Aeropuerto Mariscal Sucre</span>
            </h2>
            <p className="text-sm text-gray-600 mt-3 max-w-2xl mx-auto leading-relaxed">
              Empezamos con 3 rutas desde Quito y el aeropuerto, con sus paradas en
              el camino. Vamos llegando a todo el país, sumando rutas según la
              demanda de las viajeras y los viajeros.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2.5 mb-5">
              {[
                'Quito', 'Riobamba', 'Ambato', 'Latacunga', 'Salcedo',
                'Ibarra', 'Otavalo', 'Atuntaqui', 'Cayambe', 'Tabacundo',
                'Santo Domingo', 'La Concordia', 'El Carmen',
              ].map(city => (
                <span
                  key={city}
                  className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-200 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  style={{ color: COLORS.gray[800] }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.brand.red }} />
                  {city}
                </span>
              ))}
            </div>
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2.5 text-base font-black px-5 py-3 rounded-2xl shadow-lg"
                style={{ backgroundColor: COLORS.brand.yellowDark, color: '#ffffff' }}
              >
                <IconRoute size={20} />
                + Aeropuerto Internacional Mariscal Sucre
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ STATS EN VIVO + TESTIMONIOS — eliminados 29-may por feedback ════
         del founder: las cifras y los testimonios eran demo (María G.,
         Carlos R., Ana T.) y considerados falsos para una soft launch
         pre-operativa. Re-introducir solo cuando tengamos métricas
         reales conectadas a /analytics/kpis/current + testimonios reales
         con consentimiento explícito de los pasajeros y conductores. */}

      {/* ── Search Card — "también sin app" ───────────────── *
         Posicionada como alternativa al download. Quien entra desde
         desktop o quiere reservar rápido sin instalar, puede hacerlo
         desde la webapp con la misma cuenta Going App.
      */}
      <section id="search-card" className="relative z-20 max-w-4xl mx-auto px-4 -mt-12 mb-16">
        <FadeIn>
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.brand.red }}>
              También desde el navegador
            </p>
            <h2 className="text-gray-900 font-black text-xl sm:text-2xl mb-1">¿A dónde viajas hoy?</h2>
            <p className="text-gray-500 text-sm mb-5">Reserva un viaje sin descargar nada. Tu cuenta funciona en app y web.</p>
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

      {/* ── Primeras Rutas Going App ──────────────────────────── */}
      <section className="overflow-hidden" style={{ background: '#0f172a' }}>
        <div className="max-w-7xl mx-auto px-6 py-16">

          {/* Mapa visible completo */}
          <FadeIn dir="up" className="mb-12">
            <img
              src="/images/mapa rutas Quito.png"
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

            {/* Columna derecha: las 3 rutas operativas (corredores) con sus
                paradas en el camino. Sin precios acá (se cotizan en el flujo
                /ride desde libs/pricing). Tiempos = referencia aproximada
                (carretera abierta, sin tráfico). Arrancamos con estos 3
                corredores y vamos sumando rutas. */}
            <div className="lg:flex-1 space-y-2.5">
              {[
                // Norte → Ibarra (vía Otavalo, Atuntaqui, Cayambe)
                { color: '#3b82f6', route: 'Ibarra — Atuntaqui — Otavalo — Cayambe — Quito — Aeropuerto', time: '~2 h 15 min' },
                { color: '#3b82f6', route: 'Otavalo — Cayambe — Quito — Aeropuerto', time: '~2 h' },
                // Centro/Sur → Riobamba (vía Ambato, Latacunga, Salcedo)
                { color: '#d97706', route: 'Riobamba — Ambato — Latacunga — Quito — Aeropuerto', time: '~4 h 15 min' },
                { color: '#d97706', route: 'Ambato — Latacunga — Quito — Aeropuerto', time: '~2 h 30 min' },
                { color: '#d97706', route: 'Latacunga — Quito — Aeropuerto', time: '~1 h 45 min' },
                // Occidente → Santo Domingo (+ extensión El Carmen, La Concordia)
                { color: '#a855f7', route: 'El Carmen — Santo Domingo — Quito — Aeropuerto', time: '~4 h 30 min' },
                { color: '#a855f7', route: 'La Concordia — Santo Domingo — Quito — Aeropuerto', time: '~3 h 45 min' },
                { color: '#a855f7', route: 'Santo Domingo — Quito — Aeropuerto', time: '~2 h 45 min' },
              ].map((r) => (
                <div key={r.route} className="flex items-center gap-4 rounded-xl px-5 py-3" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-white font-semibold text-sm flex-1">{r.route}</span>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{r.time}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* 3 tarjetas resumen — corredores principales. Sin precios
              (feedback 29-may: los precios mostrados estaban mal, los
              quitamos hasta tener tarifas reales conectadas a /api/fares). */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              {
                color: '#a855f7',
                route: 'Santo Domingo — Quito — Aeropuerto',
                detail: 'Acceso desde la Costa. Vía Calacalí o vía Alóag al centro norte de Quito y aeropuerto.',
                time: '~2 h 45 min',
                img: '/images/aeropuerto-quito.jpg',
              },
              {
                color: '#d97706',
                route: 'Ambato — Latacunga — Quito — Aeropuerto',
                detail: 'Ruta interandina. Conexión directa con la capital y el aeropuerto Mariscal Sucre.',
                time: '~2 h 30 min',
                img: '/images/ambato y tungurahua de fondo.jpg',
              },
              {
                color: '#3b82f6',
                route: 'Ibarra — Quito — Aeropuerto',
                detail: 'Ruta norte de la Sierra. Directa a Quito norte y al aeropuerto Mariscal Sucre.',
                time: '~2 h 15 min',
                img: '/images/cuicocha.jpg',
              },
            ].map((r) => (
              <div key={r.route} className="rounded-2xl border border-white/10 hover:border-white/20 transition-all overflow-hidden" style={{ background: '#1e293b' }}>
                {/* Foto representativa de la ciudad/ruta. Render condicional:
                    solo se dibuja si hay foto (evita íconos de imagen rota). */}
                {r.img && (
                  <img
                    src={r.img}
                    alt={r.route}
                    className="w-full h-24 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-white font-black text-sm">{r.route}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">{r.detail}</p>
                  <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs">
                    <IconClock size={12} />
                    {r.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DESCARGÁ LA APP — sección dedicada con mockup iPhone ════════════
         Refuerzo del mensaje principal: Going App ES una app móvil. Esta
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
                Descarga la app
              </span>
              <h2 className="text-white font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
                Going App vive en<br />
                <span style={{ color: COLORS.brand.red }}>tu teléfono.</span>
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
                La app oficial de Going App para pasajeras y pasajeros. Reserva
                viajes compartidos o privados, manda un envío, sigue tu ruta
                en vivo y paga sin efectivo — todo desde el celular.
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

                  {/* App Web (PWA) — instálala directo desde el navegador */}
                  <WebAppInstallBadge />
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
                    alt="QR para descargar Going App en Google Play"
                    width={140}
                    height={140}
                    className="mx-auto rounded-lg"
                  />
                </div>
              </div>

              {/* Alternativa: usar la app WEB sin descargar */}
              <div className="mt-7 pt-6 border-t border-white/10">
                <a
                  href="/search"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
                >
                  <span aria-hidden>🌐</span>
                  ¿Prefieres no descargar? Úsala en tu navegador
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                <p className="text-white/50 text-xs mt-1.5">
                  Tu cuenta funciona igual en app y web — reserva sin instalar nada.
                </p>
              </div>
            </FadeIn>

            {/* ── Lado derecho: MOCKUP iPHONE con UI Going App adentro ── */}
            <FadeIn dir="right" className="hidden lg:flex justify-center items-center">
              <PhoneMockup />
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ── Flota: el rango completo (1 a 30 pax) ─────────────
         Ningún ride-hailing de la región cubre desde SUV hasta Bus.
         Esto es el ENGRANAJE del diferencial dual: para cada viaje
         (1 persona urbano · 4 personas a la playa · 30 personas en
         tour corporativo) hay un vehículo justo y una tarifa justa.
         Capacidades reales del backend (libs/pricing/fares.ts).
      */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-10">
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: COLORS.brand.red }}>Nuestra flota</span>
            <h2 className="text-gray-900 font-black text-4xl mt-2" style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>
              De 1 a 45 personas — sin cambiar de app
            </h2>
            <p className="text-gray-500 text-lg mt-3 max-w-2xl mx-auto">
              El único catálogo en Ecuador que conecta un viaje rápido en SUV con un tour
              corporativo en Bus. Mismo precio fijo, misma tracking, misma app.
            </p>
          </FadeIn>

          <FadeIn dir="up" delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'SUV',     pax: 'Hasta 4 pax',  cat: 'Familia · pareja',        img: '/images/suv-quito.png',           tier: 'white'  },
                { name: 'SUV XL',  pax: 'Hasta 5 pax',  cat: 'Familia + equipaje',      img: '/images/SUV de lujo.png',         tier: 'white'  },
                { name: 'VAN',     pax: 'Hasta 7 pax',  cat: 'Grupo de amigos',         img: '/images/sprinter-aeropuerto.png', tier: 'yellow' },
                { name: 'VAN XL',  pax: 'Hasta 12 pax', cat: 'Empresas · amigos',       img: '/images/van-xl.png',              tier: 'yellow' },
                { name: 'Minibús', pax: 'Hasta 20 pax', cat: 'Tour · evento',           img: '/images/Minibus.png',             tier: 'yellow' },
                { name: 'Bus',     pax: '30+ pax',      cat: 'Corporativo · promoción', img: '/images/BUS.png',                 tier: 'black'  },
              ].map((v) => {
                const cardStyle =
                  v.tier === 'yellow' ? { backgroundColor: COLORS.brand.yellowBg, border: `2px solid ${COLORS.brand.yellow}` }
                  : v.tier === 'black' ? { backgroundColor: COLORS.brand.black }
                  : {};
                const cardCls  = v.tier === 'white' ? 'bg-white border border-gray-200 hover:border-transparent hover:shadow-lg' : 'hover:shadow-xl';
                const titleCls = v.tier === 'black' ? 'text-white' : 'text-gray-900';
                const paxCls   = v.tier === 'white' ? 'text-gray-500' : v.tier === 'black' ? 'text-white/80 font-bold' : 'text-gray-700 font-bold';
                const catStyle = v.tier === 'yellow' ? { color: COLORS.brand.yellowDark } : v.tier === 'black' ? { color: COLORS.brand.yellow } : { color: COLORS.gray[400] };
                return (
                  <div key={v.name} className={`rounded-2xl text-center overflow-hidden transition-all ${cardCls}`} style={cardStyle}>
                    <img src={v.img} alt={v.name} className="w-full h-24 object-cover bg-gray-50" />
                    <div className="p-5 pt-4">
                      <h3 className={`font-black text-base mb-0.5 ${titleCls}`} style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}>{v.name}</h3>
                      <p className={`text-xs mb-2 ${paxCls}`}>{v.pax}</p>
                      <p className="text-[10px] uppercase tracking-wider font-black" style={catStyle}>{v.cat}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </FadeIn>

          {/* Cinta de diferencial dual */}
          <FadeIn dir="up" delay={0.25} className="mt-10">
            <div className="rounded-3xl p-6 md:p-8 text-white text-center" style={{ background: `linear-gradient(135deg, ${COLORS.brand.black} 0%, #1a1a1a 100%)` }}>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.brand.red }}>
                    <IconPin size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: COLORS.brand.yellow }}>Intracity</p>
                    <p className="font-bold">Dentro de la ciudad</p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-white/20" />

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.brand.yellow, color: COLORS.brand.black }}>
                    <IconRoute size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: COLORS.brand.yellow }}>Intercity</p>
                    <p className="font-bold">Entre ciudades del Ecuador</p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-white/20" />

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <IconLightning size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: COLORS.brand.yellow }}>1ra superapp</p>
                    <p className="font-bold">de movilidad en Latam</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
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
                <Link href="/ride?type=shared" className="inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90 w-full" style={{ backgroundColor: COLORS.brand.red }}>
                  Reservar viaje compartido
                  <IconArrowRight size={16} />
                </Link>
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
                <Link href="/ride?type=van" className="inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90 w-full" style={{ backgroundColor: COLORS.brand.blue }}>
                  Contratar transporte privado
                  <IconArrowRight size={16} />
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Envíos — foto izquierda, texto derecha */}
          <FadeIn delay={0.2} dir="up">
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col md:flex-row">
              {/* Foto */}
              <div className="relative md:w-1/2 overflow-hidden" style={{ minHeight: 380 }}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/envio.png')" }} />
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
                <Link href="/envios/cotizar" className="inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all hover:opacity-90 w-full" style={{ backgroundColor: COLORS.brand.blue }}>
                  Enviar un paquete
                  <IconArrowRight size={16} />
                </Link>
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
            <h2 className="text-gray-900 font-black text-4xl mt-2">Cómo funciona Going App</h2>
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
            <h2 className="text-white font-black text-4xl mt-2">Explora Ecuador con Going App</h2>
            <p className="text-gray-400 text-lg mt-3">Cada región, una experiencia única. Going App te lleva a todas.</p>
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


      {/* ── Academia Going App ───────────────────────────────────── */}
      <section className="py-14 px-4" style={{ background: `linear-gradient(135deg, #0f172a, ${COLORS.brand.blue})` }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-300">Aprende con Going App</span>
            <h2 className="text-white font-black text-4xl mt-2" style={{ fontFamily: 'var(--font-academia, serif)' }}>Academia Going App</h2>
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

      {/* ── Únete a Going App (pasajeros) ─────────────────────── */}
      {!isLoggedIn && (
        <>
          <section className="py-14 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <FadeIn className="text-center mb-10">
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: COLORS.brand.red }}>Para viajeros</span>
                <h2 className="text-gray-900 font-black mt-2 mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>¿Por qué viajar con Going App?</h2>
                <p className="text-gray-500 text-xl max-w-2xl mx-auto">Seguridad, comodidad y precio claro en cada viaje. Así es viajar con Going App por Ecuador.</p>
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
                <p className="text-gray-400 text-base mb-6 italic">&ldquo;Tu tranquilidad es lo primero. Con Going App, cada viaje está pensado para que llegues seguro a tu destino.&rdquo;</p>
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
                    Conduce con libertad.<br />Crece con Going App.
                  </h2>
                  <p className="text-blue-200 text-lg mb-8 leading-relaxed">
                    Tu vehículo es una oportunidad. Únete a la comunidad Going App y genera ingresos con total flexibilidad.
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
