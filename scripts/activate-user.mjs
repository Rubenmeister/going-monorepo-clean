import { MongoClient } from 'C:/Users/USER1/going-monorepo-clean/node_modules/.pnpm/mongodb@6.20.0/node_modules/mongodb/lib/index.js';

const uri = 'mongodb+srv://rubenmeister_db_user:XFjLjPaQ7JFNhlro@going-cluster.vy28mpj.mongodb.net/going-user-auth?authSource=admin&appName=GOING-CLUSTER';

const client = new MongoClient(uri);
await client.connect();
console.log('Connected to MongoDB Atlas');

const coll = client.db('going-user-auth').collection('usermodelschemas');

const user = await coll.findOne({ email: 'test@going.com' });
console.log('User found:', user ? `${user.email} | status=${user.status} | id=${user._id}` : 'NOT FOUND');

if (user) {
  const result = await coll.updateOne(
    { email: 'test@going.com' },
    { $set: { status: 'active' } }
  );
  console.log('Modified count:', result.modifiedCount);
  const updated = await coll.findOne({ email: 'test@going.com' });
  console.log('New status:', updated.status);
}

await client.close();
console.log('Done.');
