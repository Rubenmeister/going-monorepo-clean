/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './libs/shared/ui/src/**/*.{js,ts,jsx,tsx}',
    './frontend-webapp/src/**/*.{js,ts,jsx,tsx}',
    './admin-dashboard/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        going: {
          blue: '#2563EB',
          'blue-dark': '#1D4ED8',
          'blue-light': '#3B82F6',
          green: '#10B981',
          'green-dark': '#059669',
          orange: '#F59E0B',
          red: '#EF4444',
          'gray-50': '#F9FAFB',
          'gray-100': '#F3F4F6',
          'gray-900': '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
