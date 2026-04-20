/**
 * check-admin.js — verifica y repara la cuenta admin en Mongo.
 *
 * Uso (PowerShell):
 *   $env:USER_DB_URL="mongodb+srv://rubenmeister_db_user:GWvsXRZWPTSVmvXa@going-cluster.vy28mpj.mongodb.net/?appName=GOING-CLUSTER"
 *   node scripts/check-admin.js rubenmeister@gmail.com AdminGoing2026!
 *
 * Qué hace:
 *   1. Conecta a la DB 'going-user-auth', colección 'usermodelschemas'.
 *   2. Busca el documento por email.
 *   3. Muestra los campos clave (sin exponer el hash completo).
 *   4. Verifica bcrypt.compare con la password.
 *   5. Si falta el doc / rol / status / o el bcrypt falla → repara automáticamente.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const [, , email, password] = process.argv;
const mongoUrl = process.env.USER_DB_URL;

if (!email || !password) {
  console.error('Uso: node scripts/check-admin.js <email> <password>');
  process.exit(1);
}
if (!mongoUrl) {
  console.error('Falta env USER_DB_URL.');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(mongoUrl, {
    serverSelectionTimeoutMS: 15000,
  });

  try {
    await client.connect();
    console.log('Conectado a Mongo.');

    const db = client.db('going-user-auth');
    const col = db.collection('usermodelschemas');

    let doc = await col.findOne({ email });

    if (!doc) {
      console.log(`[ESTADO] No existe documento para ${email}. Creándolo…`);
    } else {
      const hash = doc.passwordHash;
      console.log('[ESTADO] Documento encontrado:');
      console.log({
        _id: doc._id,
        id: doc.id,
        email: doc.email,
        firstName: doc.firstName,
        lastName: doc.lastName,
        roles: doc.roles,
        status: doc.status,
        hasPasswordHash: !!hash,
        hashLen: hash ? hash.length : 0,
        hashPreview: hash ? `${hash.slice(0, 7)}…${hash.slice(-4)}` : null,
        createdAt: doc.createdAt,
      });

      if (hash) {
        const ok = await bcrypt.compare(password, hash);
        console.log(`[ESTADO] bcrypt.compare('${password}', hash) = ${ok}`);
      }
    }

    const needRepair =
      !doc ||
      !doc.passwordHash ||
      !(await bcrypt.compare(password, doc.passwordHash)) ||
      !Array.isArray(doc.roles) ||
      !doc.roles.includes('admin') ||
      doc.status !== 'active';

    if (!needRepair) {
      console.log('[OK] Todo correcto. No hace falta reparar.');
      return;
    }

    console.log('[REPARACIÓN] Aplicando fixes…');
    const newHash = await bcrypt.hash(password, 10);

    if (doc) {
      const roles = Array.from(new Set([...(doc.roles || []), 'admin']));
      await col.updateOne(
        { email },
        {
          $set: {
            passwordHash: newHash,
            roles,
            status: 'active',
            firstName: doc.firstName || 'Admin',
            lastName: doc.lastName || 'Root',
          },
        }
      );
      console.log(`[REPARADO] ${email} → roles=${roles.join(',')} status=active`);
    } else {
      const id = randomUUID();
      await col.insertOne({
        _id: id,
        id,
        email,
        passwordHash: newHash,
        firstName: 'Admin',
        lastName: 'Root',
        roles: ['admin'],
        status: 'active',
        createdAt: new Date(),
      });
      console.log(`[CREADO] admin ${email} con id=${id}`);
    }

    const after = await col.findOne({ email });
    console.log('[FINAL]', {
      id: after.id,
      email: after.email,
      roles: after.roles,
      status: after.status,
      hasPasswordHash: !!after.passwordHash,
    });
    const finalOk = await bcrypt.compare(password, after.passwordHash);
    console.log(`[FINAL] bcrypt.compare = ${finalOk}`);
    console.log('Listo. Intenta login ahora.');
  } catch (err) {
    console.error('[ERROR]', err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('EBADNAME') || err.message.includes('querySrv')) {
      console.error(
        '\nSRV falló — tu DNS no resuelve _mongodb._tcp.* . Prueba:\n' +
          '  1. VPN / cambiar a 8.8.8.8 temporalmente, o\n' +
          '  2. Ejecutar con Node configurado para DNS de Google:\n' +
          '     node --dns-result-order=ipv4first scripts/check-admin.js ...'
      );
    }
    process.exit(1);
  } finally {
    await client.close();
  }
})();
