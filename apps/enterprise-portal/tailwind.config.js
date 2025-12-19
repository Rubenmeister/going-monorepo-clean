const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const sharedPreset = require('../../libs/shared/ui/tailwind.preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],
  content: [
    join(__dirname, '{src,pages,components}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        // Corporate Trust Palette
        primary: {
          DEFAULT: '#1e40af', // Enterprise Blue
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#64748b', // Slate
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#ff4c41', // Going Red (Brand Accent)
          foreground: '#ffffff',
        },
        background: '#f8fafc', // Slate-50
        surface: '#ffffff',
      },
    },
  },
  plugins: [],
};
