#!/usr/bin/env node
/**
 * G4 · Deriva de variables de entorno — código vs Cloud Run.
 *
 * Compara qué variables LEE cada servicio en su código contra las que tiene
 * realmente configuradas en Cloud Run (env + secretos).
 *
 * Existe porque en un solo día cuatro funciones estuvieron rotas en producción
 * por una variable ausente, y las cuatro fallaron EN SILENCIO:
 *   · AUTH_SERVICE_URL      → el alta de empresa no provisionaba ("fetch failed"
 *                             contra localhost, tragado por un try/catch)
 *   · PRICING_SERVICE_URL   → /price y /snapshot daban 404 (la ruta solo se
 *                             monta si la variable existe) para web y móvil
 *   · NOTIFICATIONS_SERVICE_URL → ningún aviso salía
 *   · WHATSAPP_* / META_WA_*    → el canal no podía enviar
 *
 * El patrón común: un valor por defecto (localhost o cadena vacía) convierte una
 * variable ausente en una función apagada sin error visible.
 *
 * Uso:  node scripts/check-env-drift.mjs [servicio ...]
 * Requiere gcloud autenticado. Sin gcloud, sale 0 y avisa (no rompe nada).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const PROYECTO = process.env.GOING_PROJECT ?? 'going-5d1ae';
const REGION = process.env.GOING_REGION ?? 'us-central1';

// Solo nombres de infraestructura: URLs, tokens, secretos, claves.
// Filtra ruido tipo NODE_ENV, PORT, LOG_LEVEL.
const RELEVANTE = /_(URL|TOKEN|SECRET|KEY|ID)$/;
const IGNORAR_NOMBRES = new Set(['NODE_ENV', 'PORT', 'LOG_LEVEL', 'TZ', 'HOSTNAME']);

// En Windows gcloud es un .cmd, así que execFile directo no lo encuentra:
// se resuelve el binario una vez y se reutiliza.
let BIN = null;
function gcloud(args) {
  const candidatos = BIN ? [BIN] : ['gcloud', 'gcloud.cmd'];
  let ultimoError;
  for (const bin of candidatos) {
    try {
      const out = execFileSync(bin, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        maxBuffer: 20 * 1024 * 1024,
      });
      BIN = bin;
      return out;
    } catch (e) { ultimoError = e; }
  }
  throw ultimoError;
}

function hayGcloud() {
  try { gcloud(['--version']); return true; } catch { return false; }
}

function archivosTs(dir, acc = []) {
  let e;
  try { e = readdirSync(dir); } catch { return acc; }
  for (const n of e) {
    const p = join(dir, n);
    if (/node_modules|[\\/]dist[\\/]|[\\/]\.next[\\/]/.test(p)) continue;
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) archivosTs(p, acc);
    else if (/\.ts$/.test(p) && !/\.spec\.ts$/.test(p)) acc.push(p);
  }
  return acc;
}

/** Variables que el servicio lee en su código. */
function envsDelCodigo(servicio) {
  const encontradas = new Map(); // nombre -> ejemplo de uso
  for (const f of archivosTs(join(servicio, 'src'))) {
    const src = readFileSync(f, 'utf8');
    const patrones = [
      /process\.env\.([A-Z0-9_]+)/g,
      /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
      /configService\.get<[^>]*>\(\s*['"]([A-Z0-9_]+)['"]/g,
      /config\.get<[^>]*>\(\s*['"]([A-Z0-9_]+)['"]/g,
      /configService\.get\(\s*['"]([A-Z0-9_]+)['"]/g,
    ];
    for (const re of patrones) {
      for (const m of src.matchAll(re)) {
        const nombre = m[1];
        if (IGNORAR_NOMBRES.has(nombre) || !RELEVANTE.test(nombre)) continue;
        if (!encontradas.has(nombre)) encontradas.set(nombre, f);
      }
    }
  }
  return encontradas;
}

/** Variables y secretos configurados en Cloud Run. */
function envsDeCloudRun(servicio) {
  const salida = gcloud([
    'run', 'services', 'describe', servicio,
    '--region', REGION, '--project', PROYECTO, '--format', 'json',
  ]);
  const d = JSON.parse(salida);
  const envs = d?.spec?.template?.spec?.containers?.[0]?.env ?? [];
  return new Set(envs.map((e) => e.name));
}

// ── Ejecución ─────────────────────────────────────────────────────────────
if (!hayGcloud()) {
  console.log('⚠️  gcloud no disponible — se omite la comprobación de deriva de entorno.');
  process.exit(0);
}

const pedidos = process.argv.slice(2);
const servicios = pedidos.length
  ? pedidos
  : readdirSync('.').filter(
      (d) => /-service$|^api-gateway$/.test(d) && existsSync(join(d, 'src')),
    );

console.log(`\n🔍 Deriva de entorno · proyecto ${PROYECTO}\n`);

let faltantesTotales = 0;
const sinDesplegar = [];

for (const s of servicios) {
  const enCodigo = envsDelCodigo(s);
  if (!enCodigo.size) continue;

  let desplegadas;
  try { desplegadas = envsDeCloudRun(s); }
  catch { sinDesplegar.push(s); continue; }

  const faltan = [...enCodigo.keys()].filter((n) => !desplegadas.has(n)).sort();
  if (!faltan.length) {
    console.log(`✅ ${s} — ${enCodigo.size} variables, todas configuradas`);
    continue;
  }
  faltantesTotales += faltan.length;
  console.log(`❌ ${s} — ${faltan.length} leída(s) en el código pero AUSENTE(s) en Cloud Run:`);
  for (const n of faltan) console.log(`     · ${n}   (${enCodigo.get(n)})`);
}

if (sinDesplegar.length) {
  console.log(`\nℹ️  Sin servicio desplegado (se omiten): ${sinDesplegar.join(', ')}`);
}

console.log(`\n${'─'.repeat(64)}`);
if (faltantesTotales) {
  console.log(
    `⚠️  ${faltantesTotales} variable(s) ausente(s).\n\n` +
    'No todas son un fallo: muchas tienen un valor por defecto válido. Lo que\n' +
    'hay que mirar es si ese defecto APAGA una función en silencio (localhost en\n' +
    'un servicio de Cloud Run, o cadena vacía que impide montar una ruta).\n',
  );
  // Informativo a propósito: no rompe el build. Ver el comentario de arriba.
  process.exit(0);
}
console.log('✅ Sin deriva: todo lo que el código lee está configurado.\n');
