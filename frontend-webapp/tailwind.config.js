const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // RUTA ABSOLUTA: A prueba de fallos en Windows
    join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, 'index.html'),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#ff4c41',    // Rojo Going
          black: '#000000',
          white: '#ffffff',
          gray: '#f3f4f6',
        }
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};