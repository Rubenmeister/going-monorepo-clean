import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'going-red': '#ff4c41',
        'going-dark': '#011627',
        'going-navy': '#0a2540',
        'going-cream': '#faf8f5',
      },
      fontFamily: {
        sans: ['Nunito Sans', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
