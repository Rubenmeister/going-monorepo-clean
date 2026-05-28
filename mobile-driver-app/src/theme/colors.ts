/**
 * Going Driver App — Paleta de marca (Going Branding Guidelines 2024)
 *
 * Fuente única de verdad para colores. Reemplaza los hex hardcoded por
 * tokens semánticos para que cambios futuros de marca se hagan en un solo
 * lugar.
 *
 * Decisión 2026-05-28 (sprint #119):
 *   La driver-app venía usando navy #0033A0 + amarillo #FFCD00 como primary
 *   identity. Esto viola la Going Branding Guide 2024 (rojo #FF4C41 +
 *   amarillo #FFD253 + negro #000000).
 *
 *   Este archivo introduce los tokens correctos. Para minimizar regresiones
 *   visuales sin tests, los nombres NAVY/YELLOW se mantienen como aliases
 *   pero apuntan a los colores correctos de la guía.
 *
 *   Los hex literales #0033A0, #001F6B, #1E3A8A y #FFCD00 fueron barridos
 *   por find-replace masivo en toda la app — los archivos ahora apuntan a
 *   los hex correctos directamente, y este módulo queda como referencia +
 *   migración progresiva futura a tokens semánticos (ej. import { COLORS }).
 *
 * Uso típico:
 *   import { COLORS } from '@theme/colors';
 *   const styles = StyleSheet.create({
 *     header: { backgroundColor: COLORS.brandRed },
 *     cta:    { backgroundColor: COLORS.brandYellow },
 *   });
 */

// ─── Paleta de marca Going 2024 ─────────────────────────────────────────────
export const COLORS = {
  // ── Brand identity ────────────────────────────────────────────
  /** Rojo coral Going — primary CTA, headers, identidad principal. */
  brandRed:        '#FF4C41',
  /** Rojo Going hover/pressed. */
  brandRedDark:    '#E03A30',
  /** Amarillo Going — accents, badges, momentos especiales (Iniciar viaje). */
  brandYellow:     '#FFD253',
  /** Amarillo Going hover/pressed. */
  brandYellowDark: '#E6B83A',
  /** Negro Going — tercer accent (Envíos, dark mode header). */
  brandBlack:      '#000000',

  // ── Aliases legacy (driver app pre-2026-05-28) ────────────────
  /** @deprecated alias → brandRed. Mantener para no romper imports legacy. */
  NAVY:            '#FF4C41',
  /** @deprecated alias → brandRedDark. */
  NAVY_DARK:       '#E03A30',
  /** @deprecated alias → brandYellow. */
  YELLOW:          '#FFD253',

  // ── Texto sobre superficies de marca ──────────────────────────
  textOnRed:       '#FFFFFF',
  textOnYellow:    '#000000',
  /** @deprecated alias → textOnRed (blanco sobre rojo). */
  textOnNavy:      '#FFFFFF',

  // ── Superficies ───────────────────────────────────────────────
  bg:              '#F9FAFB',  // fondo de pantalla
  bgLayer:         '#FFFFFF',  // cards, sheets
  bgInverse:       '#111827',  // hero dark

  // ── Tipografía ────────────────────────────────────────────────
  textPrimary:     '#111827',
  textSecondary:   '#374151',
  textTertiary:    '#6B7280',
  textMuted:       '#9CA3AF',
  textInverse:     '#FFFFFF',

  // ── Bordes ────────────────────────────────────────────────────
  border:          '#E5E7EB',
  borderLight:     '#F3F4F6',
  borderStrong:    '#D1D5DB',

  // ── Semánticos ────────────────────────────────────────────────
  success:         '#059669',
  successBg:       '#ECFDF5',
  successText:     '#065F46',
  warning:         '#F59E0B',
  warningBg:       '#FFFBEB',
  warningText:     '#92400E',
  error:           '#DC2626',
  errorBg:         '#FEF2F2',
  errorText:       '#B91C1C',
  info:            '#2563EB',
  infoBg:          '#EFF6FF',
  infoText:        '#1E40AF',

  // ── Whatsapp (color brand específico) ─────────────────────────
  whatsapp:        '#25D366',
  whatsappBg:      '#25D36615',

  // ── Wellness Guard accent (driver salud) ──────────────────────
  wellness:        '#10B981',
  wellnessBg:      '#D1FAE5',
} as const;

export type ColorToken = keyof typeof COLORS;
