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
        darkCharcoal: '#1A1A1A',
        // Regional System
        region: {
          costa: '#FFD253',   // Warm Yellow
          sierra: '#8B4513',  // Earth/Maroon
          amazonia: '#228B22',// Forest Green
          galapagos: '#008080'// Teal/Blue
        }
      },
      backgroundImage: {
        'pattern-andino': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 4h2v2H5V5zm4 4h2v2H9V9zm4 4h2v2h-2v-2zm4 4h2v2h-2v-2z' fill='%238B4513' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        'pattern-costa': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10s4-2 10 0 10 0 10 0v2s-4 2-10 0-10 0-10 0v-2z' fill='%23FFD253' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        'pattern-amazonia': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L0 20h20L10 0z' fill='%23228B22' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        'pattern-galapagos': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='5' fill='%23008080' fill-opacity='0.1'/%3E%3C/svg%3E\")",
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
        driveFull: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(120vw)' },
        },
        driveArrive: {
          '0%': { opacity: '0', transform: 'translateX(-100%) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        }
      },
      animation: {
        'zoom-in': 'zoomIn 1.2s cubic-bezier(0.2, 0, 0, 1) forwards',
        'fade-in': 'fadeIn 0.8s ease-out 0.8s forwards',
        'drive-in': 'driveIn 2.5s ease-in forwards',
        'drive-arrive': 'driveArrive 1s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'drive-full': 'driveFull 3s linear forwards',
      },
    },
  },
  plugins: [],
};