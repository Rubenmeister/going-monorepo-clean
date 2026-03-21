import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const BRAND_RED = '#ff4c41';
const BRAND_RED_DARK = '#e63a2f';
const BRAND_YELLOW = '#ffd253';

const replacements = [
  // Blue primary → Going Red
  ['bg-blue-600', `bg-[${BRAND_RED}]`],
  ['hover:bg-blue-700', `hover:bg-[${BRAND_RED_DARK}]`],
  ['bg-blue-700', `bg-[${BRAND_RED_DARK}]`],
  ['text-blue-600', `text-[${BRAND_RED}]`],
  ['hover:text-blue-600', `hover:text-[${BRAND_RED}]`],
  ['bg-blue-50', 'bg-red-50'],
  ['bg-blue-100', 'bg-red-100'],
  ['border-blue-600', `border-[${BRAND_RED}]`],
  ['border-blue-200', 'border-red-200'],
  ['border-blue-100', 'border-red-100'],
  ['focus:ring-blue-500', `focus:ring-[${BRAND_RED}]`],
  ['text-blue-900', 'text-gray-900'],
  ['text-blue-100', 'text-red-100'],
  ['text-blue-200', 'text-red-200'],
  // Indigo → Going Red
  [`bg-[#F05A3E]`, `bg-[${BRAND_RED}]`],
  [`bg-[#D94935]`, `bg-[${BRAND_RED_DARK}]`],
  [`hover:bg-[#D94935]`, `hover:bg-[${BRAND_RED_DARK}]`],
  [`text-[#F05A3E]`, `text-[${BRAND_RED}]`],
  [`hover:text-[#F05A3E]`, `hover:text-[${BRAND_RED}]`],
  [`focus:ring-[#F05A3E]`, `focus:ring-[${BRAND_RED}]`],
  ['bg-indigo-600', `bg-[${BRAND_RED}]`],
  ['hover:bg-indigo-700', `hover:bg-[${BRAND_RED_DARK}]`],
  ['text-indigo-600', `text-[${BRAND_RED}]`],
  ['bg-indigo-50', 'bg-red-50'],
  ['bg-indigo-100', 'bg-red-100'],
  ['hover:border-indigo-300', 'hover:border-red-300'],
  ['hover:text-indigo-600', `hover:text-[${BRAND_RED}]`],
  ['from-indigo-600 to-purple-600', `from-[${BRAND_RED}] to-[${BRAND_RED_DARK}]`],
  ['from-indigo-50 to-purple-50', 'from-red-50 to-orange-50'],
  // Orange → Going Yellow accent
  ['bg-orange-50', 'bg-red-50'],
  // Ring/focus going red
  ['ring-indigo-500', `ring-[${BRAND_RED}]`],
];

function processDir(dir) {
  const entries = readdirSync(dir);
  let updated = 0;
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== 'node_modules' && entry !== '.next') {
      updated += processDir(fullPath);
    } else if (stat.isFile() && ['.tsx', '.ts', '.css'].includes(extname(entry))) {
      let content = readFileSync(fullPath, 'utf8');
      const original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', entry);
        updated++;
      }
    }
  }
  return updated;
}

const total = processDir('./src');
console.log(`\nDone! Updated ${total} files with Going brand colors.`);
