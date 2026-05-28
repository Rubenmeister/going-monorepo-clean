#!/usr/bin/env node
/**
 * seed-synthetic-drivers.mjs
 *
 * Crea conductoras y conductores sintéticos en Mongo + Redis para que la
 * app pasajero muestre una red "viva" durante el periodo de onboarding de
 * los conductores reales (estrategia weekend 28-may al lanzamiento 16-jun).
 *
 * Diseño:
 *   - Todos los drivers sintéticos tienen `driverId` con prefijo "SYN_"
 *     para identificarlos y borrarlos fácil con --clean.
 *   - Distribución por ciudad activa (coverage.yaml).
 *   - Mix de vehículos: 70% SUV, 20% VAN, 10% Minibús.
 *   - Rating 4.2 - 4.95 (realista, varía).
 *   - Status `online` en Redis para que el matching los seleccione.
 *
 * USO:
 *   # Crear 30 drivers (default):
 *   node scripts/seed-synthetic-drivers.mjs
 *
 *   # Crear N drivers:
 *   node scripts/seed-synthetic-drivers.mjs --count=50
 *
 *   # Borrar todos los sintéticos:
 *   node scripts/seed-synthetic-drivers.mjs --clean
 *
 *   # Preview sin escribir (dry-run):
 *   node scripts/seed-synthetic-drivers.mjs --dry-run
 *
 * VARIABLES DE ENTORNO REQUERIDAS:
 *   MONGODB_URL       — Mongo connection string
 *                       (ej. mongodb+srv://user:pass@cluster.mongodb.net/going-platform)
 *   REDIS_URL         — Redis connection string
 *                       (ej. redis://default:pass@host:port)
 *
 * Se cargan desde .env si existe (compatible con dotenv).
 *
 * ⚠️ IMPORTANTE:
 *   - Estos drivers APARECEN en el matching pero NO aceptan reservas
 *     reales (no hay app conductor real conectada). Cuando un pasajero
 *     reserve, el viaje quedará "buscando conductor" hasta timeout.
 *   - Para que el flujo de testing end-to-end funcione, considerar
 *     emparejar con un script auto-accept (no incluido en MVP).
 *   - NO usar en producción real con tráfico de usuarios — solo para
 *     UX/visual testing en pre-launch.
 */
import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ─── Constantes ──────────────────────────────────────────────────────

const SYN_PREFIX = 'SYN_';

const CITIES = [
  // Hub principal — más drivers
  { id: 'quito',         label: 'Quito',         lat: -0.1807, lng: -78.4678, drivers: 8 },
  // Sierra Norte
  { id: 'otavalo',       label: 'Otavalo',       lat:  0.2342, lng: -78.2611, drivers: 3 },
  { id: 'ibarra',        label: 'Ibarra',        lat:  0.3517, lng: -78.1222, drivers: 3 },
  { id: 'cayambe',       label: 'Cayambe',       lat:  0.0403, lng: -78.1456, drivers: 2 },
  // Sierra Centro
  { id: 'ambato',        label: 'Ambato',        lat: -1.2417, lng: -78.6197, drivers: 4 },
  { id: 'latacunga',     label: 'Latacunga',     lat: -0.9333, lng: -78.6167, drivers: 3 },
  { id: 'riobamba',      label: 'Riobamba',      lat: -1.6644, lng: -78.6544, drivers: 3 },
  // Costa Noroeste
  { id: 'santo_domingo', label: 'Santo Domingo', lat: -0.2533, lng: -79.1717, drivers: 4 },
];

const VEHICLES = [
  { type: 'suv',     weight: 7, plate_prefix: 'PEK', model: 'Chevrolet Trailblazer' },
  { type: 'suv',     weight: 7, plate_prefix: 'PCM', model: 'Toyota Fortuner' },
  { type: 'suv',     weight: 7, plate_prefix: 'PCO', model: 'Hyundai Tucson' },
  { type: 'suv_xl',  weight: 3, plate_prefix: 'PEN', model: 'Toyota Prado' },
  { type: 'van',     weight: 5, plate_prefix: 'PCO', model: 'Toyota Hiace' },
  { type: 'van',     weight: 5, plate_prefix: 'PEX', model: 'Hyundai H1' },
  { type: 'minibus', weight: 2, plate_prefix: 'PEM', model: 'Hyundai County' },
];

const NOMBRES = [
  'Juan Carlos',  'María José',  'Diego',       'Andrea',       'Luis Fernando',
  'Patricia',     'José Luis',   'Verónica',    'Carlos Andrés', 'Mónica',
  'Fernando',     'Daniela',     'Ricardo',     'Gabriela',     'Pablo',
  'Cristina',     'Marco',       'Lucía',       'Esteban',      'Paola',
  'Alejandro',    'Adriana',     'Mauricio',    'Carolina',     'Francisco',
  'Ana Lucía',    'Roberto',     'Valeria',     'David',        'Belén',
];

const APELLIDOS = [
  'Pérez Andrade',     'Vásquez Toro',     'Jaramillo Cabrera', 'Cobos Suárez',
  'Almeida Ortiz',     'Cevallos Lema',    'Trujillo Granda',   'Espinoza Mora',
  'Vega Salazar',      'Andrade Vinueza',  'Cárdenas Padilla',  'Tapia Romero',
  'Naranjo Carrera',   'Sánchez Heredia',  'Tobar Acosta',      'Bonilla Quiroz',
  'Ríos Carrasco',     'Yánez Velasco',    'Pacheco Egas',      'Vela Avilés',
];

// ─── Helpers ─────────────────────────────────────────────────────────

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomVehicle() {
  const totalWeight = VEHICLES.reduce((s, v) => s + v.weight, 0);
  let r = Math.random() * totalWeight;
  for (const v of VEHICLES) {
    r -= v.weight;
    if (r <= 0) return v;
  }
  return VEHICLES[0];
}

function randomPlate(prefix) {
  const numbers = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${numbers}`;
}

function randomRating() {
  // 4.2 - 4.95 (realista, varía)
  return Math.round((4.2 + Math.random() * 0.75) * 100) / 100;
}

function randomBadges(rating, completedTrips) {
  const badges = [];
  if (rating >= 4.8 && completedTrips >= 100) badges.push('super_driver');
  if (rating >= 4.5) badges.push('highly_rated');
  if (completedTrips >= 200) badges.push('veteran_driver');
  return badges;
}

function buildDriver(city, index) {
  const driverId      = `${SYN_PREFIX}drv_${city.id}_${String(index).padStart(2, '0')}`;
  const baseId        = `${SYN_PREFIX}base_${city.id}_${String(index).padStart(2, '0')}`;
  const firstName     = randomPick(NOMBRES);
  const lastName      = randomPick(APELLIDOS);
  const fullName      = `${firstName} ${lastName}`;
  const vehicle       = randomVehicle();
  const plate         = randomPlate(vehicle.plate_prefix);
  const rating        = randomRating();
  const completedTrips = Math.floor(Math.random() * 250);
  const cancelledTrips = Math.floor(Math.random() * 10);
  const acceptanceRate = Math.floor(85 + Math.random() * 15);

  // Posición aleatoria dentro de un radio de ~5km del centroide
  const offsetLat = (Math.random() - 0.5) * 0.04;
  const offsetLng = (Math.random() - 0.5) * 0.04;
  const lat = city.lat + offsetLat;
  const lng = city.lng + offsetLng;

  return {
    driverId,
    baseId,
    fullName,
    firstName,
    lastName,
    city: city.id,
    cityLabel: city.label,
    lat,
    lng,
    vehicleType: vehicle.type,
    vehicleModel: vehicle.model,
    plate,
    rating,
    completedTrips,
    cancelledTrips,
    acceptanceRate,
    badges: randomBadges(rating, completedTrips),
  };
}

function generateAll(targetCount) {
  // Distribuir según pesos de CITIES.drivers, escalando al targetCount.
  const baseSum = CITIES.reduce((s, c) => s + c.drivers, 0);
  const scale = targetCount / baseSum;
  const drivers = [];

  for (const city of CITIES) {
    const count = Math.max(1, Math.round(city.drivers * scale));
    for (let i = 0; i < count; i++) {
      drivers.push(buildDriver(city, i));
    }
  }
  return drivers.slice(0, targetCount);
}

// ─── Mongo + Redis ───────────────────────────────────────────────────

async function connectMongo() {
  const url = process.env.MONGODB_URL;
  if (!url) throw new Error('MONGODB_URL no está seteada en .env o environment');
  await mongoose.connect(url, { dbName: 'going-platform' });
  console.log('✓ Mongo conectado');
}

function connectRedis() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL no está seteada en .env o environment');
  const r = new Redis(url, { maxRetriesPerRequest: 3 });
  console.log('✓ Redis conectado');
  return r;
}

async function insertToMongo(drivers, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Insertaría ${drivers.length} drivers en Mongo:`);
    console.log(`  - ${drivers.length} en driver_profiles`);
    console.log(`  - ${drivers.length} en driver_bases`);
    return;
  }

  const profilesColl = mongoose.connection.collection('driver_profiles');
  const basesColl    = mongoose.connection.collection('driver_bases');

  const profileDocs = drivers.map(d => ({
    driverId:           d.driverId,
    averageRating:      d.rating,
    totalRatings:       Math.max(10, d.completedTrips),
    completedTrips:     d.completedTrips,
    cancelledTrips:     d.cancelledTrips,
    acceptanceRate:     d.acceptanceRate,
    cancellationRate:   Math.round((d.cancelledTrips / Math.max(1, d.completedTrips)) * 100),
    onTimeDeliveryRate: 90 + Math.floor(Math.random() * 10),
    totalEarnings:      d.completedTrips * (15 + Math.random() * 20),
    averageEarningsPerTrip: 15 + Math.random() * 20,
    badges:             d.badges,
    createdAt:          new Date(),
    updatedAt:          new Date(),
  }));

  const baseDocs = drivers.map(d => ({
    id:          d.baseId,
    driverId:    d.driverId,
    name:        d.fullName,
    lat:         d.lat,
    lng:         d.lng,
    location:    { type: 'Point', coordinates: [d.lng, d.lat] },
    radiusKm:    5,
    isPrimary:   true,
    active:      true,
    createdAt:   new Date(),
    updatedAt:   new Date(),
  }));

  await profilesColl.insertMany(profileDocs, { ordered: false });
  await basesColl.insertMany(baseDocs, { ordered: false });
  console.log(`✓ Mongo: ${drivers.length} profiles + ${drivers.length} bases insertados`);
}

async function populateRedis(redis, drivers, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] Populating Redis para ${drivers.length} drivers (GEOADD + HSET availability)`);
    return;
  }

  const pipeline = redis.pipeline();
  for (const d of drivers) {
    // GEO index para búsqueda por radio
    pipeline.geoadd('going:drivers:locations', d.lng, d.lat, d.driverId);
    // Availability hash
    pipeline.hset(`going:driver_availability:${d.driverId}`, {
      status:         'online',
      vehicleType:    d.vehicleType,
      vehicleModel:   d.vehicleModel,
      plate:          d.plate,
      firstName:      d.firstName,
      lastName:       d.lastName,
      rating:         String(d.rating),
      acceptanceRate: String(d.acceptanceRate),
      serviceTypes:   JSON.stringify(['confort', 'premium']),
      isSynthetic:    'true',
      lastUpdate:     String(Date.now()),
    });
  }
  await pipeline.exec();
  console.log(`✓ Redis: ${drivers.length} drivers en GEO + HSET availability`);
}

async function cleanAll(redis, dryRun) {
  if (dryRun) {
    console.log('[dry-run] Limpiaría todos los SYN_* drivers de Mongo + Redis');
    return;
  }

  // Mongo
  const profilesColl = mongoose.connection.collection('driver_profiles');
  const basesColl    = mongoose.connection.collection('driver_bases');
  const synFilter    = { driverId: { $regex: `^${SYN_PREFIX}` } };

  const synDriverIds = (await basesColl.find(synFilter).project({ driverId: 1 }).toArray())
    .map(d => d.driverId);

  const profilesDel = await profilesColl.deleteMany(synFilter);
  const basesDel    = await basesColl.deleteMany(synFilter);
  console.log(`✓ Mongo: ${profilesDel.deletedCount} profiles + ${basesDel.deletedCount} bases borrados`);

  // Redis: borrar availability hashes
  const availKeys = await redis.keys(`going:driver_availability:${SYN_PREFIX}*`);
  if (availKeys.length > 0) await redis.del(...availKeys);
  console.log(`✓ Redis: ${availKeys.length} availability hashes borrados`);

  // Redis: remover del GEO index
  for (const id of synDriverIds) {
    await redis.zrem('going:drivers:locations', id);
  }
  console.log(`✓ Redis: ${synDriverIds.length} entradas removidas de GEO index`);
}

// ─── Main ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const opts = {
  count:   30,
  clean:   args.includes('--clean'),
  dryRun:  args.includes('--dry-run'),
};
for (const a of args) {
  const m = a.match(/^--count=(\d+)$/);
  if (m) opts.count = parseInt(m[1], 10);
}

(async () => {
  try {
    await connectMongo();
    const redis = connectRedis();

    if (opts.clean) {
      await cleanAll(redis, opts.dryRun);
    } else {
      console.log(`\n→ Generando ${opts.count} conductoras/es sintéticos`);
      console.log(`  Distribución: ${CITIES.length} ciudades activas`);
      const drivers = generateAll(opts.count);
      console.log(`  Total: ${drivers.length} drivers`);
      console.log(`  Vehículos: ${drivers.filter(d => d.vehicleType === 'suv').length} SUV · ` +
                  `${drivers.filter(d => d.vehicleType === 'suv_xl').length} SUV XL · ` +
                  `${drivers.filter(d => d.vehicleType === 'van').length} VAN · ` +
                  `${drivers.filter(d => d.vehicleType === 'minibus').length} Minibús\n`);

      await insertToMongo(drivers, opts.dryRun);
      await populateRedis(redis, drivers, opts.dryRun);
    }

    await mongoose.disconnect();
    redis.disconnect();
    console.log('\n✅ Listo.');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  }
})();
