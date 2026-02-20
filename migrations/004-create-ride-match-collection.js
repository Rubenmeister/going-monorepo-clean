/**
 * Migration: Create RideMatch Collection with Indexes
 * Version: 002
 * Description: Create ride_matches collection for driver matching with TTL
 */

module.exports = {
  async up(db, client) {
    console.log('Creating ride_matches collection...');

    await db.createCollection('ride_matches', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'matchId',
            'rideId',
            'driverId',
            'distance',
            'eta',
            'acceptanceStatus',
            'driverInfo',
            'createdAt',
            'expiresAt',
          ],
          properties: {
            matchId: { bsonType: 'string' },
            rideId: { bsonType: 'string' },
            driverId: { bsonType: 'string' },
            distance: { bsonType: 'double' },
            eta: { bsonType: 'int' },
            acceptanceStatus: {
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
            },
            driverInfo: { bsonType: 'object' },
            createdAt: { bsonType: 'date' },
            expiresAt: { bsonType: 'date' },
            acceptedAt: { bsonType: 'date' },
            rejectedAt: { bsonType: 'date' },
          },
        },
      },
    });

    const collection = db.collection('ride_matches');
    await collection.createIndex({ matchId: 1 }, { unique: true });
    await collection.createIndex({ rideId: 1, createdAt: -1 });
    await collection.createIndex({ driverId: 1, acceptanceStatus: 1 });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ RideMatch collection created');
  },

  async down(db, client) {
    console.log('Dropping ride_matches collection...');
    await db.dropCollection('ride_matches');
    console.log('✅ RideMatch collection dropped');
  },
};
