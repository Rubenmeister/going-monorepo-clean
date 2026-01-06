import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Audit Environment Script
 * 
 * Compares .env.example with the current shell environment and .env file.
 * Reports missing or empty variables.
 */

const rootDir = process.cwd();
const examplePath = path.join(rootDir, '.env.example');
const actualPath = path.join(rootDir, '.env');
const logPath = path.join(rootDir, 'audit-env-result.log');

let logContent = '--- Environment Audit ---\n';
logContent += `Checking: ${examplePath}\n`;

if (!fs.existsSync(examplePath)) {
  logContent += 'Error: .env.example not found in ' + rootDir + '\n';
  fs.writeFileSync(logPath, logContent);
  process.exit(1);
}

// Load actual .env file if it exists
if (fs.existsSync(actualPath)) {
  logContent += 'Loading local .env file...\n';
  dotenv.config({ path: actualPath });
} else {
  logContent += 'No .env file found, checking shell environment only.\n';
}

const exampleContent = fs.readFileSync(examplePath, 'utf8');
const exampleLines = exampleContent.split('\n');

const requiredVars: string[] = [];
exampleLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const key = trimmed.split('=')[0];
    requiredVars.push(key);
  }
});

const missing: string[] = [];
const empty: string[] = [];
const ok: string[] = [];

requiredVars.forEach(key => {
  const value = process.env[key];
  if (value === undefined) {
    missing.push(key);
  } else if (value.trim() === '') {
    empty.push(key);
  } else {
    ok.push(key);
  }
});

logContent += '\nResults:\n';
logContent += `✅ OK: ${ok.length}\n`;
logContent += `⚠️ Empty: ${empty.length}\n`;
logContent += `❌ Missing: ${missing.length}\n`;

if (empty.length > 0) {
  logContent += '\n--- Empty Variables ---\n';
  empty.forEach(k => logContent += `[ ] ${k}\n`);
}

if (missing.length > 0) {
  logContent += '\n--- Missing Variables ---\n';
  missing.forEach(k => logContent += `[X] ${k}\n`);
}

if (missing.length === 0 && empty.length === 0) {
  logContent += '\n✨ All environment variables are set correctly!\n';
} else {
  logContent += '\n🚨 Audit failed. Please update your environment.\n';
}

fs.writeFileSync(logPath, logContent);
console.log(logContent);
