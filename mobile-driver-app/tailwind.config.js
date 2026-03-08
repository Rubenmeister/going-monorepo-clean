/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'going-red': '#ff4c41',
        'going-dark': '#011627',
      },
    },
  },
  plugins: [],
};
