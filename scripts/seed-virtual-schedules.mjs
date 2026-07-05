#!/usr/bin/env node
/**
 * seed-virtual-schedules.mjs
 *
 * Publica AGENDAS de conductoras/es virtuales en los corredores de lanzamiento
 * para poder probar el flujo de VIAJE COMPARTIDO end-to-end CON CERTEZA:
 * el pasajero busca la ruta, ve salidas reales y reserva un asiento
 * (conductor conocido + cupo confirmado al instante) — SIN matching ni
 * auto-accept, porque en compartido el conductor se conoce desde que publica.
 *
 * Cómo funciona (por qué solo sembramos agendas):
 *   El transport-service MATERIALIZA las salidas al vuelo cuando el pasajero
 *   busca (`ScheduledTripService.findOptions` → `materializeForDate` →
 *   `deriveTripSeedsForDate`). Lee `driver_schedules` y genera los
 *   `scheduled_trips` idempotentemente. Por eso NO insertamos scheduled_trips:
 *   basta con la agenda del conductor.
 *
 * Escribe DIRECTO en Mongo porque NO existe endpoint admin para crear
 * conductores ni asignar el rol 'driver' (AdminController solo lista/cambia
 * estado). Mismo patrón que scripts/seed-synthetic-drivers.mjs.
 *
 * Colecciones que toca (db `going-platform`):
 *   - driver_schedules : agenda { driverId, slots[{routeId,time,days,returnTrip}], vehicleType }
 *   - driver_ratings   : 1 doc por conductor para que el pasajero vea una calificación
 *
 * Corredores (routeId) válidos = libs/pricing/corridors.ts:
 *   sierra_norte      = Tulcán · Ibarra · Otavalo → Quito   (ruta de lanzamiento)
 *   sierra_centro     = Riobamba · Ambato · Latacunga → Quito
 *   costa_quito       = El Carmen · La Concordia · Santo Domingo → Quito
 *   sierra_norte_air  = …→ Quito → Aeropuerto  (24h)
 *   sierra_centro_air = …→ Quito → Aeropuerto  (24h)
 *   costa_air         = …→ Quito → Aeropuerto  (24h)
 *
 * USO:
 *   node scripts/seed-virtual-schedules.mjs            # crea la flota programada
 *   node scripts/seed-virtual-schedules.mjs --clean    # la borra
 *   node scripts/seed-virtual-schedules.mjs --dry-run  # preview sin escribir
 *
 * ENV REQUERIDA (se cargan desde .env / .env.local si existen):
 *   MONGODB_URL — connection string de Atlas (db going-platform).
 *
 * ⚠️ Los conductores son virtuales (no hay app conductor real conectada). En
 *    COMPARTIDO no importa: la reserva del asiento da la certeza sola. Para
 *    viajes PRIVADO/URBANO en tiempo real hace falta el auto-accept (aparte).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ─── Constantes ──────────────────────────────────────────────────────────────

const PREFIX = 'VSCHED_';
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]; // Dom..Sáb — cualquier fecha materializa

// Ventana de operación ciudad→Quito (modelo Rubén): salidas CADA HORA de 04:00 a
// 20:00, ida y vuelta. `returnTrip:true` agrega el regreso desde Quito
// automáticamente (a hora + duración + 1.5h). Hora local del server (Cloud Run=UTC).
function hourlyRange(fromH, toH) {
  const out = [];
  for (let h = fromH; h <= toH; h++) out.push(`${String(h).padStart(2, '0')}:00`);
  return out;
}
const CITY_TIMES = hourlyRange(4, 20);    // ciudad→Quito: 04:00 … 20:00
const AIRPORT_TIMES = hourlyRange(0, 23); // aeropuerto: 24h, cada hora 00:00 … 23:00

// Planes de agenda. `times` se REPARTEN round-robin entre los `drivers` del
// corredor (cada quien hace algunas horas, no todas — realista y más liviano de
// materializar); colectivamente cubren cada hora de la ventana.
//
// Corredores de AEROPUERTO (`*_air`, ver libs/pricing/corridors.ts): mismo
// trazado ciudad→…→Quito pero con destino final el aeropuerto; operan 24h.
const CORRIDOR_PLANS = [
  // Ciudad → Quito (04:00–20:00, ida y vuelta)
  { routeId: 'sierra_norte',     times: CITY_TIMES,    drivers: 3 }, // Tulcán·Ibarra·Otavalo → Quito
  { routeId: 'sierra_centro',    times: CITY_TIMES,    drivers: 3 }, // Riobamba·Ambato·Latacunga → Quito
  { routeId: 'costa_quito',      times: CITY_TIMES,    drivers: 2 }, // El Carmen·La Concordia·Sto.Domingo → Quito
  // Ciudad ↔ Aeropuerto (24h, cada hora, ida y vuelta)
  { routeId: 'sierra_norte_air', times: AIRPORT_TIMES, drivers: 4 }, // …→ Quito → Aeropuerto
  { routeId: 'sierra_centro_air', times: AIRPORT_TIMES, drivers: 4 },
  { routeId: 'costa_air',        times: AIRPORT_TIMES, drivers: 3 },
];

// Mayoría SUV (3 asientos); un SUV XL (4) para variar el inventario.
const VEHICLES = ['suv', 'suv', 'suv_xl'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFleet() {
  const drivers = [];
  for (const plan of CORRIDOR_PLANS) {
    // Reparte los horarios round-robin entre los conductores del corredor.
    const perDriver = Array.from({ length: plan.drivers }, () => []);
    plan.times.forEach((t, idx) => perDriver[idx % plan.drivers].push(t));

    for (let i = 0; i < plan.drivers; i++) {
      const driverId = `${PREFIX}${plan.routeId}_${String(i + 1).padStart(2, '0')}`;
      const vehicleType = VEHICLES[i % VEHICLES.length];
      const slots = perDriver[i].map((time) => ({
        routeId: plan.routeId,
        time,
        days: ALL_DAYS,
        returnTrip: true, // ida (→Quito) + vuelta (desde Quito)
      }));
      // Calificación estable (no aleatoria — evita ruido entre corridas).
      const rating = 4.5 + ((i * 7) % 5) / 10; // 4.5..4.9
      drivers.push({ driverId, routeId: plan.routeId, vehicleType, slots, rating });
    }
  }
  return drivers;
}

async function connectMongo() {
  const url = process.env.MONGODB_URL;
  if (!url) throw new Error('MONGODB_URL no está seteada en .env o environment');
  await mongoose.connect(url, { dbName: 'going-platform' });
  console.log('✓ Mongo conectado (going-platform)');
}

async function seed(drivers, dryRun) {
  const schedules = mongoose.connection.collection('driver_schedules');
  const ratings = mongoose.connection.collection('driver_ratings');

  if (dryRun) {
    console.log(`[dry-run] Publicaría ${drivers.length} agendas:`);
    for (const d of drivers) {
      console.log(`  - ${d.driverId} (${d.vehicleType}) · ${d.routeId} · ${d.slots.map(s => s.time).join(', ')} · ★${d.rating}`);
    }
    return;
  }

  for (const d of drivers) {
    // Agenda del conductor (upsert por driverId — índice único).
    await schedules.updateOne(
      { driverId: d.driverId },
      {
        $set: {
          driverId: d.driverId,
          slots: d.slots,
          vehicleType: d.vehicleType,
          opportunisticMode: false,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    // Una calificación para que el pasajero vea ★ (findOptions.avgRatings).
    await ratings.updateOne(
      { driverId: d.driverId, _synthetic: true },
      { $set: { driverId: d.driverId, rating: d.rating, _synthetic: true, createdAt: new Date() } },
      { upsert: true },
    );
  }
  console.log(`✓ ${drivers.length} agendas publicadas + ${drivers.length} calificaciones`);
}

async function clean(dryRun) {
  const schedules = mongoose.connection.collection('driver_schedules');
  const ratings = mongoose.connection.collection('driver_ratings');
  const filter = { driverId: { $regex: `^${PREFIX}` } };

  if (dryRun) {
    const n = await schedules.countDocuments(filter);
    console.log(`[dry-run] Borraría ${n} agendas ${PREFIX}* + sus calificaciones`);
    return;
  }

  const s = await schedules.deleteMany(filter);
  const r = await ratings.deleteMany({ ...filter, _synthetic: true });
  console.log(`✓ Borradas ${s.deletedCount} agendas + ${r.deletedCount} calificaciones`);
  console.log('  Nota: los scheduled_trips ya materializados con esos conductores');
  console.log('  quedan huérfanos; se limpian con un drop de scheduled_trips VSCHED_ si molestan.');
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const opts = {
  clean: args.includes('--clean'),
  dryRun: args.includes('--dry-run'),
};

(async () => {
  try {
    await connectMongo();

    if (opts.clean) {
      await clean(opts.dryRun);
    } else {
      const drivers = buildFleet();
      console.log(`\n→ Publicando ${drivers.length} agendas virtuales en ${CORRIDOR_PLANS.length} corredores`);
      console.log(`  Ciudad→Quito: ${CITY_TIMES[0]}–${CITY_TIMES[CITY_TIMES.length - 1]} cada hora · Aeropuerto: 24h cada hora · todo ida y vuelta`);
      for (const plan of CORRIDOR_PLANS) {
        console.log(`  ${plan.routeId}: ${plan.drivers} conductor(es) cubriendo ${plan.times.length} salidas/hora`);
      }
      console.log('');
      await seed(drivers, opts.dryRun);

      if (!opts.dryRun) {
        console.log('\n📋 Cómo probar la CERTEZA (viaje compartido):');
        console.log('   1. En la webapp/móvil elige "Viaje Compartido".');
        console.log('   2a. Ciudad→Quito: ej. Ibarra → Quito (salidas 04:00–20:00).');
        console.log('   2b. Aeropuerto:  ej. Ibarra → Aeropuerto o Quito → Aeropuerto (24h).');
        console.log('   3. Elige una fecha/hora (las agendas cubren todos los días).');
        console.log('   4. Verás las salidas → reserva un asiento → queda confirmado (certeza).');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Listo.');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  }
})();
