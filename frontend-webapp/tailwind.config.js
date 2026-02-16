/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    '../../libs/shared/ui/src/**/*.{ts,tsx}',
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
