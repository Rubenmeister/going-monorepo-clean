const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    // RUTA ABSOLUTA: A prueba de fallos en Windows
    join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    join(__dirname, 'index.html'),
  ],
  theme: {
    extend: {
      colors: {
        // GOING Brand Colors
        'going-red': '#ff4c41',
        'going-yellow': '#ffd253',
        'going-black': '#000000',
        brand: {
          red: '#ff4c41',      // Going Red (Official)
          black: '#1A1A1A',    // Dark Charcoal
          white: '#ffffff',
          gray: '#F5F5F5',     // Off-White
          blue: '#0066FF',     // Electric Blue
        },
        brandRed: '#ff4c41',
        electricBlue: '#0066FF',
        darkCharcoal: '#1A1A1A'
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'sans-serif'],
        spaceGrotesk: ['"Space Grotesk"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        neo: '4px 4px 0px 0px rgba(0,0,0,1)',
      },
      keyframes: {
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        driveIn: {
          '0%': { opacity: '0', transform: 'scale(0.1) translateY(20px)' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'scale(5) translateY(50px)' }, // Zoom past camera
        },
        driveArrive: {
          '0%': { opacity: '0', transform: 'translateX(-100%) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        }
      },
      animation: {
        'zoom-in': 'zoomIn 1.2s cubic-bezier(0.2, 0, 0, 1) forwards',
        'fade-in': 'fadeIn 0.8s ease-out 0.8s forwards', // Delayed fade in
        'drive-in': 'driveIn 2.5s ease-in forwards',
        'drive-arrive': 'driveArrive 1s cubic-bezier(0.25, 1, 0.5, 1) forwards',
      },
    },
  },
  plugins: [],
};