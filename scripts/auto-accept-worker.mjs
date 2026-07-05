#!/usr/bin/env node
/**
 * auto-accept-worker.mjs — "conductor bot" que ACEPTA viajes inmediatos para dar
 * CERTEZA en las pruebas de tiempo real (urbano/privado on-demand).
 *
 * Por qué existe: en tiempo real el pasajero pide un viaje y espera que un
 * conductor lo acepte. Sin conductores reales conectados, el viaje se queda
 * "buscando conductor" hasta el timeout. Este worker simula ese conductor: hace
 * polling de los viajes que esperan conductor y los acepta → el pasajero ve
 * "conductor confirmado".
 *
 * Cómo funciona (TODO por la API pública, no toca Atlas/Redis):
 *   1. Se asegura de tener cuentas "bot" (login; si no existen, /auth/register).
 *      Aceptar NO valida matching/compliance: cualquier cuenta con JWT puede
 *      aceptar un viaje 'requested' (acceptIfRequested asigna al caller como
 *      conductor). Por eso basta con cuentas normales.
 *   2. Poll `GET /rides/pending` (viajes en 'requested') cada POLL_MS.
 *   3. `PUT /rides/:id/accept` con nombre/placa → el pasajero recibe el evento
 *      ride:driver_accepted con esos datos.
 *
 * ⚠️ SEGURIDAD — evitar secuestrar viajes reales:
 *   Aceptar cualquier viaje 'requested' podría tomar el de un pasajero real y
 *   asignarle un conductor falso. Por eso el worker SOLO acepta viajes del
 *   pasajero de prueba que le indiques:
 *     --passenger-email=<email> --passenger-password=<pass>   (recomendado:
 *        el worker hace login para resolver su userId y filtra por él)
 *     --user-id=<uuid>                                        (directo)
 *     --any                                                   (acepta TODOS —
 *        úsalo solo en entornos sin tráfico real; imprime advertencia)
 *
 * USO (Node 18+, fetch nativo):
 *   node scripts/auto-accept-worker.mjs --passenger-email=yo@test.com --passenger-password=Secreto123456
 *   node scripts/auto-accept-worker.mjs --user-id=abc-123 --minutes=15
 *   node scripts/auto-accept-worker.mjs --any        # cuidado
 *
 * FLAGS opcionales:
 *   --api=<url>        default https://api.goingec.com
 *   --bots=<n>         cuántos conductores bot (default 2)
 *   --poll=<seg>       intervalo de polling (default 5)
 *   --minutes=<n>      se apaga solo tras N minutos (default: corre hasta Ctrl+C)
 */

// ── Parseo de flags ───────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const API = (args.api || 'https://api.goingec.com').replace(/\/$/, '');
const NUM_BOTS = Math.max(1, parseInt(args.bots || '2', 10));
const POLL_MS = Math.max(1000, (parseInt(args.poll || '5', 10)) * 1000);
const RUN_MS = args.minutes ? parseInt(args.minutes, 10) * 60_000 : 0;
const BOT_PASSWORD = 'AutoAcceptBot1234!'; // 12+ chars (requisito del auth)

// Perfiles de conductor para el aviso al pasajero (dto del accept).
const BOT_PROFILES = [
  { name: 'Carlos Andrade',  model: 'Chevrolet Trailblazer', plate: 'PBK-4471', rating: 4.9 },
  { name: 'María Vásquez',   model: 'Toyota Fortuner',       plate: 'PCM-2093', rating: 4.8 },
  { name: 'Diego Jaramillo', model: 'Hyundai Tucson',        plate: 'PCO-8812', rating: 4.7 },
  { name: 'Andrea Cobos',    model: 'Toyota Prado',          plate: 'PEN-1550', rating: 5.0 },
];

const C = { g: '\x1b[32m', y: '\x1b[33m', r: '\x1b[31m', b: '\x1b[34m', d: '\x1b[2m', w: '\x1b[0m' };
const log = (m) => console.log(`${C.d}[${new Date().toLocaleTimeString('es-EC')}]${C.w} ${m}`);
const ok = (m) => log(`${C.g}✓${C.w} ${m}`);
const warn = (m) => log(`${C.y}⚠️  ${m}${C.w}`);
const err = (m) => log(`${C.r}✗ ${m}${C.w}`);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

// Login; si el email no existe, lo registra. Devuelve { token, userId }.
async function ensureAccount(email, password, firstName, lastName) {
  let r = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (!r.ok) {
    // Puede no existir → registrar.
    const reg = await api('/auth/register', {
      method: 'POST',
      body: { email, password, firstName, lastName },
    });
    if (!reg.ok) throw new Error(`No pude crear/loguear ${email}: ${reg.status} ${JSON.stringify(reg.data).slice(0, 120)}`);
    r = reg;
  }
  const token = r.data.accessToken || r.data.token;
  const userId = r.data.user?.id || r.data.user?._id || r.data.userId;
  if (!token) throw new Error(`Login OK pero sin token para ${email}`);
  return { token, userId, email };
}

async function main() {
  console.log(`\n${C.b}════ Auto-accept worker (conductor bot) ════${C.w}`);
  log(`API: ${API}`);

  // ── Resolver el pasajero objetivo (filtro de seguridad) ────────────────────
  let targetUserId = args['user-id'] || null;
  const acceptAny = !!args.any;

  if (args['passenger-email']) {
    if (!args['passenger-password']) throw new Error('--passenger-email requiere --passenger-password');
    const p = await ensureAccount(
      args['passenger-email'], args['passenger-password'], 'Pasajero', 'Prueba',
    );
    targetUserId = p.userId;
    ok(`Pasajero objetivo: ${args['passenger-email']} (id ${targetUserId})`);
  } else if (targetUserId) {
    ok(`Pasajero objetivo (userId): ${targetUserId}`);
  } else if (acceptAny) {
    warn('MODO --any: aceptará CUALQUIER viaje en requested. Úsalo solo sin tráfico real.');
  } else {
    err('Falta el pasajero objetivo. Pasa --passenger-email + --passenger-password, o --user-id, o --any.');
    process.exit(1);
  }

  // ── Crear/loguear los conductores bot ──────────────────────────────────────
  const bots = [];
  for (let i = 0; i < NUM_BOTS; i++) {
    const profile = BOT_PROFILES[i % BOT_PROFILES.length];
    const email = `autoaccept.bot${i + 1}@going.ec`;
    const acc = await ensureAccount(email, BOT_PASSWORD, profile.name.split(' ')[0], 'Bot');
    bots.push({ ...acc, profile });
    ok(`Bot ${i + 1} listo: ${profile.name} (${profile.plate})`);
  }

  log(`Polling cada ${POLL_MS / 1000}s${RUN_MS ? ` durante ${RUN_MS / 60000} min` : ' (Ctrl+C para parar)'}…\n`);

  const seen = new Set();       // rides ya intentados (evita reintentar el mismo)
  const startedAt = Date.now();
  let botIdx = 0;

  const tick = async () => {
    try {
      const bot = bots[botIdx % bots.length]; // rotamos qué bot hace el poll/accept
      botIdx++;
      const r = await api('/rides/pending?limit=50', { token: bot.token });
      if (!r.ok) { warn(`/rides/pending → ${r.status}`); return; }
      const rides = Array.isArray(r.data) ? r.data : [];

      for (const ride of rides) {
        const id = ride.id;
        if (!id || seen.has(id)) continue;
        // Filtro de seguridad
        if (!acceptAny && ride.userId !== targetUserId) continue;
        seen.add(id);

        const p = bot.profile;
        const acc = await api(`/rides/${id}/accept`, {
          method: 'PUT',
          token: bot.token,
          body: {
            driverName: p.name,
            vehicleModel: p.model,
            vehiclePlate: p.plate,
            driverRating: p.rating,
            etaMinutes: 3 + (botIdx % 5),
          },
        });
        if (acc.ok && acc.data?.status === 'accepted') {
          ok(`${C.g}VIAJE ACEPTADO${C.w} ${id.slice(0, 8)}… → ${p.name} (${p.plate}) · pasajero ${String(ride.userId).slice(0, 8)}…`);
        } else if (acc.status === 400) {
          warn(`ride ${id.slice(0, 8)}… ya no estaba disponible (otro lo tomó): ${JSON.stringify(acc.data).slice(0, 80)}`);
        } else {
          warn(`accept ${id.slice(0, 8)}… → ${acc.status} ${JSON.stringify(acc.data).slice(0, 80)}`);
        }
      }
    } catch (e) {
      warn(`tick error: ${e.message}`);
    }
  };

  // Loop
  await tick();
  const timer = setInterval(async () => {
    if (RUN_MS && Date.now() - startedAt > RUN_MS) {
      clearInterval(timer);
      ok('Tiempo cumplido — worker apagado.');
      process.exit(0);
    }
    await tick();
  }, POLL_MS);

  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('');
    ok('Detenido por el usuario.');
    process.exit(0);
  });
}

main().catch((e) => { err(e.message); process.exit(1); });
