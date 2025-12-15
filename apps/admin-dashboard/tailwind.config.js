import { join } from 'path';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Admin dashboard source files
    join(__dirname, 'src/**/*.{ts,tsx,html}'),
    // Shared libraries that may contain components
    join(__dirname, '../libs/**/*.{ts,tsx,html}'),
  ],
  theme: {
    extend: {
      colors: {
        // GOING Official Brand Colors
        'going-red': '#ff4c41',
        'going-red-dark': '#e63e34',
        'going-yellow': '#ffd253',
        'going-yellow-dark': '#e6b845',
        'going-black': '#000000',
        // Dark UI Neutrals
        'charcoal': '#141414',
        'surface': '#1f1f1f',
        'surface-hover': '#2a2a2a',
        'border': '#333333',
        // Semantic Colors
        'success': '#00c853',
        'warning': '#ffd253',
        'error': '#ff4c41',
        'info': '#2196f3',
      },
      fontFamily: {
        'heading': ['Nunito Sans', 'sans-serif'],
        'body': ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};