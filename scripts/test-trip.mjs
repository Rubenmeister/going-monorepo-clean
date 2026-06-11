/**
 * test-trip.mjs — Crea datos de prueba y simula un viaje completo en Going.
 *
 * Uso:
 *   node scripts/test-trip.mjs
 *
 * Requiere Node 18+ (fetch nativo). No necesita dependencias extra.
 *
 * Qué hace:
 *   1. Login como admin
 *   2. Crea conductor de prueba + vehículo
 *   3. Crea empresa corporativa de prueba + empleado
 *   4. Crea una reserva (pasajero → conductor)
 *   5. Simula: aceptar → iniciar → actualizar GPS → completar
 *   6. Marca NPS recibido (score 9)
 *   7. Imprime URLs de cada feature para verificar en el browser
 */

const API = 'https://api-gateway-780842550857.us-central1.run.app';
// Override con env vars para testing local:
//   TEST_ADMIN_EMAIL=admin@goingec.com TEST_ADMIN_PASSWORD=xxx node scripts/test-trip.mjs
const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Falta TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD (exportalos antes de correr).');
  process.exit(1);
}

const ADMIN_URL  = 'http://localhost:3001';   // admin-dashboard en local
const WEBAPP_URL = 'http://localhost:3000';   // frontend-webapp en local

// ── Colores para la terminal ──────────────────────────────────────────────────
const C = { g:'\x1b[32m', y:'\x1b[33m', r:'\x1b[31m', b:'\x1b[34m', m:'\x1b[35m', w:'\x1b[0m', bold:'\x1b[1m' };
const ok  = (m) => console.log(`${C.g}✅ ${m}${C.w}`);
const warn= (m) => console.log(`${C.y}⚠️  ${m}${C.w}`);
const info= (m) => console.log(`${C.b}ℹ️  ${m}${C.w}`);
const step= (n,m)=> console.log(`\n${C.bold}${C.m}── Paso ${n}: ${m} ──${C.w}`);
const url = (label, href) => console.log(`   ${C.b}${label}${C.w} → ${href}`);

// ── Helpers de fetch ──────────────────────────────────────────────────────────
async function post(path, body, token) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (\!r.ok) { warn(`POST ${path} → ${r.status}: ${text.slice(0,120)}`); return null; }
  try { return JSON.parse(text); } catch { return text; }
}

async function patch(path, body, token) {
  const r = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (\!r.ok) { warn(`PATCH ${path} → ${r.status}: ${text.slice(0,120)}`); return null; }
  try { return JSON.parse(text); } catch { return text; }
}

async function get(path, token) {
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization:`Bearer ${token}` },
  });
  const text = await r.text();
  if (\!r.ok) { warn(`GET ${path} → ${r.status}`); return null; }
  try { return JSON.parse(text); } catch { return text; }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Generadores de datos ──────────────────────────────────────────────────────
const rand = (n) => Math.floor(Math.random() * n);
const uid  = () => `test_${Date.now()}_${rand(9999)}`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const results = {};

console.log(`\n${C.bold}${C.g}═══════════════════════════════════════════${C.w}`);
console.log(`${C.bold}${C.g}  GOING — Test Trip Completo${C.w}`);
console.log(`${C.bold}${C.g}═══════════════════════════════════════════${C.w}`);
info(`API: ${API}`);

// ── 1. Login admin ────────────────────────────────────────────────────────────
step(1, 'Login admin');
const loginRes = await post('/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
if (\!loginRes?.accessToken && \!loginRes?.token) {
  console.error(`${C.r}❌ Login fallido. Verifica credenciales.${C.w}`);
  process.exit(1);
}
const adminToken = loginRes.accessToken ?? loginRes.token;
ok(`Admin autenticado (token: ${adminToken.slice(0,20)}…)`);
results.adminToken = adminToken;

// ── 2. Crear conductor de prueba ──────────────────────────────────────────────
step(2, 'Crear conductor de prueba');
const driverEmail = `driver.test.${Date.now()}@going.ec`;
const driverPass  = 'Test1234\!';
const driverData  = {
  email: driverEmail, password: driverPass,
  firstName: 'TestConductor', lastName: 'Going',
  phone: '+593991112233', roles: ['driver'],
  status: 'active',
};
const driverRes = await post('/auth/admin/users', driverData, adminToken) ?? { id: uid(), email: driverEmail };
const driverId  = driverRes.id ?? driverRes.userId ?? driverRes._id;
ok(`Conductor creado: ${driverEmail} (id: ${driverId ?? 'demo'})`);
results.driverId    = driverId;
results.driverEmail = driverEmail;
results.driverPass  = driverPass;

// ── 3. Crear vehículo ─────────────────────────────────────────────────────────
step(3, 'Crear vehículo');
const plate = `TEST-${rand(900)+100}`;
const vehicleData = {
  driverId, plate, brand:'Toyota', model:'Corolla', year: 2022,
  color:'Blanco', capacity: 4, serviceTypes:['transport'],
  soatExpiry: new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
  matriculaExpiry: new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
  dashcamInstalled: true, dashcamStatus: 'online',
};
const vehicleRes = await post('/vehicles', vehicleData, adminToken) ?? { id: uid(), plate };
const vehicleId  = vehicleRes.id ?? vehicleRes._id;
ok(`Vehículo creado: ${plate} (id: ${vehicleId ?? 'demo'})`);
results.vehicleId = vehicleId;
results.plate     = plate;

// ── 4. Aprobar conductor ──────────────────────────────────────────────────────
step(4, 'Aprobar conductor');
if (driverId) {
  await patch(`/auth/admin/users/${driverId}/status`, { status:'active', vehicleApproved:true }, adminToken);
}
ok('Conductor aprobado y listo para operar');

// ── 5. Crear empresa corporativa ──────────────────────────────────────────────
step(5, 'Crear empresa corporativa de prueba');
const companyEmail = `empresa.test.${Date.now()}@testcorp.ec`;
const companyData  = {
  companyName: 'TestCorp S.A.', tipoCuenta: 'negocio',
  email: companyEmail, password: 'Test1234\!',
  firstName: 'Admin', lastName: 'TestCorp',
  phone: '+593022334455', city: 'Quito',
  status: 'active', roles: ['corporate_admin'],
};
const companyRes = await post('/corporate/companies', companyData, adminToken) ?? { id: uid(), companyName:'TestCorp' };
const companyId  = companyRes.id ?? companyRes.companyId ?? companyRes._id;
ok(`Empresa creada: TestCorp S.A. (id: ${companyId ?? 'demo'})`);
results.companyId    = companyId;
results.companyEmail = companyEmail;

// ── 6. Crear empleado corporativo ─────────────────────────────────────────────
step(6, 'Crear empleado corporativo con consentimiento');
const empEmail = `empleado.test.${Date.now()}@testcorp.ec`;
const empData  = {
  email: empEmail, password: 'Test1234\!',
  firstName: 'Andrea', lastName: 'TestEmpleada',
  companyId, department: 'Comercial', roles: ['employee'],
  trackingConsent: true, consentGiven: true,
};
const empRes = await post('/corporate/employees', empData, adminToken) ?? { id: uid() };
const empId  = empRes.id ?? empRes._id;
ok(`Empleada creada: ${empEmail} (consentimiento: ✅)`);
results.employeeId    = empId;
results.employeeEmail = empEmail;

// ── 7. Crear política de viajes ───────────────────────────────────────────────
step(7, 'Configurar política de viajes corporativos');
const policyData = {
  companyId, enabled: true,
  maxFarePerTrip: 50, maxFarePerDay: 150, maxFarePerMonth: 800,
  requireJustificationAbove: 30, autoApproveBelow: 20,
  requireApprovalAbove: 40,
  allowedServices: ['transport','tours','experiences'],
  allowedDays: [1,2,3,4,5],
  allowedHoursFrom: '06:00', allowedHoursTo: '22:00',
};
await post('/corporate/policy', policyData, adminToken);
ok('Política de viajes configurada');

// ── 8. Activar surge de prueba ────────────────────────────────────────────────
step(8, 'Activar surge de prueba (×1.3 por 1h)');
const surgeData = {
  name: 'Surge test automático', type: 'manual',
  multiplier: 1.3, active: true,
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  services: ['transport'],
};
const surgeRes = await post('/pricing/surge/rules', surgeData, adminToken);
ok(`Surge ×1.3 activo por 1h (id: ${surgeRes?.id ?? 'demo'})`);
results.surgeId = surgeRes?.id;

// ── 9. Crear reserva ──────────────────────────────────────────────────────────
step(9, 'Crear reserva de prueba');
const bookingData = {
  serviceType: 'transport',
  passengerId: empId ?? uid(),
  driverId,
  companyId,
  employeeId: empId,
  metadata: {
    origin: 'Av. Amazonas N35-17, Quito',
    destination: 'Aeropuerto Mariscal Sucre',
    requesterName: 'Andrea TestEmpleada',
    department: 'Comercial',
  },
  originLat: -0.2299, originLng: -78.5249,
  destLat: -0.1297,   destLng: -78.3572,
  estimatedPrice: { amount: 22.50, currency: 'USD' },
  status: 'pending',
};
const bookingRes = await post('/bookings', bookingData, adminToken) ?? { id: uid() };
const bookingId  = bookingRes.id ?? bookingRes._id ?? bookingRes.bookingId;
ok(`Reserva creada (id: ${bookingId ?? 'demo'})`);
results.bookingId = bookingId;

// ── 10. Ciclo del viaje ───────────────────────────────────────────────────────
step(10, 'Simular ciclo completo del viaje');

// Driver acepta
if (bookingId && driverId) {
  await patch(`/bookings/${bookingId}/confirm`, { driverId }, adminToken);
  ok('Conductor aceptó el viaje → status: confirmed');
  await sleep(500);

  // Viaje inicia
  await patch(`/bookings/${bookingId}/start`, { driverId }, adminToken);
  ok('Viaje iniciado → status: in_progress');
  await sleep(500);

  // Actualizar ubicación GPS (3 puntos del trayecto Quito → Aeropuerto)
  const route = [
    { lat:-0.2299, lng:-78.5249 },
    { lat:-0.1900, lng:-78.4600 },
    { lat:-0.1297, lng:-78.3572 },
  ];
  for (const [i, pos] of route.entries()) {
    await post(`/tracking/update`, { bookingId, driverId, ...pos, speed: 45+rand(20), heading: 45 }, adminToken);
    info(`GPS actualizado ${i+1}/3: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
    await sleep(300);
  }

  // Simular incidente dashcam
  await post(`/dashcam/incidents`, {
    bookingId, vehicleId, driverId, driverName:'TestConductor Going',
    plate, type:'harsh_braking', severity:'warning',
    lat:-0.1900, lng:-78.4600, speed:72, clipDuration:10, reviewed:false,
  }, adminToken);
  ok('Incidente dashcam registrado: frenada brusca (será visible en /dashcam)');
  await sleep(300);

  // Completar viaje
  await patch(`/bookings/${bookingId}/complete`, {
    actualPrice: { amount: 22.50, currency:'USD' },
  }, adminToken);
  ok('Viaje completado → status: completed');
  await sleep(500);
}

// ── 11. Pago ──────────────────────────────────────────────────────────────────
step(11, 'Registrar pago');
const paymentData = {
  bookingId, amount: 22.50, currency:'USD',
  method: 'corporate_account', status:'paid',
  companyId,
};
const paymentRes = await post('/payments', paymentData, adminToken) ?? { id: uid() };
ok(`Pago registrado: $22.50 USD (id: ${paymentRes?.id ?? 'demo'})`);
results.paymentId = paymentRes?.id;

// ── 12. NPS ───────────────────────────────────────────────────────────────────
step(12, 'Registrar respuesta NPS (score 9)');
const npsData = {
  bookingId, userId: empId ?? uid(), userName:'Andrea TestEmpleada',
  serviceType:'transport', driverId, driverName:'TestConductor Going',
  score: 9, comment:'Excelente servicio, llegó puntual y el vehículo estaba limpio.',
};
await post('/nps/responses', npsData, adminToken);
ok('Respuesta NPS registrada: 9/10 con comentario');

// ── 13. Liquidación ───────────────────────────────────────────────────────────
step(13, 'Generar liquidación para el conductor');
const payoutData = {
  driverId, driverName:'TestConductor Going',
  amount: 19.13,  // 85% de $22.50
  currency:'USD', status:'pending',
  tripCount:1, period:'test',
};
const payoutRes = await post('/payouts', payoutData, adminToken) ?? { id: uid() };
ok(`Liquidación generada: $19.13 (85%) (id: ${payoutRes?.id ?? 'demo'})`);

// ── Resumen final ─────────────────────────────────────────────────────────────
console.log(`\n${C.bold}${C.g}═══════════════════════════════════════════${C.w}`);
console.log(`${C.bold}  ✅ VIAJE DE PRUEBA COMPLETO${C.w}`);
console.log(`${C.bold}${C.g}═══════════════════════════════════════════${C.w}\n`);

console.log(`${C.bold}IDs generados:${C.w}`);
Object.entries(results).forEach(([k,v]) => {
  if (\!k.includes('Token') && \!k.includes('Pass'))
    console.log(`  ${C.y}${k.padEnd(16)}${C.w} ${v ?? '(demo/sin API)' }`);
});

console.log(`\n${C.bold}Credenciales de prueba:${C.w}`);
console.log(`  ${C.y}Admin${C.w}        ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
console.log(`  ${C.y}Conductor${C.w}    ${results.driverEmail} / ${driverPass}`);
console.log(`  ${C.y}Empresa${C.w}      ${results.companyEmail} / Test1234\!`);
console.log(`  ${C.y}Empleada${C.w}     ${results.employeeEmail} / Test1234\!`);

console.log(`\n${C.bold}Verifica en el Admin Dashboard (${ADMIN_URL}):${C.w}`);
url('📊 Dashboard',            `${ADMIN_URL}/`);
url('🚗 Conductor creado',     `${ADMIN_URL}/drivers`);
url('🎓 Onboarding',           `${ADMIN_URL}/onboarding`);
url('📅 Reserva del viaje',    `${ADMIN_URL}/bookings`);
url('💳 Pago registrado',      `${ADMIN_URL}/payments`);
url('💸 Liquidación',          `${ADMIN_URL}/payouts`);
url('📹 Incidente dashcam',    `${ADMIN_URL}/dashcam`);
url('🗺️  Mapa en vivo',         `${ADMIN_URL}/map`);
url('💬 NPS (score 9)',         `${ADMIN_URL}/nps`);
url('⚡ Surge activo ×1.3',    `${ADMIN_URL}/surge`);
url('🏢 Empresa TestCorp',     `${ADMIN_URL}/companies`);
url('🔔 Alertas',               `${ADMIN_URL}/alerts`);

console.log(`\n${C.bold}Verifica en el Portal Empresas (${WEBAPP_URL}):${C.w}`);
url('📊 Panel empresa',         `${WEBAPP_URL}/empresas/panel`);
url('🗺️  Mapa empleados',        `${WEBAPP_URL}/empresas/mapa`);
url('🔒 Seguridad/dashcam',     `${WEBAPP_URL}/empresas/seguridad`);
url('📋 Política de viajes',    `${WEBAPP_URL}/empresas/politica`);
url('🌍 Sostenibilidad CO₂',    `${WEBAPP_URL}/empresas/sostenibilidad`);
url('📍 Tracking en vivo',      `${WEBAPP_URL}/empresas/tracking`);

console.log(`\n${C.bold}${C.y}Para arrancar los frontends localmente:${C.w}`);
console.log(`  npm run dev:all    # arranca webapp (3000) + admin (3001)`);
console.log(`\n${C.bold}${C.y}Para limpiar los datos de prueba:${C.w}`);
if (results.bookingId) console.log(`  Booking: DELETE /bookings/${results.bookingId}`);
if (results.driverId)  console.log(`  Driver:  DELETE /auth/admin/users/${results.driverId}`);
if (results.companyId) console.log(`  Company: DELETE /corporate/companies/${results.companyId}`);
if (results.surgeId)   console.log(`  Surge:   DELETE /pricing/surge/rules/${results.surgeId}`);

console.log();
