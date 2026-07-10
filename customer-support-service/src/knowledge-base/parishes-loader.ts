/**
 * Ecuador Parishes Knowledge Base Loader
 * Loads parish JSON files and exposes a lookup function for the agent.
 */
import * as fs from 'fs';
import * as path from 'path';

/**
 * Forma de cada parroquia en el KB. Definida localmente a propósito: antes se
 * importaba `import type` desde `scripts/ecuador-parishes/harvest-parishes`, pero
 * el Dockerfile NO copia `scripts/` al contexto de build → tras quitar el parche
 * skipTypeChecking, el type-check del Docker/CD fallaba con TS2307. El script
 * generador mantiene su propia copia de esta interfaz; ambas deben coincidir.
 */
export interface ParishData {
  id: string;
  name: string;
  canton: string;
  province: string;
  region: 'Costa' | 'Sierra' | 'Amazonía' | 'Galápagos';
  geography: string;
  climate: string;
  history: string;
  demographics: string;
  attractions: string[];
  gastronomy: string[];
  activities: string[];
  how_to_get_there: string;
  best_months: string[];
  curiosities: string;
}

const PARISHES_DIR = path.join(__dirname, 'parishes');

// Lazy-loaded cache
let _index: Record<string, { province: string; canton: string; file: string }> | null = null;
let _cache: Record<string, ParishData> = {};

function getIndex() {
  if (_index) return _index;
  const indexFile = path.join(PARISHES_DIR, 'index.json');
  if (!fs.existsSync(indexFile)) return {};
  _index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  return _index!;
}

function loadProvince(file: string): Record<string, ParishData> {
  const filePath = path.join(PARISHES_DIR, file);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Find a parish by name (fuzzy match).
 * Returns null if not found.
 */
export function findParish(name: string): ParishData | null {
  const key = name.toLowerCase().trim();
  const index = getIndex();

  // Exact match
  if (index[key]) {
    const { file } = index[key];
    if (!_cache[key]) {
      const data = loadProvince(file);
      const parish = Object.values(data).find(p => p.name.toLowerCase() === key);
      if (parish) _cache[key] = parish;
    }
    return _cache[key] || null;
  }

  // Partial match
  const partialKey = Object.keys(index).find(k => k.includes(key) || key.includes(k));
  if (partialKey) {
    return findParish(partialKey);
  }

  return null;
}

/**
 * Generate a context block for the agent system prompt.
 */
export function getParishContext(parishName: string): string {
  const parish = findParish(parishName);
  if (!parish) return '';

  return `
## Destino: ${parish.name} (${parish.canton}, ${parish.province})
- **Región**: ${parish.region}
- **Geografía**: ${parish.geography}
- **Clima**: ${parish.climate}
- **Historia**: ${parish.history}
- **Atractivos**: ${parish.attractions.join(', ')}
- **Gastronomía**: ${parish.gastronomy.join(', ')}
- **Actividades**: ${parish.activities.join(', ')}
- **Cómo llegar**: ${parish.how_to_get_there}
- **Mejor época**: ${parish.best_months.join(', ')}
- **Dato curioso**: ${parish.curiosities}
`;
}

/**
 * Get all parishes in a canton or province.
 */
export function getParishesByCanton(canton: string, province?: string): ParishData[] {
  const index = getIndex();
  const results: ParishData[] = [];
  const seen = new Set<string>();

  for (const [, meta] of Object.entries(index)) {
    if (meta.canton.toLowerCase() !== canton.toLowerCase()) continue;
    if (province && meta.province.toLowerCase() !== province.toLowerCase()) continue;
    if (seen.has(meta.file)) continue;

    const data = loadProvince(meta.file);
    for (const parish of Object.values(data)) {
      if (parish.canton.toLowerCase() === canton.toLowerCase()) {
        results.push(parish);
      }
    }
    seen.add(meta.file);
  }
  return results;
}
