#!/usr/bin/env node
/**
 * seed-red-zones.mjs
 *
 * Siembra las 4 ZONAS ROJAS (kind='danger') de Quito para que la alerta de
 * seguridad del conductor empiece a funcionar. La app del conductor
 * (DriverHomeScreen) ya consulta `GET /zones/match` mientras se mueve y muestra
 * un overlay cuando entra en una zona `danger` — sólo faltaban los datos.
 *
 * Los polígonos son APROXIMADOS (rectángulos alrededor de cada área conocida).
 * Rubén los ajusta luego en el admin de zonas (o re-corriendo este seed con
 * mejores coords). Mejor una alerta aproximada hoy que ninguna.
 *
 * Escribe DIRECTO en Mongo (colección `zones` de la db `going-transport`, la que
 * usa transport-service) — mismo patrón que scripts/seed-virtual-schedules.mjs,
 * porque crear zonas por API exige un JWT admin.
 *
 * Doc que inserta (ver transport-service/.../schemas/zone.schema.ts):
 *   { id, name, kind:'danger',
 *     geometry:{ type:'Polygon', coordinates:[[[lng,lat]...]] },  // GeoJSON, ring cerrado
 *     notes, active:true, createdAt, updatedAt }
 * El índice 2dsphere valida el polígono en el insert.
 *
 * USO:
 *   node scripts/seed-red-zones.mjs            # crea/actualiza las 4 zonas
 *   node scripts/seed-red-zones.mjs --clean    # las borra (RZONE_*)
 *   node scripts/seed-red-zones.mjs --dry-run  # preview sin escribir
 *
 * ENV (.env / .env.local):
 *   MONGODB_URL   — connection string de Atlas (requerida).
 *   MONGO_DB_NAME — opcional; default 'going-transport'.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const PREFIX = 'RZONE_';
const DB_NAME = process.env.MONGO_DB_NAME || 'going-transport';

/**
 * Construye un ring GeoJSON (cerrado, sentido antihorario) desde un bounding box.
 * bbox = { minLng, minLat, maxLng, maxLat }. Coords en [lng, lat].
 */
function boxRing({ minLng, minLat, maxLng, maxLat }) {
  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat], // cierre
  ];
}

// Las 4 zonas del spec (going-red-zones-quito). bbox APROXIMADO por área.
const ZONES = [
  {
    id: `${PREFIX}sur_quitumbe_guamani`,
    name: '🔴 Sur — Quitumbe / Guamaní',
    bbox: { minLng: -78.565, minLat: -0.325, maxLng: -78.535, maxLat: -0.285 },
    notes:
      'Zona sur (Quitumbe/Guamaní): mayor incidencia nocturna. Extrema la ' +
      'precaución después de las 20:00, confirma el punto de encuentro y ' +
      'evita callejones. Mantén puertas seguras.',
  },
  {
    id: `${PREFIX}norte_roldos_comite`,
    name: '🔴 Norte — La Roldós / Comité del Pueblo',
    bbox: { minLng: -78.497, minLat: -0.102, maxLng: -78.465, maxLat: -0.073 },
    notes:
      'Zona norte (La Roldós/Comité del Pueblo): reportes de inseguridad. ' +
      'Precaución de noche, mantén puertas seguras y ventanas arriba.',
  },
  {
    id: `${PREFIX}centro_sanroque_panecillo`,
    name: '🔴 Centro — San Roque / La Marín / Panecillo',
    bbox: { minLng: -78.527, minLat: -0.237, maxLng: -78.503, maxLat: -0.208 },
    notes:
      'Centro histórico (San Roque/La Marín/El Panecillo): hurtos frecuentes. ' +
      'Evita detenerte de noche, ventanas arriba y no dejes objetos a la vista.',
  },
  {
    id: `${PREFIX}vias_cumbaya_rutaviva`,
    name: '🔴 Vías — Cumbayá / Ruta Viva / Simón Bolívar',
    bbox: { minLng: -78.452, minLat: -0.242, maxLng: -78.400, maxLat: -0.178 },
    notes:
      'Vías Cumbayá / Ruta Viva / Simón Bolívar: robos en la vía de noche. ' +
      'Mantén velocidad, puertas seguras y no te detengas ante señales dudosas.',
  },
];

async function connectMongo() {
  const url = process.env.MONGODB_URL;
  if (!url) throw new Error('MONGODB_URL no está seteada en .env o environment');
  await mongoose.connect(url, { dbName: DB_NAME });
  console.log(`✓ Mongo conectado (db: ${DB_NAME})`);
}

async function seed(dryRun) {
  const zones = mongoose.connection.collection('zones');
  if (dryRun) {
    console.log(`[dry-run] Crearía/actualizaría ${ZONES.length} zonas danger:`);
    for (const z of ZONES) {
      console.log(`  - ${z.id} · ${z.name}`);
      console.log(`      bbox lng[${z.bbox.minLng}, ${z.bbox.maxLng}] lat[${z.bbox.minLat}, ${z.bbox.maxLat}]`);
    }
    return;
  }
  const now = new Date();
  for (const z of ZONES) {
    await zones.updateOne(
      { id: z.id },
      {
        $set: {
          id: z.id,
          name: z.name,
          kind: 'danger',
          geometry: { type: 'Polygon', coordinates: [boxRing(z.bbox)] },
          notes: z.notes,
          active: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    console.log(`✓ ${z.name}`);
  }
  console.log(`\n✓ ${ZONES.length} zonas rojas sembradas (kind='danger', activas)`);
}

async function clean(dryRun) {
  const zones = mongoose.connection.collection('zones');
  const filter = { id: { $regex: `^${PREFIX}` } };
  if (dryRun) {
    const n = await zones.countDocuments(filter);
    console.log(`[dry-run] Borraría ${n} zonas ${PREFIX}*`);
    return;
  }
  const r = await zones.deleteMany(filter);
  console.log(`✓ Borradas ${r.deletedCount} zonas rojas`);
}

const args = process.argv.slice(2);
const opts = { clean: args.includes('--clean'), dryRun: args.includes('--dry-run') };

(async () => {
  try {
    await connectMongo();
    if (opts.clean) {
      await clean(opts.dryRun);
    } else {
      console.log(`\n→ Sembrando ${ZONES.length} zonas rojas de Quito (polígonos aproximados)`);
      await seed(opts.dryRun);
      if (!opts.dryRun) {
        console.log('\n📋 Verificar:');
        console.log('   - El conductor que entre a una de estas áreas verá el overlay de zona roja.');
        console.log('   - Ajusta los bordes en el admin de zonas cuando quieras (coords finas).');
        console.log('   - Prueba /zones/match?lat=..&lng=.. con un punto dentro (debe traer inDangerZone:true).');
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
