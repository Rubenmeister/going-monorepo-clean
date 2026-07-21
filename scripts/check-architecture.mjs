#!/usr/bin/env node
/**
 * Guardas de arquitectura — impiden que vuelvan fallos YA arreglados.
 *
 * Cada guarda nació de un bug real que llegó a producción y estuvo roto sin que
 * nadie se enterara, porque la pantalla mostraba ceros en vez de un error.
 *
 * Uso:  node scripts/check-architecture.mjs
 * Sale con código 1 si encuentra una violación (rompe CI a propósito).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = process.cwd();
const IGNORAR = /node_modules|[\\/]dist[\\/]|[\\/]\.next[\\/]|[\\/]\.nx[\\/]|[\\/]worktrees[\\/]|[\\/]\.git[\\/]/;

function listarArchivos(dir, ext = /\.ts$/, acc = []) {
  let entradas;
  try { entradas = readdirSync(dir); } catch { return acc; }
  for (const e of entradas) {
    const p = join(dir, e);
    if (IGNORAR.test(p)) continue;
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) listarArchivos(p, ext, acc);
    else if (ext.test(p) && !/\.spec\.ts$/.test(p)) acc.push(p);
  }
  return acc;
}

const archivos = listarArchivos(RAIZ);
const leer = (f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } };
const violaciones = [];
const rel = (f) => relative(RAIZ, f).replace(/\\/g, '/');

// ──────────────────────────────────────────────────────────────────────────
// G1 · `_id: false` en una COLECCIÓN (no en un subdocumento)
//
// Bug real: BookingModelSchema, NotificationModelSchema, TransactionModelSchema
// y TripModelSchema lo tenían copiado desde un subdocumento. En una colección
// impide que Mongoose genere el _id y TODO save() falla con
// "document must have an _id before saving" → no se podía guardar ni una
// reserva, ni una notificación, ni un pago, ni un viaje.
// ──────────────────────────────────────────────────────────────────────────
{
  // Clases registradas como colección: aparecen en MongooseModule.forFeature
  const registradas = new Set();
  for (const f of archivos) {
    const src = leer(f);
    if (!src.includes('forFeature')) continue;
    for (const m of src.matchAll(/name:\s*(\w+)\.name/g)) registradas.add(m[1]);
  }

  for (const f of archivos.filter((x) => /\.schema\.ts$/.test(x))) {
    const src = leer(f);
    for (const m of src.matchAll(/@Schema\(\{([^}]*)\}\)\s*(?:export\s+)?class\s+(\w+)/g)) {
      const [, opciones, clase] = m;
      if (!/_id:\s*false/.test(opciones)) continue;
      if (!registradas.has(clase)) continue; // subdocumento → correcto
      violaciones.push(
        `G1  ${rel(f)}\n` +
        `    La clase ${clase} se registra como COLECCIÓN pero usa @Schema({ _id: false }).\n` +
        `    Eso impide que Mongoose genere el _id y todo save() falla.\n` +
        `    _id:false es SOLO para subdocumentos embebidos.`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// G2 · `totalPrice` usado como número
//
// Bug real: totalPrice viaja como Money ({ amount, currency }). Hacer
// `b.totalPrice ?? b.amount ?? 0` devolvía el OBJETO: la facturación mensual
// reventaba con "(prev.amount + amt).toFixed is not a function" y otros tres
// acumuladores producían basura EN SILENCIO.
// ──────────────────────────────────────────────────────────────────────────
{
  const patron = /(\w+)\.totalPrice\s*\?\?(?!\s*\{)/g;
  // `body`/`payload`/`dto`/`input` son cuerpos que manda el cliente, donde el
  // monto viaja PLANO por contrato — ahí no aplica.
  const receptoresCliente = /^(body|payload|dto|input|data)$/;
  for (const f of archivos) {
    const src = leer(f);
    if (!src.includes('totalPrice')) continue;
    for (const m of src.matchAll(patron)) {
      if (receptoresCliente.test(m[1])) continue;
      const linea = src.slice(0, m.index).split('\n').length;
      const texto = src.split('\n')[linea - 1].trim();
      // Comentarios (incluidos los que DOCUMENTAN este mismo bug) no cuentan
      if (/^(\/\/|\*|\/\*)/.test(texto)) continue;
      // `x.totalPrice?.amount` es correcto — solo marcamos el uso pelado
      if (/totalPrice\?\.amount/.test(texto)) continue;
      // Passthrough (copiar el Money tal cual a otro objeto) es válido
      if (/totalPrice:\s*\w+\.totalPrice\s*\?\?/.test(texto)) continue;
      violaciones.push(
        `G2  ${rel(f)}:${linea}\n` +
        `    ${texto}\n` +
        `    totalPrice es Money ({ amount, currency }), no un número.\n` +
        `    Usa .totalPrice?.amount (o el helper money()) antes de sumar.`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// G3 · Campo REQUERIDO por el schema con default de cadena vacía
//
// Bug real: create-corporate-user hacía `lastName: body.lastName || ''`, y ''
// NO satisface el `required: true` de Mongoose. El alta de TODA empresa nueva
// fallaba con 500, el approve quedaba provisioned:false y la cuenta del cliente
// nunca se creaba — en silencio.
// ──────────────────────────────────────────────────────────────────────────
{
  // Campos marcados required:true en cualquier schema
  const requeridos = new Set();
  for (const f of archivos.filter((x) => /\.schema\.ts$/.test(x))) {
    const src = leer(f);
    for (const m of src.matchAll(/@Prop\(\{[^}]*required:\s*true[^}]*\}\)\s*(\w+)\s*[?!]?\s*:/g)) {
      requeridos.add(m[1]);
    }
  }
  // Solo miramos DENTRO de una escritura a Mongo: `.create({...})` o
  // `new <algo>Model({...})`. Fuera de ahí, `campo: x || ''` es legítimo
  // (p. ej. armar req.user en un guard de JWT) y marcarlo sería ruido.
  const bloquesDeEscritura = (src) => {
    const bloques = [];
    const re = /(?:\.create\(|new\s+[\w.]*[Mm]odel\()\s*\{/g;
    for (const m of re.exec_all_shim ? [] : [...src.matchAll(re)]) {
      let i = m.index + m[0].length - 1; // en la '{'
      let prof = 0;
      for (let j = i; j < src.length && j < i + 4000; j++) {
        if (src[j] === '{') prof++;
        else if (src[j] === '}') { prof--; if (prof === 0) { bloques.push([i, j]); break; } }
      }
    }
    return bloques;
  };

  for (const f of archivos) {
    const src = leer(f);
    if (!/\.create\(|[Mm]odel\(/.test(src)) continue;
    const bloques = bloquesDeEscritura(src);
    if (!bloques.length) continue;
    for (const m of src.matchAll(/(\w+)\s*:\s*[^,\n]*\|\|\s*''\s*,/g)) {
      const campo = m[1];
      if (!requeridos.has(campo)) continue;
      if (!bloques.some(([a, b]) => m.index > a && m.index < b)) continue;
      const linea = src.slice(0, m.index).split('\n').length;
      violaciones.push(
        `G3  ${rel(f)}:${linea}\n` +
        `    ${src.split('\n')[linea - 1].trim()}\n` +
        `    '${campo}' es required:true en el schema y '' NO satisface required.\n` +
        `    Usa un valor real por defecto, no cadena vacía.`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// G5 · Tabla de TARIFAS incrustada dentro de una app
//
// El 20-jul-2026 el mismo precio vivía en OCHO lugares: el Excel del fundador,
// un JSON del repo, un YAML, la semilla del motor, dos módulos TS gemelos
// (libs + móvil), una tabla en la app de cliente y Atlas. Siete estaban
// congeladas desde el 4-6 de julio; solo Atlas estaba viva. Resultado: nadie
// sabía qué precio se estaba cobrando realmente, y los cambios que Rubén hacía
// en su Excel no llegaban a producción.
//
// Regla: las tarifas viven en el motor. Una app las PIDE, no las guarda.
// Se detecta un objeto con varias rutas `ciudad-ciudad` mapeadas a precios.
// ──────────────────────────────────────────────────────────────────────────
const APPS_SIN_TARIFAS = /^(frontend-webapp|empresas-webapp|admin-dashboard|website|mobile-user-app|mobile-driver-app)\//;

// Copias que YA existían cuando se creó esta guarda (20-jul-2026). Están en
// migración: las apps deben pasar a pedirle el precio al motor y estos archivos
// se borran. La lista solo evita que el CI quede rojo mientras tanto — NO
// añadir nada aquí: una copia nueva debe romper el build, que es el objetivo.
// VACÍA desde el 20-jul-2026: las tres copias que existían al crear esta guarda
// se migraron el mismo día. `frontend-webapp/canonicalFares.ts` perdió sus 174
// rutas y el respaldo silencioso; `mobile-user-app` perdió `excel-fares.ts`,
// `fares.ts` y el `pricing.ts` que las usaba (código muerto: `calcPrice` no
// tenía un solo llamador).
//
// NO agregar nada aquí. Una tabla nueva debe romper el build — es el objetivo.
const DEUDA_CONOCIDA = new Set([]);
const pendientes = [];
// Una ruta tarifada: 'quito-cuenca': 220   |   "aeropuerto-ambato": { suv: 70 }
const RUTA_TARIFA = /['"][a-z]+(?:_[a-z]+)?-[a-z]+(?:_[a-z]+)?['"]\s*:\s*(?:\d+(?:\.\d+)?|\{[^}]*\b(?:suv|van|minibus|bus)\b)/gi;

for (const f of archivos) {
  const r = rel(f);
  if (!APPS_SIN_TARIFAS.test(r)) continue;
  const src = leer(f);
  const coincidencias = src.match(RUTA_TARIFA);
  // Un par suelto puede ser un ejemplo o un mock; una TABLA son muchos.
  if (!coincidencias || coincidencias.length < 5) continue;

  if (DEUDA_CONOCIDA.has(r)) {
    pendientes.push(`${r} (${coincidencias.length} rutas)`);
    continue;
  }

  violaciones.push(
    `G5  ${r}\n` +
      `    Hay una tabla de tarifas incrustada (${coincidencias.length} rutas con precio).\n` +
      `    Las tarifas viven en el motor: pide a /price o /snapshot y falla visible\n` +
      `    si no responde. Una copia local se congela y termina cobrando precios viejos.`,
  );
}

// Las copias pendientes se REPORTAN siempre, aunque no rompan el build: una
// deuda silenciosa se vuelve permanente.
if (pendientes.length) {
  console.warn(`\n⚠️  G5 · ${pendientes.length} tabla(s) de tarifas todavía dentro de apps (en migración):`);
  for (const p of pendientes) console.warn(`     · ${p}`);
  console.warn('     Mientras existan, esas apps pueden cobrar precios congelados.\n');
}

// ──────────────────────────────────────────────────────────────────────────
if (violaciones.length) {
  console.error(`\n❌ Guardas de arquitectura: ${violaciones.length} violación(es)\n`);
  for (const v of violaciones) console.error(v + '\n');
  console.error('Estas comprobaciones existen porque cada una de estas fallas YA llegó a producción.\n');
  process.exit(1);
}

console.log('✅ Guardas de arquitectura: sin violaciones (G1 _id, G2 Money, G3 required vacío, G5 tarifas en apps)');
