/**
 * Going Icon Library — SVG icons reutilizables.
 *
 * Reemplazo sistemático de los emojis (🚗📦📍etc.) que estaban dispersos en
 * la UI. La política de marca Going es: cero emojis, solo SVG con paleta
 * controlada y stroke consistente.
 *
 * Uso:
 *   import { IconCar, IconPackage } from '@/components/icons';
 *   <IconCar size={20} className="text-going-red" />
 *
 * Diseño:
 * - Todos los iconos viewBox="0 0 24 24"
 * - strokeWidth 2 por default (compacto pero legible a 16px+)
 * - currentColor en stroke/fill para que herede el color del padre via CSS
 * - prop `size` controla width + height en píxeles (default 20)
 *
 * Para agregar un icono nuevo:
 * 1. Path optimizado 24x24
 * 2. Mantené stroke="currentColor" y strokeWidth={2}
 * 3. Si es solid (fill), usar fill="currentColor" y borrar stroke
 *
 * Source de iconos: lucide-icons (MIT license) adaptados a este pattern.
 */

import { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  /** Tamaño en px (aplica a width y height). Default 20. */
  size?: number;
}

// Base wrapper — DRY del SVG común
function Svg({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// ─── Movilidad / Transporte ───────────────────────────────────────────────

/** 🚗 Auto / viaje genérico */
export const IconCar = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
    <circle cx="6.5" cy="16.5" r="2.5"/>
    <circle cx="16.5" cy="16.5" r="2.5"/>
  </Svg>
);

/** 🚙 SUV / vehículo grande */
export const IconSuv = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 17h14M5 17v-4l1.5-5h11L19 13v4M5 17H3v-4h2m14 4h2v-4h-2"/>
    <circle cx="7.5" cy="17.5" r="2"/>
    <circle cx="16.5" cy="17.5" r="2"/>
    <path d="M8 8v5h8V8"/>
  </Svg>
);

/** 🚌 Bus / VAN */
export const IconVan = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17h13V6H3v11Zm13-7h3l3 4v3h-6"/>
    <circle cx="7" cy="17.5" r="1.5"/>
    <circle cx="17.5" cy="17.5" r="1.5"/>
    <path d="M6 9h4M6 12h4"/>
  </Svg>
);

/** 🛣️ Ruta / viaje en curso */
export const IconRoute = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="19" r="3"/>
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </Svg>
);

/** ↔️ Ida y vuelta */
export const IconRoundTrip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 1l4 4-4 4"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 23l-4-4 4-4"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </Svg>
);

// ─── Ubicación / Mapa ─────────────────────────────────────────────────────

/** 📍 Pin de ubicación */
export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </Svg>
);

/** 🟢 Pin origen (rellenado verde — sin embargo el color lo controla el padre) */
export const IconPinFilled = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M12 22s-8-7.58-8-12a8 8 0 1 1 16 0c0 4.42-8 12-8 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
  </Svg>
);

/** 🗺️ Mapa */
export const IconMap = (p: IconProps) => (
  <Svg {...p}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </Svg>
);

/** 🌍 Globo / regiones */
export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </Svg>
);

// ─── Envíos / Paquetes ────────────────────────────────────────────────────

/** 📦 Paquete genérico */
export const IconPackage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16.5 9.4L7.55 4.24"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </Svg>
);

/** 📫 Buzón / Grande */
export const IconMailbox = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="9" width="18" height="11" rx="2"/>
    <path d="M3 9V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  </Svg>
);

// ─── Personas / Identidad ─────────────────────────────────────────────────

/** 👤 Usuario */
export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </Svg>
);

/** 👥 Grupo / pasajeros múltiples */
export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);

/** 📞 Teléfono */
export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </Svg>
);

// ─── Acciones / UI ────────────────────────────────────────────────────────

/** ✅ Check */
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="20 6 9 17 4 12"/>
  </Svg>
);

/** ✓ Check en círculo (solid) */
export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </Svg>
);

/** ❌ Cerrar / cancelar */
export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

/** 🔍 Buscar / lupa */
export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </Svg>
);

/** → Flecha derecha */
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </Svg>
);

/** ← Flecha izquierda */
export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </Svg>
);

/** ↓ Chevron abajo */
export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <polyline points="6 9 12 15 18 9"/>
  </Svg>
);

// ─── Tiempo / Programación ────────────────────────────────────────────────

/** 🕐 Reloj */
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </Svg>
);

/** 🗓️ Calendario */
export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </Svg>
);

// ─── Pagos / Dinero ───────────────────────────────────────────────────────

/** 💳 Tarjeta */
export const IconCard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </Svg>
);

/** 💰 Dinero / efectivo */
export const IconMoney = (p: IconProps) => (
  <Svg {...p}>
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </Svg>
);

// ─── Confianza / Seguridad ────────────────────────────────────────────────

/** 🛡️ Escudo / seguro */
export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </Svg>
);

/** 🔒 Candado cerrado */
export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </Svg>
);

/** ⭐ Estrella (outline) */
export const IconStar = (p: IconProps) => (
  <Svg {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </Svg>
);

/** ★ Estrella rellena */
export const IconStarFilled = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </Svg>
);

// ─── Comunicación / Notificaciones ────────────────────────────────────────

/** 💬 Burbuja chat */
export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </Svg>
);

/** 🔔 Campana */
export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </Svg>
);

// ─── Dispositivos / Tech ──────────────────────────────────────────────────

/** 📱 Móvil */
export const IconMobile = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <line x1="12" y1="18" x2="12" y2="18.01"/>
  </Svg>
);

/** 📡 Antena / señal */
export const IconSignal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </Svg>
);

/** ⚡ Rayo / rápido */
export const IconLightning = (p: IconProps) => (
  <Svg {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>
  </Svg>
);

/** 📸 Cámara */
export const IconCamera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </Svg>
);

// ─── Academia / Educación ─────────────────────────────────────────────────

/** 🎓 Birrete (Academia Going) */
export const IconGraduation = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </Svg>
);

/** 📖 Libro abierto */
export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </Svg>
);

/** 🎧 Audífonos */
export const IconHeadphones = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </Svg>
);

/** ▶ Play — video / curso en formato audiovisual */
export const IconPlay = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <polygon points="6 4 20 12 6 20 6 4"/>
  </Svg>
);

/** 🔧 Llave/herramienta — mantenimiento, mecánica preventiva */
export const IconTool = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </Svg>
);

/** ❓ Pregunta / quiz */
export const IconQuiz = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </Svg>
);

/** 📋 Clipboard — checklist, logística */
export const IconClipboard = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
  </Svg>
);

/** 🌱 Hoja / sostenibilidad */
export const IconLeaf = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4 9.3-2 13.5-8.2 17.04Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
  </Svg>
);

/** 🎨 Paleta — diseño, decoración */
export const IconPalette = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z"/>
  </Svg>
);

/** 🥉🥈🥇 Medalla */
export const IconMedal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/>
    <path d="M11 12 5.12 2.2"/>
    <path d="m13 12 5.88-9.8"/>
    <path d="M8 7h8"/>
    <circle cx="12" cy="17" r="5"/>
    <path d="M12 18v-2h-.5"/>
  </Svg>
);

/** 🗺️ Brújula / explorar — guías locales */
export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </Svg>
);

/** 📊 Gráfico */
export const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </Svg>
);

// ─── Hospedaje / Turismo ──────────────────────────────────────────────────

/** 🏨 Hotel */
export const IconHotel = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 22h18M3 22v-9h18v9M5 13V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/>
    <line x1="9" y1="17" x2="9" y2="22"/>
    <line x1="15" y1="17" x2="15" y2="22"/>
    <line x1="12" y1="6" x2="12" y2="10"/>
  </Svg>
);

/** 🎭 Experiencia / actividad */
export const IconExperience = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </Svg>
);

// ─── Emergencia ──────────────────────────────────────────────────────────

/** 🆘 SOS */
export const IconSos = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </Svg>
);

// ─── Misceláneos UI ──────────────────────────────────────────────────────

/** ⚠️ Advertencia */
export const IconWarning = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </Svg>
);

/** ℹ️ Info */
export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </Svg>
);

/** 🔗 Compartir / link */
export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </Svg>
);

/** Logo placeholder Going — para futuro brand mark */
export const IconLogo = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    {/* Going wordmark stylized — círculo con G central. Reemplazar por SVG oficial cuando esté la marca. */}
    <circle cx="12" cy="12" r="10" />
    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff" fontFamily="sans-serif">G</text>
  </Svg>
);
