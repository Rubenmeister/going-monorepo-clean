#!/usr/bin/env npx ts-node
/**
 * GOING — Ecuador Parish Data Harvester
 * Fetches data from Wikipedia API for each parish, enriches with Claude,
 * and saves as JSON files organized by province.
 *
 * Usage:
 *   npx ts-node scripts/ecuador-parishes/harvest-parishes.ts
 *   npx ts-node scripts/ecuador-parishes/harvest-parishes.ts --province=pichincha
 *   npx ts-node scripts/ecuador-parishes/harvest-parishes.ts --resume   (skip already done)
 *
 * Output: customer-support-service/src/knowledge-base/parishes/{province}.json
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { ECUADOR_INDEX, ProvinceIndex } from './provinces-index';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ Set ANTHROPIC_API_KEY env var before running.');
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const RESUME = args.includes('--resume');
const PROVINCE_FILTER = args.find(a => a.startsWith('--province='))?.split('=')[1];

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(ROOT, 'customer-support-service/src/knowledge-base/parishes');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Types ─────────────────────────────────────────────────────────────────
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

// ─── Wikipedia fetch ────────────────────────────────────────────────────────
async function fetchWikipedia(query: string): Promise<string> {
  try {
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' Ecuador parroquia')}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as any;

    if (!searchData.query?.search?.length) return '';

    const title = searchData.query.search[0].title;
    const contentUrl = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    const contentRes = await fetch(contentUrl);
    const contentData = await contentRes.json() as any;

    const pages = contentData.query?.pages;
    if (!pages) return '';
    const page = Object.values(pages)[0] as any;
    return page?.extract?.slice(0, 3000) || '';
  } catch {
    return '';
  }
}

// ─── Enrich with Claude ─────────────────────────────────────────────────────
async function enrichWithClaude(
  name: string,
  canton: string,
  province: string,
  region: string,
  wikiText: string
): Promise<Omit<ParishData, 'id' | 'name' | 'canton' | 'province' | 'region'>> {
  const prompt = `Eres un experto en turismo y geografía del Ecuador. Genera información turística sobre la parroquia "${name}", cantón ${canton}, provincia ${province} (${region}).

${wikiText ? `Información de Wikipedia:\n${wikiText}\n\n` : ''}

Devuelve SOLO un objeto JSON válido con esta estructura exacta:
{
  "geography": "descripción de geografía, ubicación, altitud, paisaje en 2-3 oraciones",
  "climate": "descripción del clima, temperatura promedio, estaciones",
  "history": "breve historia o fundación en 1-2 oraciones",
  "demographics": "población aproximada, grupos étnicos, características",
  "attractions": ["atractivo1", "atractivo2", "atractivo3"],
  "gastronomy": ["plato1", "plato2", "plato3"],
  "activities": ["actividad turística1", "actividad2", "actividad3"],
  "how_to_get_there": "cómo llegar desde la capital provincial más cercana",
  "best_months": ["mes1", "mes2"],
  "curiosities": "dato curioso o especial de esta parroquia en 1 oración"
}

Si no tienes información específica, usa datos razonables basados en la región (${region}) del Ecuador. Devuelve SOLO el JSON, sin texto adicional.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',   // Haiku para reducir costos en 1100 llamadas
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback mínimo si Claude falla
    return {
      geography: `Parroquia ubicada en la ${region} del Ecuador, provincia de ${province}.`,
      climate: region === 'Costa' ? 'Tropical, cálido y húmedo' : region === 'Sierra' ? 'Templado de montaña' : 'Cálido húmedo amazónico',
      history: `Parroquia del cantón ${canton}, provincia de ${province}.`,
      demographics: 'Población rural con comunidades locales.',
      attractions: ['Paisajes naturales', 'Cultura local', 'Arquitectura tradicional'],
      gastronomy: ['Comida típica de la región', 'Productos locales'],
      activities: ['Turismo comunitario', 'Senderismo', 'Fotografía paisajística'],
      how_to_get_there: `Accesible desde la capital del cantón ${canton}.`,
      best_months: ['Junio', 'Julio', 'Agosto'],
      curiosities: `Parroquia con tradiciones propias de la ${region} ecuatoriana.`,
    };
  }
}

// ─── Process one province ───────────────────────────────────────────────────
async function processProvince(province: ProvinceIndex): Promise<void> {
  const outputFile = path.join(OUTPUT_DIR, `${province.id}.json`);

  // Load existing data if resuming
  let existing: Record<string, ParishData> = {};
  if (RESUME && fs.existsSync(outputFile)) {
    existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    console.log(`  ↻ Resuming ${province.name} — ${Object.keys(existing).length} already done`);
  }

  const allParishes: ParishData[] = Object.values(existing);

  for (const canton of province.cantons) {
    for (const parishName of canton.parishes) {
      const id = `${province.id}-${canton.id}-${parishName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

      // Skip if already processed
      if (existing[id]) {
        process.stdout.write('·');
        continue;
      }

      process.stdout.write(`\n    → ${parishName} (${canton.name})...`);

      // Fetch Wikipedia data
      const wikiText = await fetchWikipedia(`${parishName} ${canton.name} ${province.name}`);

      // Enrich with Claude
      const enriched = await enrichWithClaude(
        parishName, canton.name, province.name, province.region, wikiText
      );

      const parish: ParishData = {
        id,
        name: parishName,
        canton: canton.name,
        province: province.name,
        region: province.region,
        ...enriched,
      };

      allParishes.push(parish);

      // Save incrementally after each parish (avoid losing progress)
      const dataMap = Object.fromEntries(allParishes.map(p => [p.id, p]));
      fs.writeFileSync(outputFile, JSON.stringify(dataMap, null, 2), 'utf8');

      process.stdout.write(' ✓');

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const totalParishes = province.cantons.reduce((sum, c) => sum + c.parishes.length, 0);
  console.log(`\n  ✅ ${province.name}: ${allParishes.length}/${totalParishes} parroquias`);
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const provinces = PROVINCE_FILTER
    ? ECUADOR_INDEX.filter(p => p.id === PROVINCE_FILTER || p.name.toLowerCase() === PROVINCE_FILTER.toLowerCase())
    : ECUADOR_INDEX;

  if (provinces.length === 0) {
    console.error(`❌ Province not found: ${PROVINCE_FILTER}`);
    process.exit(1);
  }

  const totalParishes = provinces.reduce((sum, p) =>
    sum + p.cantons.reduce((s, c) => s + c.parishes.length, 0), 0
  );

  console.log(`\n🗺️  GOING Ecuador Parish Harvester`);
  console.log(`   Provinces: ${provinces.length} | Cantons: ${provinces.reduce((s, p) => s + p.cantons.length, 0)} | Parishes: ~${totalParishes}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  let processed = 0;
  for (const province of provinces) {
    console.log(`\n📍 Province: ${province.name} (${province.region})`);
    await processProvince(province);
    processed++;
    console.log(`   Progress: ${processed}/${provinces.length} provinces`);
  }

  // Generate index file
  generateIndex();

  console.log('\n✅ Done! All parish data saved.');
  console.log(`   Run the loader to integrate into the customer support agent.`);
}

// ─── Generate master index ──────────────────────────────────────────────────
function generateIndex() {
  const indexFile = path.join(OUTPUT_DIR, 'index.json');
  const index: Record<string, { province: string; canton: string; file: string }> = {};

  for (const province of ECUADOR_INDEX) {
    const file = path.join(OUTPUT_DIR, `${province.id}.json`);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [id, parish] of Object.entries(data as Record<string, ParishData>)) {
      index[parish.name.toLowerCase()] = {
        province: parish.province,
        canton: parish.canton,
        file: `${province.id}.json`,
      };
    }
  }

  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf8');
  console.log(`\n📋 Index generated: ${Object.keys(index).length} parishes indexed`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
