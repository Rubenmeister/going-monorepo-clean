/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Going Brand Colors — Official (from brand guidelines 2024)
        primary: '#ff4c41',
        'primary-50': '#fff2f2',
        'primary-100': '#ffe4e2',
        'primary-200': '#ffc9c5',
        'primary-300': '#ffada8',
        'primary-400': '#ff7f75',
        'primary-500': '#ff4c41',
        'primary-600': '#e63a2f',
        'primary-700': '#cc2820',
        'primary-800': '#b31811',
        'primary-900': '#991008',

        // Going Color Aliases
        'going-red': '#ff4c41',
        'going-red-dark': '#e63a2f',
        'going-red-light': '#fff2f2',
        'going-yellow': '#ffd253',
        'going-yellow-dark': '#e6ba3a',
        'going-yellow-light': '#fffbeb',

        // Accent / Brand Black
        accent: '#000000',
        'accent-50': '#F9FAFB',
        'accent-100': '#F3F4F6',
        'accent-200': '#E5E7EB',
        'accent-300': '#D1D5DB',
        'accent-400': '#9CA3AF',
        'accent-500': '#6B7280',
        'accent-600': '#4B5563',
        'accent-700': '#374151',
        'accent-800': '#1F2937',

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },

      fontFamily: {
        // Brand fonts (Nunito Sans for titles, Roboto for body)
        sans: [
          'Roboto',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        display: ['Nunito Sans', 'Nunito', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },

      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },

      spacing: {
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
      },

      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },

      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },

      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
      },
    },
  },

  plugins: [],
};
