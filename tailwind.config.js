/** @type {import('tailwindcss').Config} */

// Import design system tokens
const {
  COLORS_PRIMARY,
  COLORS_ACCENT,
  COLORS_SEMANTIC,
  COLORS_NEUTRAL,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
} = require('./libs/design-system/src/index.ts');

module.exports = {
  content: [
    './libs/shared/ui/src/**/*.{js,ts,jsx,tsx}',
    './frontend-webapp/src/**/*.{js,ts,jsx,tsx}',
    './admin-dashboard/src/**/*.{js,ts,jsx,tsx}',
    './apps/corporate-portal/pages/**/*.{js,ts,jsx,tsx}',
    './apps/corporate-portal/components/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // Colors from design system
      colors: {
        // Primary brand (Professional Blue)
        primary: COLORS_PRIMARY[500],
        'primary-50': COLORS_PRIMARY[50],
        'primary-100': COLORS_PRIMARY[100],
        'primary-200': COLORS_PRIMARY[200],
        'primary-300': COLORS_PRIMARY[300],
        'primary-400': COLORS_PRIMARY[400],
        'primary-500': COLORS_PRIMARY[500],
        'primary-600': COLORS_PRIMARY[600],
        'primary-700': COLORS_PRIMARY[700],
        'primary-800': COLORS_PRIMARY[800],
        'primary-900': COLORS_PRIMARY[900],
        'primary-950': COLORS_PRIMARY[950],

        // Accent (Energetic Orange)
        accent: COLORS_ACCENT[500],
        'accent-50': COLORS_ACCENT[50],
        'accent-100': COLORS_ACCENT[100],
        'accent-200': COLORS_ACCENT[200],
        'accent-300': COLORS_ACCENT[300],
        'accent-400': COLORS_ACCENT[400],
        'accent-500': COLORS_ACCENT[500],
        'accent-600': COLORS_ACCENT[600],
        'accent-700': COLORS_ACCENT[700],
        'accent-800': COLORS_ACCENT[800],
        'accent-900': COLORS_ACCENT[900],
        'accent-950': COLORS_ACCENT[950],

        // Semantic colors
        success: COLORS_SEMANTIC.success,
        warning: COLORS_SEMANTIC.warning,
        error: COLORS_SEMANTIC.error,
        info: COLORS_SEMANTIC.info,

        // Neutral palette
        neutral: COLORS_NEUTRAL,
      },

      // Typography
      fontFamily: {
        sans: ["'Inter'", ...TYPOGRAPHY.fonts.sans],
        display: ["'Poppins'", ...TYPOGRAPHY.fonts.display],
        mono: ["'Fira Code'", ...TYPOGRAPHY.fonts.mono],
      },

      fontSize: TYPOGRAPHY.fontSize,
      fontWeight: TYPOGRAPHY.fontWeight,
      lineHeight: TYPOGRAPHY.lineHeight,
      letterSpacing: TYPOGRAPHY.letterSpacing,

      // Spacing
      spacing: SPACING,

      // Shadows
      boxShadow: SHADOWS,

      // Border radius
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        base: '0.375rem',
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
    },
  },

  plugins: [],
};
