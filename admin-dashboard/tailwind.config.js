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
        // Colores primarios de tu marca
        'brand-blue': '#0033A0', // Azul Oscuro (Primario)
        'brand-yellow': '#FFCD00', // Amarillo (Acento)
        // Colores semánticos
        primary: 'var(--color-primary)', 
        accent: 'var(--color-accent)', 
      },
    },
  },
  plugins: [],
};