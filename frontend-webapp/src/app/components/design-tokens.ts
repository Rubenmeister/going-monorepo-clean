/**
 * Design Tokens — Going brand system
 *
 * Fuente única de verdad para colores, espaciados y tipografía en la webapp.
 * Mapea la "Guía de uso de marca Going" a constantes consumibles en JSX.
 *
 * Cuando llegue la guía oficial actualizamos los valores acá; el resto del
 * código consume los nombres semánticos y no hay que tocar nada más.
 *
 * Uso típico:
 *   import { COLORS, SHADOWS, RADII } from '@/components/design-tokens';
 *   <div style={{ background: COLORS.brand.red, color: COLORS.brand.white }}>
 */

// ── Paleta oficial Going ─────────────────────────────────────────────────────
// Rojo Going (#ff4c41) y Azul Corporate (#0033A0) son los DOS primarios.
// Tonos derivados sirven para hover, fondos pasteles y bordes.
export const COLORS = {
  brand: {
    /** Rojo Going — principal CTA, identidad marca pasajero */
    red:        '#ff4c41',
    redDark:    '#d63d34', // hover/pressed
    redLight:   '#ff7068',
    redBg:      '#fff2f2', // fondo card destacado
    redBgSoft:  '#FFF0EF', // fondo aún más sutil (badges)
    redBorder:  '#FECACA',

    /** Azul Corporate — empresas, contraste, secundario */
    blue:       '#0033A0',
    blueDark:   '#002475',
    blueLight:  '#3D5FBF',
    blueBg:     '#EEF2FF',
    blueBgSoft: '#F0F4FF',
    blueBorder: '#C7D2FE',

    /** Neutrales del sistema marca */
    black:      '#0F0F14',
    white:      '#FFFFFF',
  },

  // ── Grises (escala neutral) ─────────────────────────────────────────────
  gray: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // ── Semánticos (estados, NO equivalentes a brand) ───────────────────────
  // Solo para sistema (errores, validación, success genérico). NO usar para
  // CTAs ni elementos de marca — eso es siempre brand.red/blue.
  state: {
    success: '#16A34A', // verde para checks y confirmaciones
    warning: '#F59E0B', // ámbar para alertas no críticas
    danger:  '#DC2626', // rojo error (DIFERENTE al red brand)
    info:    '#0284C7', // azul info (DIFERENTE al blue brand)
  },

  // ── Fondos contextuales ──────────────────────────────────────────────────
  bg: {
    page:   '#F9FAFB', // gris-50 default
    card:   '#FFFFFF',
    muted:  '#F3F4F6',
  },

  // ── Texto ────────────────────────────────────────────────────────────────
  text: {
    primary:   '#0F0F14',
    secondary: '#4B5563',
    muted:     '#6B7280',
    disabled:  '#9CA3AF',
    inverse:   '#FFFFFF',
  },

  // ── Bordes ───────────────────────────────────────────────────────────────
  border: {
    default: '#E5E7EB',
    strong:  '#D1D5DB',
    subtle:  '#F3F4F6',
  },
} as const;

// ── Sombras ──────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 12px 24px rgba(0,0,0,0.12)',
  xl: '0 24px 48px rgba(0,0,0,0.18)',
  /** Sombra característica de cards Going (combinación md + tinte rojo) */
  brand: '0 4px 20px rgba(255, 76, 65, 0.20)',
} as const;

// ── Radios de borde ─────────────────────────────────────────────────────────
export const RADII = {
  sm:   '0.5rem',   // 8px — inputs pequeños, badges
  md:   '0.75rem',  // 12px — buttons default
  lg:   '1rem',     // 16px — cards
  xl:   '1.5rem',   // 24px — heros, modales
  full: '9999px',   // píldoras
} as const;

// ── Espaciado ───────────────────────────────────────────────────────────────
// Sigue Tailwind para que sea consistente con className.
export const SPACING = {
  px:   '1px',
  0.5:  '0.125rem',
  1:    '0.25rem',
  2:    '0.5rem',
  3:    '0.75rem',
  4:    '1rem',
  6:    '1.5rem',
  8:    '2rem',
  12:   '3rem',
  16:   '4rem',
} as const;

// ── Tipografía ──────────────────────────────────────────────────────────────
// Google Fonts. Cuando llegue la guía de marca, actualizar `body` con la
// fuente oficial. Por ahora usa Inter (excelente legibilidad pantalla).
// `display` para titulares grandes, `body` para texto general,
// `academia` para la sección Academia Going (cuando el user defina cuál).
export const FONTS = {
  display:  'Manrope, system-ui, -apple-system, sans-serif',
  body:     'Inter, system-ui, -apple-system, sans-serif',
  academia: 'Lora, Georgia, serif', // placeholder hasta confirmar guía
  mono:     'JetBrains Mono, ui-monospace, monospace',
} as const;

// ── Atajos legacy (compat con código que ya usa los valores hardcoded) ──────
// Permite hacer reemplazos graduales sin tocar todo de un golpe.
export const RED   = COLORS.brand.red;
export const BLUE  = COLORS.brand.blue;
export const WHITE = COLORS.brand.white;
