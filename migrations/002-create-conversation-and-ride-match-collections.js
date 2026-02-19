/**
 * Migration: Create Conversation & RideMatch Collections
 * Phase 5: Messaging & Chat System
 *
 * Creates:
 * 1. Conversations collection for managing chat metadata
 * 2. RideMatches collection for driver matching with automatic expiry
 */

module.exports = {
  async up(db) {
    console.log('🚀 Creating conversations collection...');

    // Create conversations collection
    await db.createCollection('conversations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'rideId', 'participants', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              bsonType: 'string',
              description: 'Unique conversation ID (UUID)',
            },
            rideId: {
              bsonType: 'string',
              description: 'Associated ride ID',
            },
            participants: {
              bsonType: 'array',
              description: 'User IDs participating in conversation',
              items: { bsonType: 'string' },
            },
            lastMessage: {
              bsonType: 'object',
              description: 'Last message in conversation',
              properties: {
                messageId: { bsonType: 'string' },
                content: { bsonType: 'string' },
                senderId: { bsonType: 'string' },
                timestamp: { bsonType: 'date' },
              },
            },
            unreadCounts: {
              bsonType: 'array',
              description: 'Unread message counts per user',
              items: {
                bsonType: 'object',
                properties: {
                  userId: { bsonType: 'string' },
                  count: { bsonType: 'int', minimum: 0 },
                },
              },
            },
            createdAt: {
              bsonType: 'date',
              description: 'Conversation creation timestamp',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'Last update timestamp',
            },
          },
        },
      },
    });

    const conversationsCollection = db.collection('conversations');
    await conversationsCollection.createIndex({ id: 1 }, { unique: true });
    await conversationsCollection.createIndex({ rideId: 1 });
    await conversationsCollection.createIndex({ participants: 1 });
    await conversationsCollection.createIndex({ updatedAt: -1 });
    await conversationsCollection.createIndex(
      { rideId: 1, participants: 1 },
      { unique: true, sparse: true }
    );

    console.log('✅ Conversations collection created with 5 indexes');

    console.log('🚀 Creating ride_matches collection...');

    // Create ride_matches collection
    await db.createCollection('ride_matches', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'id',
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
            id: {
              bsonType: 'string',
              description: 'Unique match ID (UUID)',
            },
            rideId: {
              bsonType: 'string',
              description: 'Ride being matched',
            },
            driverId: {
              bsonType: 'string',
              description: 'Driver being matched',
            },
            distance: {
              bsonType: 'double',
              description: 'Distance to pickup in kilometers',
            },
            eta: {
              bsonType: 'int',
              description: 'Estimated time of arrival in minutes',
            },
            acceptanceStatus: {
              bsonType: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
              description: 'Match acceptance status',
            },
            driverInfo: {
              bsonType: 'object',
              description: 'Driver information at time of match',
              required: ['name', 'rating', 'acceptanceRate', 'vehicleType'],
              properties: {
                name: { bsonType: 'string' },
                rating: { bsonType: 'double', minimum: 0, maximum: 5 },
                acceptanceRate: { bsonType: 'double', minimum: 0, maximum: 1 },
                vehicleType: { bsonType: 'string' },
                vehicleNumber: { bsonType: 'string' },
                photoUrl: { bsonType: 'string' },
              },
            },
            createdAt: {
              bsonType: 'date',
              description: 'Match creation timestamp',
            },
            expiresAt: {
              bsonType: 'date',
              description: 'Match expiry (typically 2 minutes)',
            },
            acceptedAt: {
              bsonType: 'date',
              description: 'When driver accepted the match',
            },
            rejectedAt: {
              bsonType: 'date',
              description: 'When driver rejected the match',
            },
          },
        },
      },
    });

    const matchesCollection = db.collection('ride_matches');
    await matchesCollection.createIndex({ id: 1 }, { unique: true });
    await matchesCollection.createIndex({ rideId: 1, createdAt: -1 });
    await matchesCollection.createIndex({ driverId: 1, acceptanceStatus: 1 });
    await matchesCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    console.log('✅ RideMatches collection created with 4 indexes');
  },

  async down(db) {
    console.log('🔄 Dropping collections...');
    await db.dropCollection('conversations');
    await db.dropCollection('ride_matches');
    console.log('✅ Collections dropped');
  },
};
