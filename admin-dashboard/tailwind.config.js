import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
import { join } from 'path';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'apps/**/!(*.stories|*.spec).{ts,tsx,html}'),
    join(__dirname, 'libs/**/!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff4c41',
          light: '#ff7a72',
          dark: '#d93a30',
        },
        secondary: {
          DEFAULT: '#ffd253',
          light: '#ffe085',
          dark: '#e6b833',
        },
        accent: '#000000',
      },
      fontFamily: {
        heading: ["'Nunito Sans Variable'", "'Nunito Sans'", 'sans-serif'],
        body: ["'Roboto'", 'sans-serif'],
      },
    },
  },
  plugins: [],
};
