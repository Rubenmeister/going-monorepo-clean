/**
 * reset-admin.js — crea o resetea una cuenta admin directamente en Mongo.
 *
 * Uso (PowerShell):
 *   $env:USER_DB_URL="mongodb+srv://..."
 *   node scripts/reset-admin.js rubenmeister@gmail.com MiPasswordNuevo123!
 *
 * Si el usuario existe: le pone passwordHash nuevo, agrega rol 'admin' y status 'active'.
 * Si no existe: lo crea con nombre Admin Root.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const [, , email, password] = process.argv;
const mongoUrl = process.env.USER_DB_URL;

if (!email || !password) {
  console.error('Uso: node scripts/reset-admin.js <email> <password>');
  process.exit(1);
}
if (!mongoUrl) {
  console.error('Falta env USER_DB_URL (la misma URL de Cloud Run).');
  process.exit(1);
}

(async () => {
  // La DB del user-auth-service se llama going-user-auth y la colección que
  // Mongoose autogenera para UserModelSchema es 'usermodelschemas'.
  await mongoose.connect(mongoUrl, { dbName: 'going-user-auth' });
  const Users = mongoose.connection.collection('usermodelschemas');

  const existing = await Users.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    const roles = Array.from(new Set([...(existing.roles || []), 'admin']));
    await Users.updateOne(
      { email },
      { $set: { passwordHash, roles, status: 'active' } }
    );
    console.log(`Actualizado ${email} → roles=${roles.join(',')} status=active`);
  } else {
    const id = randomUUID();
    await Users.insertOne({
      _id: id,
      id,
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'Root',
      roles: ['admin'],
      status: 'active',
      createdAt: new Date(),
    });
    console.log(`Creado admin ${email} con id=${id}`);
  }

  await mongoose.disconnect();
  console.log('Listo. Ya puedes entrar a admin.goingec.com con esa clave.');
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
