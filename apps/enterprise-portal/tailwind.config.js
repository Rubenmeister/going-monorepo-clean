/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'going-red': '#ff4c41',
        'going-red-dark': '#e63e34',
        'going-yellow': '#ffd253',
        'enterprise-blue': '#1e40af',
        'enterprise-blue-light': '#3b82f6',
      },
      fontFamily: {
        heading: ['Nunito Sans', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
