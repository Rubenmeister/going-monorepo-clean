/**
 * COLOR PALETTE
 *
 * Primary: Professional Blue - Trust, Stability, Tech-forward
 * Accent: Energetic Orange - Action, Energy, Confidence
 * Support: Nature Green - Success, Positive outcomes
 *
 * Used across all apps for consistency
 */

// Primary Colors - Main brand colors
export const COLORS_PRIMARY = {
  50: '#F0F5FF',
  100: '#E0EBFF',
  200: '#C1D7FF',
  300: '#A3C3FF',
  400: '#7FA8FF',
  500: '#5B8EFF', // PRIMARY BLUE - Use this most
  600: '#4B7AE8',
  700: '#3B66D1',
  800: '#2B52BA',
  900: '#1B3EA3',
  950: '#0B2A8C',
} as const;

// Accent Colors - Call to action, highlights
export const COLORS_ACCENT = {
  50: '#FFF5F0',
  100: '#FFEBE0',
  200: '#FFD7C1',
  300: '#FFC3A3',
  400: '#FFAE7F',
  500: '#FF9A5B', // ACCENT ORANGE - Use for CTAs
  600: '#E8854B',
  700: '#D1703B',
  800: '#BA5B2B',
  900: '#A3461B',
  950: '#8C310B',
} as const;

// Semantic Colors
export const COLORS_SEMANTIC = {
  success: '#10B981', // Green - Positive outcomes
  warning: '#F59E0B', // Amber - Caution
  error: '#EF4444', // Red - Errors, destructive
  info: '#3B82F6', // Blue - Information
} as const;

// Neutral Colors - Backgrounds, borders, text
export const COLORS_NEUTRAL = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
  950: '#030712',
} as const;

// Text Colors
export const COLORS_TEXT = {
  primary: COLORS_NEUTRAL[900], // #111827 - Main text
  secondary: COLORS_NEUTRAL[600], // #4B5563 - Secondary text
  tertiary: COLORS_NEUTRAL[500], // #6B7280 - Tertiary text
  disabled: COLORS_NEUTRAL[400], // #9CA3AF - Disabled text
  light: '#FFFFFF', // White - On dark backgrounds
} as const;

// Background Colors
export const COLORS_BACKGROUND = {
  primary: '#FFFFFF', // Main background
  secondary: COLORS_NEUTRAL[50], // #F9FAFB - Secondary areas
  tertiary: COLORS_NEUTRAL[100], // #F3F4F6 - Tertiary areas
  dark: COLORS_NEUTRAL[900], // #111827 - Dark backgrounds
  hover: COLORS_NEUTRAL[50], // #F9FAFB - Hover states
} as const;

// Border Colors
export const COLORS_BORDER = {
  light: COLORS_NEUTRAL[200], // #E5E7EB - Light borders
  DEFAULT: COLORS_NEUTRAL[300], // #D1D5DB - Default borders
  dark: COLORS_NEUTRAL[400], // #9CA3AF - Dark borders
} as const;

// Complete Palette Export
export const COLORS = {
  primary: COLORS_PRIMARY,
  accent: COLORS_ACCENT,
  semantic: COLORS_SEMANTIC,
  neutral: COLORS_NEUTRAL,
  text: COLORS_TEXT,
  background: COLORS_BACKGROUND,
  border: COLORS_BORDER,
} as const;

// Legacy color names for migration
export const COLORS_LEGACY = {
  'primary-blue': COLORS_PRIMARY[500],
  'accent-orange': COLORS_ACCENT[500],
  'success-green': COLORS_SEMANTIC.success,
  'warning-amber': COLORS_SEMANTIC.warning,
  'error-red': COLORS_SEMANTIC.error,
} as const;
