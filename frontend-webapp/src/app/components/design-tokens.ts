/**
 * Design Tokens — Going brand system
 *
 * Fuente única de verdad para colores, espaciados y tipografía en la webapp.
 * Mapea la "Going Branding Guidelines 2024" (Conexolab) a constantes
 * consumibles en JSX.
 *
 * GUÍA OFICIAL:
 *   - Rojo dominante:  #FF4C41
 *   - Amarillo acento: #FFD253
 *   - Negro:           #000000
 *   - Conceptos: calidez · dinamismo · juventud · aventura · energía
 *   - Símbolo: movimiento curvilíneo en forma de G rematado en un punto
 *     (lugar de llegada). El rojo "acentúa los conceptos asociados a la
 *     marca, complementándose con el amarillo para los acentos cromáticos."
 *
 * Uso típico:
 *   import { COLORS, SHADOWS, RADII } from '@/components/design-tokens';
 *   <div style={{ background: COLORS.brand.red, color: COLORS.brand.white }}>
 */

// ── Paleta oficial Going ─────────────────────────────────────────────────────
// Rojo PRINCIPAL + Amarillo ACENTO (NO hay azul en la guía oficial).
export const COLORS = {
  brand: {
    /** Rojo Going — PRIMARIO. CTAs, identidad, marca. */
    red:        '#FF4C41',
    redDark:    '#D63D34', // hover/pressed
    redLight:   '#FF7068',
    redBg:      '#FFF2F2', // fondo card destacado
    redBgSoft:  '#FFF0EF', // fondo aún más sutil (badges)
    redBorder:  '#FECACA',

    /** Amarillo Going — ACENTO. Highlights, badges, énfasis secundario. */
    yellow:        '#FFD253',
    yellowDark:    '#E6B43E', // hover/pressed
    yellowLight:   '#FFE082',
    yellowBg:      '#FFFCEB',
    yellowBgSoft:  '#FFFDF5',
    yellowBorder:  '#FDE68A',

    /** Neutrales del sistema marca (negro oficial) */
    black:      '#000000',
    white:      '#FFFFFF',

    /** @deprecated `brand.blue` ya NO es color de marca (la guía oficial 2024
     *  solo tiene rojo + amarillo + negro). Estos aliases existen para no
     *  romper código viejo durante la migración. El nuevo código debe usar
     *  `COLORS.brand.yellow` para énfasis secundario o `COLORS.system.blue`
     *  si necesita azul funcional (forms, info messages). */
    blue:       '#0033A0',
    blueDark:   '#002475',
    blueLight:  '#3D5FBF',
    blueBg:     '#EEF2FF',
    blueBgSoft: '#F0F4FF',
    blueBorder: '#C7D2FE',
  },

  /**
   * COLORES FUNCIONALES (no de marca).
   * Estos colores NO aparecen en la guía oficial pero los usamos para
   * elementos de sistema/utilidad que necesitan contraste con la marca
   * (ej. botones de "Iniciar sesión" en formularios largos, links de info
   * neutral). Cuando se pueda, preferir red o yellow.
   *
   * El azul antes era "Corporate Going" — eliminado de marca pero
   * conservado acá como `system.blue` para forms y elementos auxiliares.
   */
  system: {
    blue:       '#0033A0',
    blueDark:   '#002475',
    blueLight:  '#3D5FBF',
    blueBg:     '#EEF2FF',
    blueBgSoft: '#F0F4FF',
    blueBorder: '#C7D2FE',
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

// ── Tipografía OFICIAL Going ───────────────────────────────────────────────
// Going Branding Guidelines 2024:
//   - Títulos: Nunito Sans Variable (Google Fonts)
//   - Cuerpo:  Roboto (Google Fonts)
//
// Las cargamos en app/layout.tsx con next/font/google que las inyecta como
// CSS variables `--font-nunito-sans` y `--font-roboto`. Acá las referenciamos
// con esos nombres para que tailwind + style inline funcionen.
//
// `academia` reusa Nunito Sans con un peso más fuerte (la sección
// "Academia Going" es parte del producto, no necesita una fuente distinta
// — la jerarquía la marca el peso y tamaño).
export const FONTS = {
  display:  'var(--font-nunito-sans), system-ui, -apple-system, sans-serif',
  body:     'var(--font-roboto), system-ui, -apple-system, sans-serif',
  academia: 'var(--font-nunito-sans), system-ui, -apple-system, sans-serif',
  mono:     'JetBrains Mono, ui-monospace, monospace',
} as const;

// ── Atajos legacy (compat con código que ya usa los valores hardcoded) ──────
// Permite hacer reemplazos graduales sin tocar todo de un golpe.
// Mantenemos BLUE como alias a system.blue para evitar romper imports
// existentes, pero el nuevo código debe usar COLORS.brand.{red,yellow}.
export const RED    = COLORS.brand.red;
export const YELLOW = COLORS.brand.yellow;
export const BLACK  = COLORS.brand.black;
export const WHITE  = COLORS.brand.white;
/** @deprecated NO es color de marca. Usar COLORS.brand.yellow o red. */
export const BLUE   = COLORS.system.blue;
