#!/usr/bin/env node
/**
 * audit-admin-accounts.mjs — AUDITORÍA READ-ONLY de cuentas con roles elevados.
 *
 * Motivo: el endpoint público POST /auth/register aceptaba roles:['admin'] sin
 * verificación, así que pudieron crearse admins ilegítimos. Este script lista
 * TODAS las cuentas con rol elevado (admin/operator/corporate) en Atlas para
 * que puedas revisarlas a mano ANTES y DESPUÉS de deployar el fix.
 *
 *   ✅ Solo LEE. No modifica, no borra, no degrada nada.
 *
 * Uso (la connection string NO se hardcodea — se pasa por arg o env):
 *   node scripts/audit-admin-accounts.mjs "mongodb+srv://USER:PASS@going-cluster.vy28mpj.mongodb.net/DB"
 *   # o vía env (igual que el servicio): USER_DB_URL / MONGO_URL / DATABASE_URL / MONGODB_URI
 *   USER_DB_URL="mongodb+srv://..." node scripts/audit-admin-accounts.mjs
 *
 * La URI sale de GCP Secret Manager (la misma que usa user-auth-service). Desde
 * una laptop, Atlas puede requerir que tu IP esté en el allowlist del cluster.
 */
import mongoose from 'mongoose';

const ELEVATED = ['admin', 'operator', 'corporate'];
// Heurística de "oficial": emails del dominio de la empresa. Ajustá si hace falta.
const OFFICIAL_SUFFIXES = ['@goingec.com', '@thornai.tech', '@thornai.com'];

const uri =
  process.argv[2] ||
  process.env.MONGODB_URI ||
  process.env.USER_DB_URL ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL;

if (!uri) {
  console.error(
    '❌ Falta la connection string de Mongo.\n' +
      '   Pásala como argumento o por env (USER_DB_URL / MONGO_URL / DATABASE_URL / MONGODB_URI).'
  );
  process.exit(1);
}

const isOfficial = (email) =>
  typeof email === 'string' &&
  OFFICIAL_SUFFIXES.some((s) => email.toLowerCase().endsWith(s));

const fmt = (d) => {
  try {
    return d ? new Date(d).toISOString() : '—';
  } catch {
    return String(d);
  }
};

async function main() {
  console.log('🔎 Auditoría READ-ONLY de roles elevados en Atlas…\n');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log(`   Conectado a DB: ${db.databaseName}\n`);

  const collections = await db.listCollections().toArray();
  const allElevated = [];

  for (const { name } of collections) {
    let docs = [];
    try {
      docs = await db
        .collection(name)
        .find({ roles: { $in: ELEVATED } })
        .project({
          email: 1,
          roles: 1,
          status: 1,
          createdAt: 1,
          oauthProvider: 1,
          companyId: 1,
          id: 1,
        })
        .toArray();
    } catch {
      // Colecciones sin esquema compatible / sin permisos: se saltan.
      continue;
    }
    if (docs.length) {
      for (const d of docs) allElevated.push({ collection: name, ...d });
    }
  }

  const admins = allElevated.filter((d) => (d.roles || []).includes('admin'));
  const suspects = admins.filter((d) => !isOfficial(d.email));

  console.log('────────────────────────────────────────────────────────');
  console.log(
    `RESUMEN: ${allElevated.length} cuenta(s) con rol elevado; ${admins.length} admin(s).`
  );
  console.log('────────────────────────────────────────────────────────\n');

  const printRow = (d) =>
    console.log(
      `  • ${d.email ?? '(sin email)'}\n` +
        `      roles=${JSON.stringify(d.roles)} status=${d.status ?? '—'} ` +
        `oauth=${d.oauthProvider ?? 'no'} companyId=${d.companyId ?? '—'}\n` +
        `      createdAt=${fmt(d.createdAt)} id=${d.id ?? d._id} [${d.collection}]`
    );

  if (admins.length) {
    console.log('👑 ADMINS:');
    admins.forEach(printRow);
    console.log('');
  }

  if (suspects.length) {
    console.log('⚠️  ADMINS SOSPECHOSOS (email fuera del dominio oficial — revisar a mano):');
    suspects.forEach(printRow);
    console.log('');
    console.log('   Si confirmás que alguno es ilegítimo, degradalo a "user" a mano,');
    console.log('   por ejemplo desde mongosh (NO ejecutado por este script):');
    console.log("     db.<coleccion>.updateOne({ email: '<correo>' }, { $set: { roles: ['user'] } })");
  } else if (admins.length) {
    console.log('✅ Todos los admins tienen email del dominio oficial. Revisá igual createdAt/oauth.');
  } else {
    console.log('✅ No se encontraron cuentas admin.');
  }

  // Otros roles elevados (operator/corporate) para visibilidad completa.
  const others = allElevated.filter((d) => !(d.roles || []).includes('admin'));
  if (others.length) {
    console.log('\nℹ️  Otras cuentas con rol elevado (operator/corporate):');
    others.forEach(printRow);
  }

  console.log('\n🔒 READ-ONLY: no se modificó ningún dato.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Error en la auditoría:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  process.exit(1);
});
