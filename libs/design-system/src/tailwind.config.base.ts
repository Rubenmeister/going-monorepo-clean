/**
 * TAILWIND BASE CONFIGURATION
 *
 * Shared configuration used by all Tailwind-based apps
 * Import and extend this in each app's tailwind.config.js
 *
 * @example
 * import baseConfig from '@going-monorepo-clean/design-system/tailwind.config.base';
 *
 * module.exports = {
 *   ...baseConfig,
 *   content: ['./src/**\/{js,ts,jsx,tsx}'],
 *   // Additional app-specific config
 * };
 */

import type { Config } from 'tailwindcss';
import {
  COLORS_PRIMARY,
  COLORS_ACCENT,
  COLORS_SEMANTIC,
  COLORS_NEUTRAL,
  COLORS_TEXT,
  COLORS_BACKGROUND,
  COLORS_BORDER,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
} from './index';

const baseConfig: Config = {
  theme: {
    extend: {
      // Colors
      colors: {
        // Primary brand colors
        primary: COLORS_PRIMARY[500],
        'primary-light': COLORS_PRIMARY[100],
        'primary-dark': COLORS_PRIMARY[900],

        // Accent colors
        accent: COLORS_ACCENT[500],
        'accent-light': COLORS_ACCENT[100],
        'accent-dark': COLORS_ACCENT[900],

        // Semantic colors
        success: COLORS_SEMANTIC.success,
        warning: COLORS_SEMANTIC.warning,
        error: COLORS_SEMANTIC.error,
        info: COLORS_SEMANTIC.info,

        // Neutral palette
        neutral: COLORS_NEUTRAL,

        // Background colors
        'bg-primary': COLORS_BACKGROUND.primary,
        'bg-secondary': COLORS_BACKGROUND.secondary,
        'bg-tertiary': COLORS_BACKGROUND.tertiary,
      },

      // Typography
      fontFamily: {
        sans: TYPOGRAPHY.fonts.sans,
        display: TYPOGRAPHY.fonts.display,
        mono: TYPOGRAPHY.fonts.mono,
      },

      fontSize: TYPOGRAPHY.fontSize,
      fontWeight: TYPOGRAPHY.fontWeight,
      lineHeight: TYPOGRAPHY.lineHeight,
      letterSpacing: TYPOGRAPHY.letterSpacing,

      // Spacing
      spacing: SPACING,

      gap: SPACING,
      padding: SPACING,
      margin: SPACING,

      // Shadows
      boxShadow: SHADOWS,

      // Border radius
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },

      // Transitions
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
      },

      // Border width
      borderWidth: {
        DEFAULT: '1px',
        0: '0',
        2: '2px',
        4: '4px',
        8: '8px',
      },
    },
  },

  plugins: [],
};

export default baseConfig;
