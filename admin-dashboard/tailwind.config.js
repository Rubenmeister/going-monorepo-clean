import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
import { join } from 'path';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Rutas para que Tailwind escanee todos los archivos del monorepo:
    join(__dirname, 'apps/**/!(*.stories|*.spec).{ts,tsx,html}'),
    join(__dirname, 'libs/**/!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
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