/**
 * Publish all draft catalog items (tours, accommodations, experiences)
 * Run after seed-catalog.mjs to make items searchable.
 * Usage: node scripts/publish-catalog.mjs
 */

const BASE = 'https://{svc}-780842550857.us-central1.run.app';
const svcUrl = (svc) => BASE.replace('{svc}', svc);

async function get(svc, path) {
  const url = svcUrl(svc) + path;
  const res = await fetch(url);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function patch(svc, path, body) {
  const url = svcUrl(svc) + path;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// Instead of individual PATCH calls, use the MongoDB Atlas Data API
// or a direct Node.js mongo connection to bulk-update status to 'published'

import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL ||
  'mongodb+srv://rubenmeister_db_user:XFjLjPaQ7JFNhlro@going-cluster.vy28mpj.mongodb.net/?retryWrites=true&w=majority&appName=GOING-CLUSTER';

async function publishAll() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const toursDb = client.db('going-tours');
    const accsDb = client.db('going-accommodations');
    const expsDb = client.db('going-experiences');

    const tourResult = await toursDb.collection('tourmodelschemas').updateMany(
      { status: 'draft' },
      { $set: { status: 'published' } }
    );
    console.log(`Tours published: ${tourResult.modifiedCount}`);

    const accResult = await accsDb.collection('accommodationmodelschemas').updateMany(
      { status: 'draft' },
      { $set: { status: 'published' } }
    );
    console.log(`Accommodations published: ${accResult.modifiedCount}`);

    const expResult = await expsDb.collection('experiencemodelschemas').updateMany(
      { status: 'draft' },
      { $set: { status: 'published' } }
    );
    console.log(`Experiences published: ${expResult.modifiedCount}`);

    console.log('\nVerifying counts...');
    const tours = await toursDb.collection('tourmodelschemas').countDocuments({ status: 'published' });
    const accs = await accsDb.collection('accommodationmodelschemas').countDocuments({ status: 'published' });
    const exps = await expsDb.collection('experiencemodelschemas').countDocuments({ status: 'published' });
    console.log(`  Tours published: ${tours}`);
    console.log(`  Accommodations published: ${accs}`);
    console.log(`  Experiences published: ${exps}`);

  } finally {
    await client.close();
  }
}

publishAll().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
