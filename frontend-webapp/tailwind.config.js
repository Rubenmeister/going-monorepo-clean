// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Going Brand Colors — Going_Branding Guidelines_2024
        'going-primary': '#ff4c41', // Red (dominant brand color)
        'going-primary-dark': '#cc3c33', // Darker red for hover states
        'going-accent': '#ffd253',  // Yellow (chromatic accent)
        'going-black': '#000000',   // Black
        'going-success': '#06A77D', // Green
        'going-warning': '#F4A261', // Warning orange
      },
      fontFamily: {
        // Going Brand Typography
        'sans': [
          'Nunito Sans Variable',
          'Nunito Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Arial',
          'sans-serif',
        ],
        'body': [
          'Roboto',
          'ui-sans-serif',
          'system-ui',
          'Arial',
          'sans-serif',
        ],
      },
      spacing: {
        'sidebar': '16rem', // 256px for sidebar
      },
    },
  },
  plugins: [],
};
