import { join } from 'path';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Admin dashboard source files
    join(__dirname, 'src/**/*.{ts,tsx,html}'),
    // Shared libraries that may contain components
    join(__dirname, '../libs/**/*.{ts,tsx,html}'),
  ],
  presets: [
    require('../../libs/shared/ui/src/tailwind.preset.js')
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};