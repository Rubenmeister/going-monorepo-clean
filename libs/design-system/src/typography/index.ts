/**
 * TYPOGRAPHY SYSTEM
 *
 * Defines font families, sizes, weights, and line heights
 * for consistent text throughout the platform
 */

export const TYPOGRAPHY = {
  // Font families
  fonts: {
    // Primary sans-serif - used for main content
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif',
    ],
    // Secondary sans-serif - for longer content
    display: ['Poppins', 'Inter', 'sans-serif'],
    // Monospace - for code, technical content
    mono: ['Fira Code', 'Courier New', 'monospace'],
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  // Font weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text styles (for quick application)
  styles: {
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: '1.25',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: '1.375',
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: '1.375',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: '1.5',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: '1.5',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: '1.5',
    },
    body: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: '1.5',
    },
    bodySmall: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1.5',
    },
  },
} as const;
