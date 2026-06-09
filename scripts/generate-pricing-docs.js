#!/usr/bin/env node
/**
 * generate-pricing-docs.js
 *
 * Lee la fuente única de precios (libs/pricing/FARES) y produce un documento
 * legible en docs/PRICING.md para que el equipo lo revise, corrija, o lo
 * apruebe tal cual.
 *
 * Uso:
 *   node scripts/generate-pricing-docs.js
 *
 * Después de editar libs/pricing/src/lib/fares.ts:
 *   1) pnpm nx build pricing   (regenera dist/)
 *   2) node scripts/generate-pricing-docs.js  (regenera docs/PRICING.md)
 *   3) git diff docs/PRICING.md  (revisar los cambios)
 *
 * Salida:
 *   docs/PRICING.md  — tabla legible
 */
const fs = require('fs');
const path = require('path');

const { FARES, getPrivateFare } = require('../libs/pricing/dist/lib/fares.js');
const { CITIES } = require('../libs/pricing/dist/lib/cities.js');

const cityLabel = new Map(CITIES.map((c) => [c.id, c.label]));
function label(id) {
  return cityLabel.get(id) || (id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '));
}

// ── Pares únicos compartidos (sin duplicar bidirección) ─────────────────────
const pairs = new Map();
for (const key of Object.keys(FARES.shared)) {
  const [a, b] = key.split('-');
  if (!a || !b) continue;
  const sorted = [a, b].sort();
  const k = `${sorted[0]}|${sorted[1]}`;
  if (!pairs.has(k)) {
    pairs.set(k, { a: sorted[0], b: sorted[1], price: FARES.shared[key] });
  }
}
const sharedPairs = [...pairs.values()].sort((x, y) => {
  if (x.a !== y.a) return x.a.localeCompare(y.a);
  return x.b.localeCompare(y.b);
});

const today = new Date().toISOString().slice(0, 10);

// ── Generación del Markdown ─────────────────────────────────────────────────
const lines = [];
lines.push('# Going App — Tabla de Precios y Rutas');
lines.push('');
lines.push(`> **Generado**: ${today}`);
lines.push('> ');
lines.push('> Fuente única: [`libs/pricing/src/lib/fares.ts`](../libs/pricing/src/lib/fares.ts).');
lines.push('> Para cambiar un precio o agregar/quitar una ruta:');
lines.push('> 1. Editar `libs/pricing/src/lib/fares.ts` (y `cities.ts` si la ciudad es nueva).');
lines.push('> 2. Editar el mirror manual `mobile-user-app/src/catalog/fares.ts`.');
lines.push('> 3. `pnpm nx build pricing && node scripts/generate-pricing-docs.js` para regenerar este archivo.');
lines.push('> 4. `git diff docs/PRICING.md` para revisar — commit + push + redeploy de los 4 servicios.');
lines.push('');

// === Compartido ===
lines.push('## 1) Viajes Compartidos — precio por pasajero');
lines.push('');
lines.push('Estos son los **únicos** pares origen ↔ destino donde se ofrece servicio Compartido. Cualquier otra combinación se debe ofrecer como Privado o avisar fuera de cobertura.');
lines.push('');
lines.push('| # | Origen | Destino | Precio (USD/pasajero) |');
lines.push('|---|--------|---------|----------------------|');
sharedPairs.forEach((p, i) => {
  lines.push(`| ${i + 1} | ${label(p.a)} | ${label(p.b)} | $${p.price} |`);
});
lines.push('');
lines.push(`**Total de rutas compartidas activas:** ${sharedPairs.length}`);
lines.push('');

// === Privado Aeropuerto por zona ===
lines.push('## 2) Privado Aeropuerto (precio por persona, vehículo dedicado, por zona de Quito)');
lines.push('');
lines.push('| Zona de Quito | Precio (USD/persona) |');
lines.push('|---------------|----------------------|');
Object.entries(FARES.private_airport).forEach(([zone, price]) => {
  lines.push(`| ${zone.replace(/_/g, ' ')} | $${price} |`);
});
lines.push('');

// === Catálogo de vehículos ===
lines.push('## 3) Catálogo de vehículos (capacidad y multiplicador para privado)');
lines.push('');
lines.push('| Vehículo | Etiqueta | Capacidad (pax) | Multiplicador privado |');
lines.push('|----------|----------|-----------------|----------------------|');
Object.entries(FARES.vehicles).forEach(([key, v]) => {
  const mult = v.fixed_minibus ? `precio fijo (no multiplicador)` : `×${v.multiplier}`;
  lines.push(`| ${key} | ${v.label} | ${v.capacity} | ${mult} |`);
});
lines.push('');
lines.push(`- **Bus precio fijo base (Quito↔Sto Domingo $15)**: $${FARES.bus_fixed}`);
lines.push(`- **Minibús precio fijo base**: $${FARES.minibus_fixed}`);
lines.push(`- **Extensión El Carmen / La Concordia** (por persona): $${FARES.extension_per_person}`);
lines.push('');

// === Privado por par × vehículo (derivado) ===
lines.push('## 4) Viajes Privados (vehículo completo) — precios derivados');
lines.push('');
lines.push('Cada celda es **precio total del vehículo** para esa ruta. Derivado de la tarifa Compartido × multiplicador del vehículo (excepto Minibús y Bus que escalan desde precio base $250 / $350).');
lines.push('');
const vehicleKeys = Object.keys(FARES.vehicles);
const header = ['Origen', 'Destino', ...vehicleKeys.map((k) => FARES.vehicles[k].label)];
lines.push('| ' + header.join(' | ') + ' |');
lines.push('|' + header.map(() => '---').join('|') + '|');
sharedPairs.forEach((p) => {
  const row = [label(p.a), label(p.b)];
  vehicleKeys.forEach((vKey) => {
    const priv = getPrivateFare(p.price, vKey);
    row.push(`$${priv}`);
  });
  lines.push('| ' + row.join(' | ') + ' |');
});
lines.push('');

// === Ciudades de cobertura ===
lines.push('## 5) Ciudades de cobertura (donde se puede pedir / dejar pasajero)');
lines.push('');
lines.push('Centroide aproximado y radio operativo. Para Compartido se acepta el punto si está dentro de `radiusKm + 5 km`. Para Privado el radio operativo aplica sin buffer.');
lines.push('');
lines.push('| Ciudad | Provincia/Región | radius operativo (km) | Aeropuerto |');
lines.push('|--------|------------------|----------------------|------------|');
CITIES.forEach((c) => {
  lines.push(`| ${c.label} | ${c.region} | ${c.radiusKm} | ${c.isAirport ? '✈️ sí' : ''} |`);
});
lines.push('');

// === Pares de aeropuerto explícitos ===
lines.push('## 6) Notas operativas');
lines.push('');
lines.push('- **Hubs principales**: Quito (centro norte) y Aeropuerto Tababela. La gran mayoría de rutas Compartido son hub ↔ ciudad.');
lines.push('- **NO existe Compartido directo entre ciudades no-hub** (ej. Ambato ↔ Latacunga, Ibarra ↔ Otavalo). Para esos casos se ofrece Privado o conexión por Quito.');
lines.push('- **Buffer 5 km**: un pickup o drop-off puede estar hasta 5 km fuera del radio operativo de la ciudad y aún califica como Compartido. Más allá se ofrece Privado o se marca fuera de cobertura.');
lines.push('- **Bus y Minibús** tienen precio fijo por ruta (no se calcula con multiplicador) — se escala proporcional a la tarifa Compartido base (Quito↔Sto Domingo $15).');
lines.push('');

const out = lines.join('\n');
const outPath = path.join(__dirname, '..', 'docs', 'PRICING.md');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');

console.log(`OK: ${outPath} (${out.length} chars, ${sharedPairs.length} pares compartidos, ${CITIES.length} ciudades)`);
