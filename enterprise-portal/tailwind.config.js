/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0033A0',
        'brand-yellow': '#FFCD00',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
      },
    },
  },
  plugins: [],
};
