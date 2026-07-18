#!/usr/bin/env node
/**
 * Smoke test de producción — verifica INVARIANTES DE NEGOCIO, no solo que la
 * API responda 200.
 *
 * Nació de un día en que seis fallos convivían en producción sin que nadie los
 * viera, porque las pantallas mostraban ceros en vez de errores. Un health check
 * habría dicho "todo bien" en los seis casos.
 *
 * Uso:
 *   node scripts/smoke-test.mjs                 # solo lo público (sin auth)
 *   GOING_TOKEN=<jwt> node scripts/smoke-test.mjs   # + flujo autenticado
 *
 * Sale con código 1 si alguna invariante se rompe.
 */

const API = process.env.GOING_API ?? 'https://api.goingec.com';
const TOKEN = process.env.GOING_TOKEN ?? '';

const fallos = [];
const oks = [];

function check(nombre, condicion, detalle = '') {
  if (condicion) { oks.push(nombre); console.log(`  ✅ ${nombre}`); }
  else { fallos.push(`${nombre}${detalle ? ' — ' + detalle : ''}`); console.error(`  ❌ ${nombre} ${detalle}`); }
}

async function post(path, body, token) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(body),
  });
  let j = null;
  try { j = await r.json(); } catch { /* respuesta no-JSON */ }
  return { status: r.status, body: j };
}

const precio = (p) => post('/price', p);

console.log(`\n🔍 Smoke test contra ${API}\n`);

// ── 1. El motor de tarifas responde y conoce las rutas ────────────────────
console.log('Motor de tarifas');
const t1 = await precio({
  serviceType: 'intercity_private', origin: 'quito', destination: 'cuenca',
  vehicleType: 'suv', segment: 'corporate',
});
check('cotiza una ruta conocida (quito→cuenca)',
  t1.status === 200 && typeof t1.body?.total === 'number' && t1.body.total > 0,
  `status=${t1.status} total=${t1.body?.total}`);

check('usa la tabla corporativa para segment=corporate',
  t1.body?.breakdown?.list === 'empresas',
  `lista=${t1.body?.breakdown?.list}`);

// ── 2. Recargo B2B: corporativo SIEMPRE por encima de consumidor ──────────
// Regla de negocio: corporate/agency pagan +25%. Se rompió en envíos y estuvo
// así sin que nadie lo notara.
console.log('\nRecargo B2B (+25%)');
const tB2c = await precio({
  serviceType: 'intercity_private', origin: 'quito', destination: 'cuenca',
  vehicleType: 'suv', segment: 'b2c',
});
check('transporte: corporativo > consumidor',
  (t1.body?.total ?? 0) > (tB2c.body?.total ?? 0),
  `corp=${t1.body?.total} b2c=${tB2c.body?.total}`);

const envioParams = {
  serviceType: 'envio', origin: 'quito', destination: 'cuenca',
  distanceKm: 40, weightKg: 10,
};
const eCorp = await precio({ ...envioParams, segment: 'corporate' });
const eB2c = await precio({ ...envioParams, segment: 'b2c' });
check('envíos: corporativo > consumidor',
  (eCorp.body?.total ?? 0) > (eB2c.body?.total ?? 0),
  `corp=${eCorp.body?.total} b2c=${eB2c.body?.total}`);

// ── 3. Recargo por parada / dirección extra ───────────────────────────────
console.log('\nRecargo por parada');
const sin = await precio({
  serviceType: 'intercity_private', origin: 'quito', destination: 'cuenca',
  vehicleType: 'suv', segment: 'corporate',
});
const con2 = await precio({
  serviceType: 'intercity_private', origin: 'quito', destination: 'cuenca',
  vehicleType: 'suv', segment: 'corporate', stops: 2,
});
const dif = +((con2.body?.total ?? 0) - (sin.body?.total ?? 0)).toFixed(2);
check('2 paradas suman exactamente el doble del recargo unitario',
  dif > 0 && Math.abs(dif - (con2.body?.breakdown?.stopSurchargeUnit ?? 0) * 2) < 0.01,
  `diferencia=${dif} unitario=${con2.body?.breakdown?.stopSurchargeUnit}`);

// ── 4. Ruta sin tarifa: debe decirlo, no inventar un precio ───────────────
console.log('\nRutas sin tarifa');
const inexistente = await precio({
  serviceType: 'intercity_private', origin: 'quito', destination: 'narnia',
  vehicleType: 'suv', segment: 'corporate',
});
check('ruta desconocida devuelve error, no un precio inventado',
  !!inexistente.body?.error || typeof inexistente.body?.total !== 'number',
  JSON.stringify(inexistente.body).slice(0, 80));

// ── 5. Embudo B2B público: acepta solicitudes de alta ─────────────────────
console.log('\nEmbudo B2B');
const solicitud = await post('/corporate/public/applications', {
  razonSocial: 'SMOKE TEST (ignorar)',
  ruc: '1790012345001',
  contactoNombre: 'Smoke Test',
  contactoEmail: 'smoke-test@demo.invalid',
  tipoCuenta: 'negocio',
  notas: 'Generada por smoke-test automatizado',
});
check('acepta una solicitud de empresa',
  [200, 201].includes(solicitud.status) && !!solicitud.body?.id,
  `status=${solicitud.status}`);

// ── 6. Flujo autenticado (solo si hay token) ──────────────────────────────
if (TOKEN) {
  console.log('\nFlujo corporativo autenticado');
  const r = await fetch(API + '/corporate/billing/invoices', {
    headers: { Authorization: 'Bearer ' + TOKEN },
  });
  check('lista facturas corporativas', r.status === 200, `status=${r.status}`);

  const b = await fetch(API + '/bookings/my', { headers: { Authorization: 'Bearer ' + TOKEN } });
  check('lista reservas propias', b.status === 200, `status=${b.status}`);
} else {
  console.log('\n(sin GOING_TOKEN — se omite el flujo autenticado)');
}

// ── Resultado ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
if (fallos.length) {
  console.error(`❌ Smoke test FALLÓ: ${fallos.length} invariante(s) rota(s) de ${oks.length + fallos.length}\n`);
  for (const f of fallos) console.error(`   · ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`✅ Smoke test OK — ${oks.length} invariantes verificadas\n`);
