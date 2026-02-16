/**
 * Going Design Tokens
 * Single source of truth for brand colors, typography, and spacing.
 * Used by web (Tailwind) and mobile (React Native StyleSheet) apps.
 */

export const colors = {
  primary: '#ff4c41',
  primaryLight: '#ff7a72',
  primaryDark: '#d93a30',

  secondary: '#ffd253',
  secondaryLight: '#ffe085',
  secondaryDark: '#e6b833',

  black: '#000000',
  white: '#ffffff',

  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

export const fonts = {
  heading: "'Nunito Sans Variable', 'Nunito Sans', sans-serif",
  body: "'Roboto', sans-serif",
} as const;

export const fontsMobile = {
  heading: 'NunitoSans-Regular',
  headingBold: 'NunitoSans-Bold',
  headingSemiBold: 'NunitoSans-SemiBold',
  body: 'Roboto',
  bodyBold: 'Roboto-Bold',
  bodyMedium: 'Roboto-Medium',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
