/**
 * Migration: Create Message Collection with Indexes
 * Version: 001
 * Description: Create messages collection with proper indexes for performance
 */

module.exports = {
  async up(db, client) {
    console.log('Creating message collection with indexes...');

    // Create collection with schema validation
    await db.createCollection('messages', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'messageId',
            'rideId',
            'senderId',
            'receiverId',
            'content',
            'status',
            'createdAt',
          ],
          properties: {
            messageId: { bsonType: 'string' },
            rideId: { bsonType: 'string' },
            senderId: { bsonType: 'string' },
            receiverId: { bsonType: 'string' },
            content: { bsonType: 'string' },
            status: {
              enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
            },
            messageType: { enum: ['TEXT', 'IMAGE', 'MEDIA', 'SYSTEM'] },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            expiresAt: { bsonType: 'date' },
          },
        },
      },
    });

    const collection = db.collection('messages');
    await collection.createIndex({ messageId: 1 }, { unique: true });
    await collection.createIndex({ rideId: 1, createdAt: -1 });
    await collection.createIndex({ senderId: 1, createdAt: -1 });
    await collection.createIndex({ receiverId: 1, readAt: 1 });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ Message collection created');
  },

  async down(db, client) {
    console.log('Dropping message collection...');
    await db.dropCollection('messages');
    console.log('✅ Message collection dropped');
  },
};
