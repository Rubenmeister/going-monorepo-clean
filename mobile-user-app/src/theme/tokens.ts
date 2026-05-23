/**
 * Theme tokens — Going Ecuador mobile-user-app
 *
 * Dos modos (light + dark) que la app conmuta vía useColorScheme + override
 * manual en settings. Mismos NOMBRES de tokens en ambos modos — cada
 * componente importa `useTheme()` y consume `tokens.X` sin saber qué modo
 * está activo.
 *
 * Decisión 2026-05-23:
 * - Brand accents (neon cyan/blue/purple) MISMOS en light y dark salvo
 *   ajuste de luminosidad para legibilidad (cyan más oscuro sobre blanco).
 * - Tourism palette (tourismPalette) es un SET APARTE — las pantallas de
 *   Tours/Anfitriones/Experiencias importan los colores de paisaje
 *   directamente para los hero/cards, complementando el theme base.
 *
 * Convención de nombres: semántica > literal. Usá `tokens.textPrimary` no
 * `tokens.white` para que el cambio de modo no requiera tocar componentes.
 */

export interface ThemeTokens {
  // ── Superficies ────────────────────────────────────────────
  bg:            string;  // fondo base de la app
  bgLayer:       string;  // panel elevado (cards, sheets)
  bgInverse:     string;  // bg del modo contrario — útil para hero sobre theme actual
  glass:         string;  // overlay glassmorphic (sobre bg o foto)
  glassBorder:   string;  // borde sutil de glass cards

  // ── Tipografía ─────────────────────────────────────────────
  textPrimary:   string;
  textSecondary: string;
  textTertiary:  string;
  textInverse:   string;  // texto sobre superficies de acento (botones)

  // ── Bordes ─────────────────────────────────────────────────
  border:        string;  // borde estándar (input, divider)
  borderStrong:  string;  // borde enfatizado (focus, selected)

  // ── Acentos neon (marca tech) ──────────────────────────────
  neonCyan:      string;
  neonBlue:      string;
  neonPurple:    string;

  // ── Semánticos ─────────────────────────────────────────────
  success:       string;
  warning:       string;
  error:         string;
  info:          string;

  // ── Tier badges (Confort | Premium) ────────────────────────
  // Decisión de marca 2026-05-23 (rev): Premium en lugar de Lujo —
  // suena menos ostentoso, alineado con la audiencia ecuatoriana.
  confortBorder: string;
  confortBg:     string;
  premiumBorder: string;  // acento dorado/ámbar
  premiumBg:     string;
  premiumText:   string;

  // ── Brand legacy ───────────────────────────────────────────
  brandRed:      string;
}

// ─── Modo OSCURO (hero / brand / SOS / voice) ───────────────────────────
export const darkTokens: ThemeTokens = {
  bg:            '#0a0e1a',
  bgLayer:       '#0f1424',
  bgInverse:     '#fafbfc',
  glass:         'rgba(255,255,255,0.06)',
  glassBorder:   'rgba(255,255,255,0.10)',

  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.72)',
  textTertiary:  'rgba(255,255,255,0.42)',
  textInverse:   '#0a0e1a',

  border:        'rgba(255,255,255,0.10)',
  borderStrong:  'rgba(255,255,255,0.25)',

  neonCyan:      '#00d4ff',
  neonBlue:      '#3b82f6',
  neonPurple:    '#a855f7',

  success:       '#10b981',
  warning:       '#f59e0b',
  error:         '#ef4444',
  info:          '#3b82f6',

  confortBorder: 'rgba(255,255,255,0.25)',
  confortBg:     'rgba(255,255,255,0.04)',
  premiumBorder: '#FFD700',
  premiumBg:     'rgba(255,215,0,0.06)',
  premiumText:   'rgba(255,215,0,0.85)',

  brandRed:      '#ff4c41',
};

// ─── Modo CLARO (operativo / diario) ────────────────────────────────────
// Acentos neon ligeramente más oscuros para legibilidad sobre blanco.
export const lightTokens: ThemeTokens = {
  bg:            '#fafbfc',
  bgLayer:       '#ffffff',
  bgInverse:     '#0a0e1a',
  glass:         'rgba(10,14,26,0.04)',
  glassBorder:   'rgba(10,14,26,0.10)',

  textPrimary:   '#0a0e1a',
  textSecondary: 'rgba(10,14,26,0.65)',
  textTertiary:  'rgba(10,14,26,0.42)',
  textInverse:   '#ffffff',

  border:        'rgba(10,14,26,0.10)',
  borderStrong:  'rgba(10,14,26,0.25)',

  // Neon ajustados: el cyan #00d4ff queda débil sobre blanco; bajamos a
  // 0,168,212 para mantener vibe sin perder contraste WCAG AA.
  neonCyan:      '#00a8d4',
  neonBlue:      '#2563eb',
  neonPurple:    '#9333ea',

  success:       '#059669',
  warning:       '#d97706',
  error:         '#dc2626',
  info:          '#2563eb',

  confortBorder: 'rgba(10,14,26,0.20)',
  confortBg:     'rgba(10,14,26,0.03)',
  // Dorado más profundo para contraste sobre blanco (Premium se debe ver
  // sofisticado, no como un highlight de marker).
  premiumBorder: '#C9A227',
  premiumBg:     'rgba(201,162,39,0.08)',
  premiumText:   '#8B6F00',

  brandRed:      '#e63b2f',
};

/**
 * Tourism palette — colores vívidos de paisaje ecuatoriano. NO es un
 * theme alternativo: las pantallas turísticas (Tours, Anfitriones,
 * Experiencias) lo importan como accents PARA SUS HEROS Y CARDS,
 * superpuestos al theme base (light o dark).
 *
 * Inspirado en los biomas del país:
 *   - ocean    → azul mar (Manabí, costa)
 *   - forest   → verde selva (Amazonía, Yasuní)
 *   - mountain → ocre andino (Cotopaxi, Chimborazo)
 *   - sunset   → naranja atardecer (costa)
 *   - sky      → azul cielo (Andes)
 *   - beach    → arena/cream (Galápagos)
 *
 * Uso típico:
 *   import { tourismPalette } from '@theme/tokens';
 *   const heroColor = tourismPalette.ocean;  // hero card de "Tour Manabí"
 */
export const tourismPalette = {
  ocean:    '#0EA5E9',
  forest:   '#16A34A',
  mountain: '#A16207',
  sunset:   '#EA580C',
  sky:      '#38BDF8',
  beach:    '#FED7AA',
} as const;

export type TourismColor = keyof typeof tourismPalette;
