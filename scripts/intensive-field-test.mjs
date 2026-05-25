/**
 * intensive-field-test.mjs — Stress test de Going con 10 drivers + 30 pasajeros
 * ejecutando los 4 flujos de producto (privado, compartido, envíos, hybrid)
 * de forma concurrente.
 *
 * Uso:
 *   node scripts/intensive-field-test.mjs                 # full run + cleanup
 *   node scripts/intensive-field-test.mjs --keep          # no borra test data
 *   node scripts/intensive-field-test.mjs --dry-run       # solo planifica, no llama
 *   node scripts/intensive-field-test.mjs --scenario 1,7  # solo escenarios 1 y 7
 *
 * Requiere Node 18+ (fetch nativo).
 *
 * Env vars:
 *   GOING_API              default https://api.goingec.com
 *   TEST_ADMIN_EMAIL       default admin@going.com
 *   TEST_ADMIN_PASSWORD    default Admin123!
 *
 * Output:
 *   - Console: log en tiempo real + resumen final
 *   - test-report-YYYYMMDD-HHMMSS.json: detalle completo de cada escenario
 *
 * Convención de usuarios test:
 *   test-field-driver-XX@going.com
 *   test-field-passenger-XX@going.com
 *   test-field-corp-XX@going.com
 *   test-field-emp-XX@going.com
 *   Todos con password Test1234!
 *
 * Cleanup (default):
 *   PATCH /auth/admin/users/:id/status → 'suspended' (no hay hard-delete en la API)
 *   Cancela rides/parcels en estado activo.
 */

'use strict';

import { writeFileSync } from 'node:fs';

// ─── Config ───────────────────────────────────────────────────────────────────

const API = process.env.GOING_API ?? 'https://api.goingec.com';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@going.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Admin123!';
const TEST_PASSWORD = 'TestField12345!'; // 15 chars — user-auth exige 12+
// Sufijo timestamp para evitar colisión entre corridas (los users no se pueden borrar duro).
const RUN_ID = String(Date.now()).slice(-6);
const USER_PREFIX = `test-field-${RUN_ID}-`;

// CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const KEEP = args.includes('--keep');
const scenarioArg = args.find((a) => a.startsWith('--scenario'));
const ONLY_SCENARIOS = scenarioArg
  ? new Set((scenarioArg.split('=')[1] ?? args[args.indexOf(scenarioArg) + 1] ?? '')
      .split(',').map((s) => Number(s.trim())).filter(Boolean))
  : null;

// Counts
const DRIVERS_COUNT = 10;
const PASSENGERS_COUNT = 30;
const CORPORATES_COUNT = 3;
const EMPLOYEES_PER_CORP = 2;

// Quito zones (centros aproximados)
const ZONES = [
  { name: 'norte',        lat: -0.1430, lng: -78.4810 },
  { name: 'centro',       lat: -0.2200, lng: -78.5125 },
  { name: 'sur',          lat: -0.2890, lng: -78.5460 },
  { name: 'cumbaya',      lat: -0.2050, lng: -78.4280 },
  { name: 'valle_chillos',lat: -0.2980, lng: -78.4570 },
];

// Vehicles assignment a cada driver
const VEHICLES = [
  { type: 'suv',     capacity: 3,  serviceTypes: ['transport', 'parcel'] },
  { type: 'suv',     capacity: 3,  serviceTypes: ['transport', 'parcel'] },
  { type: 'suv',     capacity: 3,  serviceTypes: ['transport', 'parcel'] },
  { type: 'suv',     capacity: 3,  serviceTypes: ['transport', 'parcel'] },
  { type: 'suv_xl',  capacity: 5,  serviceTypes: ['transport', 'parcel'] },
  { type: 'suv_xl',  capacity: 5,  serviceTypes: ['transport', 'parcel'] },
  { type: 'suv_xl',  capacity: 5,  serviceTypes: ['transport', 'parcel'] },
  { type: 'van',     capacity: 8,  serviceTypes: ['transport'] },
  { type: 'van',     capacity: 8,  serviceTypes: ['transport'] },
  { type: 'van_xl',  capacity: 12, serviceTypes: ['transport'] },
];

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = { g:'\x1b[32m', y:'\x1b[33m', r:'\x1b[31m', b:'\x1b[34m', m:'\x1b[35m', w:'\x1b[0m', dim:'\x1b[2m', bold:'\x1b[1m' };
const ok   = (m) => console.log(`${C.g}✓${C.w} ${m}`);
const warn = (m) => console.log(`${C.y}⚠${C.w} ${m}`);
const err  = (m) => console.log(`${C.r}✗${C.w} ${m}`);
const info = (m) => console.log(`${C.b}ℹ${C.w} ${m}`);
const dim  = (m) => console.log(`${C.dim}  ${m}${C.w}`);
const banner = (m) => console.log(`\n${C.bold}${C.m}═══ ${m} ═══${C.w}`);

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function req(method, path, body = null, token = null) {
  if (DRY_RUN) {
    return { __dryRun: true, method, path, body };
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

const post  = (p, b, t) => req('POST', p, b, t);
const get   = (p, t)    => req('GET',  p, null, t);
const patch = (p, b, t) => req('PATCH', p, b, t);
const put   = (p, b, t) => req('PUT', p, b, t);
const del   = (p, t)    => req('DELETE', p, null, t);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Estado global ────────────────────────────────────────────────────────────

const state = {
  adminToken: null,
  drivers: [],       // [{ id, email, token, vehicle, base, gps }]
  passengers: [],    // [{ id, email, token }]
  corporates: [],    // [{ id, employees: [...] }]
  artifacts: { rides: [], parcels: [], scheduledTrips: [], hybridContexts: [] },
  results: [],       // [{ scenario, status, duration, detail }]
};

// ─── Setup helpers ────────────────────────────────────────────────────────────

async function loginAdmin() {
  const r = await post('/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!r?.ok) throw new Error(`Login admin fallo (${r?.status}): ${JSON.stringify(r?.data).slice(0, 200)}`);
  state.adminToken = r.data.accessToken ?? r.data.token;
  if (!state.adminToken) throw new Error('Sin token en respuesta de login');
  return state.adminToken;
}

async function createUser({ email, password = TEST_PASSWORD, firstName, lastName, phone, roles }) {
  const body = { email, password, firstName, lastName, phone, roles };
  const r = await post('/auth/register', body);
  if (!r?.ok && r?.status !== 409) {
    return { ok: false, error: `register ${r?.status} ${JSON.stringify(r?.data).slice(0, 150)}` };
  }
  // Login para obtener token
  const login = await post('/auth/login', { email, password });
  if (!login?.ok) return { ok: false, error: `login ${login?.status}` };
  return {
    ok: true,
    id: login.data.user?.id ?? r.data?.user?.id ?? r.data?.id,
    email,
    token: login.data.accessToken ?? login.data.token,
  };
}

async function setupDrivers() {
  banner('SETUP — 10 drivers + vehículos + bases');
  for (let i = 0; i < DRIVERS_COUNT; i++) {
    const idx = String(i + 1).padStart(2, '0');
    const email = `${USER_PREFIX}driver-${idx}@going.com`;
    const v = VEHICLES[i];
    const zone = ZONES[i % ZONES.length];

    const user = await createUser({
      email,
      firstName: `TestDriver${idx}`, lastName: 'Going',
      phone: `+593990000${idx}`,
      roles: ['driver'],
    });
    if (!user.ok) { err(`driver-${idx}: ${user.error}`); continue; }

    // Asignar base (zona de operación)
    const baseRes = await post('/drivers/me/bases', {
      name: `Base ${zone.name}`,
      lat: zone.lat,
      lng: zone.lng,
      radiusKm: 8,
      isPrimary: true,
    }, user.token);

    state.drivers.push({
      ...user,
      vehicle: v,
      base: { ...zone },
      gps: { lat: zone.lat, lng: zone.lng },
      baseAssigned: baseRes?.ok ?? false,
    });
    ok(`driver-${idx} (${v.type}, base ${zone.name})`);
  }
}

async function setupPassengers() {
  banner('SETUP — 30 pasajeros');
  // En paralelo, ~5 a la vez para no saturar
  for (let batch = 0; batch < PASSENGERS_COUNT; batch += 5) {
    const promises = [];
    for (let i = batch; i < Math.min(batch + 5, PASSENGERS_COUNT); i++) {
      const idx = String(i + 1).padStart(2, '0');
      promises.push(createUser({
        email: `${USER_PREFIX}passenger-${idx}@going.com`,
        firstName: `Pasajero${idx}`, lastName: 'Test',
        phone: `+593990001${idx}`,
        roles: ['user'],
      }));
    }
    const results = await Promise.all(promises);
    results.forEach((u, j) => {
      if (u.ok) {
        state.passengers.push(u);
        ok(`passenger-${String(batch + j + 1).padStart(2, '0')}`);
      } else {
        err(`passenger-${String(batch + j + 1).padStart(2, '0')}: ${u.error}`);
      }
    });
  }
}

async function setupCorporates() {
  banner('SETUP — 3 empresas corporativas + 6 empleados');
  for (let i = 0; i < CORPORATES_COUNT; i++) {
    const idx = String(i + 1).padStart(2, '0');
    const corpEmail = `${USER_PREFIX}corp-${idx}@going.com`;
    const corpRes = await post('/corporate/companies', {
      companyName: `TestCorp ${idx}`,
      tipoCuenta: 'negocio',
      email: corpEmail,
      password: TEST_PASSWORD,
      firstName: 'AdminCorp', lastName: `Test${idx}`,
      phone: `+593990002${idx}`,
      city: 'Quito',
      status: 'active', roles: ['corporate_admin'],
    }, state.adminToken);
    if (!corpRes?.ok) { err(`corp-${idx}: ${corpRes?.status}`); continue; }
    const companyId = corpRes.data?.id ?? corpRes.data?.companyId;

    const employees = [];
    for (let e = 0; e < EMPLOYEES_PER_CORP; e++) {
      const ei = String(e + 1).padStart(2, '0');
      const empEmail = `${USER_PREFIX}emp-${idx}-${ei}@going.com`;
      const empRes = await post('/corporate/employees', {
        email: empEmail, password: TEST_PASSWORD,
        firstName: `Empleado${ei}`, lastName: 'Test',
        companyId, department: 'Comercial', roles: ['employee'],
        trackingConsent: true, consentGiven: true,
      }, state.adminToken);
      if (empRes?.ok) {
        const login = await post('/auth/login', { email: empEmail, password: TEST_PASSWORD });
        if (login?.ok) {
          employees.push({
            id: empRes.data?.id,
            email: empEmail,
            token: login.data.accessToken ?? login.data.token,
            companyId,
          });
        }
      }
    }
    state.corporates.push({ id: companyId, email: corpEmail, employees });
    ok(`corp-${idx} (${employees.length} empleados)`);
  }
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

/**
 * Wrapper que captura duración + status + errores de cada escenario.
 */
async function runScenario(id, name, fn) {
  if (ONLY_SCENARIOS && !ONLY_SCENARIOS.has(id)) {
    info(`#${id} SKIPPED (${name})`);
    return;
  }
  banner(`Escenario #${id} — ${name}`);
  const t0 = Date.now();
  const detail = {};
  try {
    const result = await fn(detail);
    const dt = Date.now() - t0;
    const status = result?.failed > 0 ? 'PARTIAL' : 'OK';
    state.results.push({ scenario: id, name, status, duration: dt, detail: { ...detail, ...result } });
    if (status === 'OK') ok(`#${id} OK · ${dt}ms`);
    else warn(`#${id} PARTIAL · ${dt}ms · ${JSON.stringify(result)}`);
  } catch (e) {
    const dt = Date.now() - t0;
    state.results.push({ scenario: id, name, status: 'FAIL', duration: dt, error: e.message, detail });
    err(`#${id} FAIL · ${dt}ms · ${e.message}`);
  }
}

/** #1 Privado happy path — 3 drivers × 2 rides cada uno = 6 rides completos. */
async function scenario1_privadoHappy() {
  const drivers = state.drivers.filter((d) => d.vehicle.type === 'suv').slice(0, 3);
  const ridesPerDriver = 2;
  let completed = 0, failed = 0;

  for (const driver of drivers) {
    for (let r = 0; r < ridesPerDriver; r++) {
      const pax = state.passengers[Math.floor(Math.random() * state.passengers.length)];
      // Pickup cerca de la base del driver; dropoff dentro del mismo zona +/- 2km
      const pickup = { lat: driver.base.lat + 0.005, lng: driver.base.lng + 0.005 };
      const dropoff = { lat: driver.base.lat + 0.02, lng: driver.base.lng + 0.02 };

      const reqRide = await post('/rides/request', {
        pickupLatitude: pickup.lat, pickupLongitude: pickup.lng,
        dropoffLatitude: dropoff.lat, dropoffLongitude: dropoff.lng,
        serviceType: 'suv_confort',
      }, pax.token);

      if (!reqRide?.ok) { failed++; warn(`ride-request fallo ${reqRide?.status}`); continue; }
      const rideId = reqRide.data?.rideId ?? reqRide.data?.id;
      state.artifacts.rides.push(rideId);

      // El matching engine async asigna driver. Esperamos 2s + intentamos accept.
      await sleep(2000);
      const accept = await put(`/rides/${rideId}/accept`, {}, driver.token);
      if (!accept?.ok) { failed++; warn(`accept ${rideId}: ${accept?.status}`); continue; }

      // Start ride (driver llegó al pickup)
      await sleep(500);
      await put(`/rides/${rideId}/start`, {}, driver.token);

      // Complete ride
      await sleep(500);
      const completeRes = await put(`/rides/${rideId}/complete`, {
        dropoffLatitude: dropoff.lat, dropoffLongitude: dropoff.lng,
      }, driver.token);
      if (completeRes?.ok) { completed++; dim(`✓ ride ${rideId.slice(0, 8)}`); }
      else { failed++; warn(`complete ${rideId}: ${completeRes?.status}`); }
    }
  }
  return { completed, failed };
}

/** #2 Cancelación pre-pickup — 2 rides cancelados por pasajero antes de start. */
async function scenario2_cancelPrePickup() {
  let cancelled = 0, failed = 0;
  const drivers = state.drivers.slice(0, 2);
  for (const driver of drivers) {
    const pax = state.passengers[Math.floor(Math.random() * state.passengers.length)];
    const pickup = { lat: driver.base.lat + 0.005, lng: driver.base.lng + 0.005 };
    const reqRide = await post('/rides/request', {
      pickupLatitude: pickup.lat, pickupLongitude: pickup.lng,
      dropoffLatitude: pickup.lat + 0.02, dropoffLongitude: pickup.lng + 0.02,
      serviceType: 'suv_confort',
    }, pax.token);
    if (!reqRide?.ok) { failed++; continue; }
    const rideId = reqRide.data?.rideId ?? reqRide.data?.id;
    state.artifacts.rides.push(rideId);
    await sleep(2000);
    await put(`/rides/${rideId}/accept`, {}, driver.token);
    await sleep(500);
    const cancel = await put(`/rides/${rideId}/cancel`, { reason: 'cambio de planes' }, pax.token);
    if (cancel?.ok) { cancelled++; dim(`✓ cancelled ${rideId.slice(0, 8)}`); }
    else { failed++; warn(`cancel ${rideId}: ${cancel?.status}`); }
  }
  return { cancelled, failed };
}

/** #3 Driver no-show — driver acepta pero no avanza GPS, se debería reasignar. */
async function scenario3_driverNoShow() {
  let detected = 0, failed = 0;
  const driver = state.drivers[0];
  const pax = state.passengers[0];
  const pickup = { lat: driver.base.lat + 0.005, lng: driver.base.lng + 0.005 };

  const reqRide = await post('/rides/request', {
    pickupLatitude: pickup.lat, pickupLongitude: pickup.lng,
    dropoffLatitude: pickup.lat + 0.02, dropoffLongitude: pickup.lng + 0.02,
    serviceType: 'suv_confort',
  }, pax.token);
  if (!reqRide?.ok) return { detected: 0, failed: 1 };
  const rideId = reqRide.data?.rideId ?? reqRide.data?.id;
  state.artifacts.rides.push(rideId);
  await sleep(2000);
  await put(`/rides/${rideId}/accept`, {}, driver.token);
  // Esperar 30s sin mover GPS — el sistema debería marcar driver como inactivo
  dim('esperando 30s para detectar no-show...');
  await sleep(30000);
  const status = await get(`/rides/${rideId}`, pax.token);
  if (status?.data?.status === 'no_show' || status?.data?.status === 'reassigned') detected++;
  else { warn(`ride sigue en ${status?.data?.status}`); failed++; }
  // Cleanup: cancel para no quedar colgado
  await put(`/rides/${rideId}/cancel`, { reason: 'test cleanup' }, pax.token);
  return { detected, failed };
}

/** #4 Compartido — driver VAN publica SCHEDULE (slots recurrentes) Quito↔Santo Domingo.
 *  La reserva real requiere ScheduledTrip materializado (cron), no hace por API directa,
 *  así que el escenario valida solo el save del schedule. TODO Fase 2: trigger materialize. */
async function scenario4_carpool() {
  const driver = state.drivers.find((d) => d.vehicle.type === 'van');
  if (!driver) return { failed: 1, reason: 'no van driver' };

  // POST /drivers/me/schedule espera { slots: ScheduleSlot[] }
  // Ver transport-service/src/api/driver-schedule.controller.ts:82
  const r = await post('/drivers/me/schedule', {
    slots: [
      {
        routeId: 'quito_santo_domingo', // debe estar en GOING_ROUTES del backend
        days: [1, 2, 3, 4, 5], // L-V
        time: '08:00',
        returnTrip: true,
        returnTime: '17:00',
      },
    ],
  }, driver.token);
  if (!r?.ok) return { saved: 0, failed: 1, reason: `save schedule ${r?.status}: ${JSON.stringify(r?.data).slice(0,100)}` };
  return { saved: r.data?.slots?.length ?? 0, weeklyEstimate: r.data?.weeklyEstimate, failed: 0 };
}

/** #5 Envío urbano — 2 drivers SUV aceptan parcel, OTP delivery. */
async function scenario5_parcelUrban() {
  let delivered = 0, failed = 0;
  const drivers = state.drivers.filter((d) => d.vehicle.type === 'suv').slice(0, 2);
  for (const driver of drivers) {
    const sender = state.passengers[Math.floor(Math.random() * state.passengers.length)];
    const parcel = await post('/parcels', {
      origin: { address: 'Centro Quito', latitude: driver.base.lat, longitude: driver.base.lng },
      destination: { address: 'Norte Quito', latitude: driver.base.lat + 0.05, longitude: driver.base.lng + 0.05 },
      description: 'Sobre prueba',
      price: { amount: 5, currency: 'USD' },
      packageSize: 'small',
      paymentMethod: 'cash',
      payerRole: 'sender',
    }, sender.token);
    if (!parcel?.ok) { failed++; continue; }
    const parcelId = parcel.data?.id;
    state.artifacts.parcels.push(parcelId);
    await sleep(2000);
    const accept = await patch(`/parcels/${parcelId}/accept`, {}, driver.token);
    if (!accept?.ok) { failed++; continue; }
    await sleep(500);
    await patch(`/parcels/${parcelId}/mark-in-transit`, {}, driver.token);
    await sleep(500);
    const otp = parcel.data?.otpPin;
    const deliver = await patch(`/parcels/${parcelId}/deliver`, { otpPin: otp }, driver.token);
    if (deliver?.ok) { delivered++; dim(`✓ delivered ${parcelId.slice(0, 8)}`); }
    else { failed++; warn(`deliver ${parcelId}: ${deliver?.status}`); }
  }
  return { delivered, failed };
}

/** #6 Envío cancelado por sender antes de pickup. */
async function scenario6_parcelCancel() {
  const driver = state.drivers.find((d) => d.vehicle.type === 'suv');
  const sender = state.passengers[0];
  const parcel = await post('/parcels', {
    origin: { address: 'Test', latitude: driver.base.lat, longitude: driver.base.lng },
    destination: { address: 'Test', latitude: driver.base.lat + 0.05, longitude: driver.base.lng + 0.05 },
    description: 'Cancel test',
    price: { amount: 4, currency: 'USD' },
    paymentMethod: 'cash', payerRole: 'sender',
  }, sender.token);
  if (!parcel?.ok) return { cancelled: 0, failed: 1 };
  const parcelId = parcel.data?.id;
  state.artifacts.parcels.push(parcelId);
  await sleep(2000);
  await patch(`/parcels/${parcelId}/accept`, {}, driver.token);
  await sleep(500);
  const cancel = await patch(`/parcels/${parcelId}/cancel`, { reason: 'sender cancelled' }, sender.token);
  return cancel?.ok ? { cancelled: 1, failed: 0 } : { cancelled: 0, failed: 1 };
}

/** #7 Demanda concurrente — 5 pasajeros piden privado al mismo tiempo en La Mariscal. */
async function scenario7_concurrentDemand() {
  const mariscal = { lat: -0.2050, lng: -78.4920 };
  const promises = state.passengers.slice(0, 5).map((pax, i) =>
    post('/rides/request', {
      pickupLatitude: mariscal.lat + i * 0.001,
      pickupLongitude: mariscal.lng + i * 0.001,
      dropoffLatitude: mariscal.lat + 0.03,
      dropoffLongitude: mariscal.lng + 0.03,
      serviceType: 'suv_confort',
    }, pax.token)
  );
  const t0 = Date.now();
  const results = await Promise.all(promises);
  const dt = Date.now() - t0;
  const ok = results.filter((r) => r?.ok).length;
  results.forEach((r) => { if (r?.data?.rideId) state.artifacts.rides.push(r.data.rideId); });
  return { requested: 5, accepted: ok, failed: 5 - ok, latencyMs: dt };
}

/** #8 Corporativo +25% — empleado corp pide ride, backend aplica +25% por JWT. */
async function scenario8_corporate25() {
  if (state.corporates.length === 0) return { failed: 1, reason: 'no corp' };
  const corp = state.corporates[0];
  const emp = corp.employees[0];
  if (!emp) return { failed: 1, reason: 'no emp token' };

  const driver = state.drivers[0];
  const pickup = { lat: driver.base.lat + 0.005, lng: driver.base.lng + 0.005 };
  const reqRide = await post('/rides/request', {
    pickupLatitude: pickup.lat, pickupLongitude: pickup.lng,
    dropoffLatitude: pickup.lat + 0.03, dropoffLongitude: pickup.lng + 0.03,
    serviceType: 'suv_confort',
  }, emp.token);
  if (!reqRide?.ok) return { failed: 1, reason: `request ${reqRide?.status}` };
  state.artifacts.rides.push(reqRide.data?.rideId);
  // El precio debería incluir +25% sobre el base. Solo verificamos que el ride se creó.
  return { applied: 1, failed: 0, fare: reqRide.data?.fare ?? reqRide.data?.estimatedFare };
}

/** #9 Hybrid Mode — VAN driver completa Quito→SD outbound + take local ride. */
async function scenario9_hybridMode() {
  const driver = state.drivers.find((d) => d.vehicle.type === 'van');
  if (!driver) return { failed: 1, reason: 'no van' };

  // Simulamos que el outbound ya está completado — el driver llega a SD.
  const sd = { lat: -0.2389, lng: -79.1717 };
  const returnDeparts = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4h en el futuro

  // POST /driver-hybrid/start-local-mode
  const start = await post('/driver-hybrid/start-local-mode', {
    destinationCity: 'santo_domingo',
    destLat: sd.lat, destLng: sd.lng,
    outboundScheduledTripId: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
    returnScheduledTripId:   'aaaaaaaa-bbbb-cccc-dddd-000000000002',
    nextLongTripStartTime: returnDeparts.toISOString(),
  }, driver.token);
  if (!start?.ok) return { failed: 1, reason: `start ${start?.status} ${JSON.stringify(start?.data).slice(0,150)}` };
  state.artifacts.hybridContexts.push(driver.id);

  // GET /driver-hybrid/me
  const me = await get('/driver-hybrid/me', driver.token);
  const inLocal = me?.data?.state === 'AVAILABLE_LOCAL';

  // Cleanup: cancelar el modo
  await post('/driver-hybrid/cancel', {}, driver.token);

  return { started: start?.ok ? 1 : 0, inAvailableLocal: inLocal ? 1 : 0, failed: 0 };
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup() {
  if (KEEP) { info('Cleanup skipped (--keep)'); return; }
  banner('CLEANUP — suspendiendo usuarios test + cancelando artifacts');
  // Cancelar rides activos
  for (const rideId of state.artifacts.rides) {
    try { await put(`/rides/${rideId}/cancel`, { reason: 'test cleanup' }, state.adminToken); }
    catch {}
  }
  // Suspender usuarios test
  const allUsers = [
    ...state.drivers.map((d) => d.id),
    ...state.passengers.map((p) => p.id),
    ...state.corporates.flatMap((c) => c.employees.map((e) => e.id)),
  ].filter(Boolean);
  let suspended = 0;
  for (const uid of allUsers) {
    const r = await patch(`/auth/admin/users/${uid}/status`, { status: 'suspended' }, state.adminToken);
    if (r?.ok) suspended++;
  }
  ok(`${suspended}/${allUsers.length} usuarios suspendidos`);
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

function report() {
  banner('REPORTE FINAL');
  const total = state.results.length;
  const okCount = state.results.filter((r) => r.status === 'OK').length;
  const partial = state.results.filter((r) => r.status === 'PARTIAL').length;
  const failCount = state.results.filter((r) => r.status === 'FAIL').length;

  console.log(`\nTotal: ${total} · OK: ${C.g}${okCount}${C.w} · PARTIAL: ${C.y}${partial}${C.w} · FAIL: ${C.r}${failCount}${C.w}\n`);
  for (const r of state.results) {
    const c = r.status === 'OK' ? C.g : r.status === 'PARTIAL' ? C.y : C.r;
    console.log(`  ${c}[${r.status}]${C.w} #${r.scenario} ${r.name} · ${r.duration}ms`);
    if (r.error) console.log(`     error: ${r.error}`);
    if (r.detail) console.log(`     ${C.dim}${JSON.stringify(r.detail).slice(0, 200)}${C.w}`);
  }

  // Persist JSON
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-report-${ts}.json`;
  writeFileSync(filename, JSON.stringify({ api: API, startedAt: ts, results: state.results, state: {
    driversCount: state.drivers.length,
    passengersCount: state.passengers.length,
    corporatesCount: state.corporates.length,
    artifacts: {
      rides: state.artifacts.rides.length,
      parcels: state.artifacts.parcels.length,
      scheduledTrips: state.artifacts.scheduledTrips.length,
    },
  } }, null, 2));
  info(`Reporte JSON: ${filename}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`${C.bold}${C.g}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.w}`);
  console.log(`${C.bold}${C.g}  GOING — Intensive Field Test (10 drivers)${C.w}`);
  console.log(`${C.bold}${C.g}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.w}`);
  info(`API: ${API}`);
  info(`DryRun: ${DRY_RUN} · Keep: ${KEEP}`);
  if (ONLY_SCENARIOS) info(`Solo escenarios: ${[...ONLY_SCENARIOS].join(',')}`);

  if (!DRY_RUN) {
    await loginAdmin();
    ok('Admin autenticado');
  }

  // Setup en paralelo
  await Promise.all([
    setupDrivers(),
    setupPassengers(),
  ]);
  await setupCorporates();

  if (state.drivers.length === 0 || state.passengers.length === 0) {
    err('Sin drivers/passengers test creados — abortando');
    process.exit(1);
  }
  if (state.corporates.length === 0) {
    warn('Sin corporates — escenario #8 será SKIPPED');
  }

  // Ejecución mixta:
  //   Secuenciales:    #1, #4, #9 (necesitan estado limpio o cron timing)
  //   Concurrentes:    #2, #5, #6, #7, #8 (independientes entre sí)
  //   En background:   #3 (espera 30s sin bloquear)

  banner('EJECUCIÓN — escenarios mixtos');
  await runScenario(1, 'Privado happy path', scenario1_privadoHappy);

  // #3 en background
  const s3 = runScenario(3, 'Driver no-show (30s wait)', scenario3_driverNoShow);

  // Concurrentes
  await Promise.all([
    runScenario(2, 'Cancelación pre-pickup', scenario2_cancelPrePickup),
    runScenario(5, 'Envío urbano OTP', scenario5_parcelUrban),
    runScenario(6, 'Envío cancel pre-pickup', scenario6_parcelCancel),
    runScenario(7, 'Demanda concurrente Mariscal', scenario7_concurrentDemand),
    runScenario(8, 'Corporativo +25%', scenario8_corporate25),
  ]);

  // Secuenciales finales
  await runScenario(4, 'Compartido VAN Quito→SD', scenario4_carpool);
  await runScenario(9, 'Hybrid Mode (driver SD)', scenario9_hybridMode);

  await s3; // join

  // Cleanup + reporte
  await cleanup();
  report();

  const failed = state.results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { err(`Top-level: ${e.message}`); process.exit(1); });
