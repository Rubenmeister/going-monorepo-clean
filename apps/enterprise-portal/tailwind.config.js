const { join } = require('path');

// Shared tailwind preset
let sharedPreset;
try {
  sharedPreset = require('../../libs/shared/ui/src/tailwind.preset');
} catch (e) {
  console.warn('Could not load shared preset, using empty preset');
  sharedPreset = {};
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],
  content: [
    // App source files
    join(__dirname, 'src/**/*.{ts,tsx,html,js,jsx}'),
    join(__dirname, 'index.html'),
    // Shared UI library
    join(__dirname, '../../libs/shared/ui/src/**/*.{ts,tsx,js,jsx}'),
    // Features from shared libs
    join(__dirname, '../../libs/frontend/**/*.{ts,tsx,js,jsx}'),
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

