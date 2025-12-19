const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Official Brand Colors from Guidelines
        primary: {
          DEFAULT: '#ff4c41', // Going Red
          foreground: '#ffffff',
          dark: '#e63e34',    // Darker shade for hover
          light: '#ff7066',   // Lighter shade
        },
        secondary: {
          DEFAULT: '#ffd253', // Going Yellow
          foreground: '#000000',
          dark: '#e6b845',
        },
        neutral: {
          DEFAULT: '#000000', // Going Black
          foreground: '#ffffff',
          destructive: '#ff4c41', // Alias for errors
        },
        // Semantic/Functional Aliases
        background: '#ffffff',
        foreground: '#000000',
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#737373',
        },
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#ff4c41',
        // Dark Mode specifics (if needed in future)
        dark: {
          bg: '#141414',      // Charcoal
          surface: '#1f1f1f',
          border: '#333333',
        }
      },
      fontFamily: {
        heading: ['"Nunito Sans"', ...fontFamily.sans],
        body: ['Roboto', ...fontFamily.sans],
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
    },
  },
  plugins: [],
};
