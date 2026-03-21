/**
 * Migration: Create Conversation Collection
 * Version: 003
 * Description: Create conversations collection for chat management
 */

module.exports = {
  async up(db, client) {
    console.log('Creating conversations collection...');

    await db.createCollection('conversations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['conversationId', 'rideId', 'participants', 'createdAt'],
          properties: {
            conversationId: { bsonType: 'string' },
            rideId: { bsonType: 'string' },
            participants: { bsonType: 'array', items: { bsonType: 'string' } },
            lastMessage: { bsonType: 'object' },
            unreadCounts: { bsonType: 'array' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
          },
        },
      },
    });

    const collection = db.collection('conversations');
    await collection.createIndex({ conversationId: 1 }, { unique: true });
    await collection.createIndex({ rideId: 1 });
    await collection.createIndex({ participants: 1 });
    await collection.createIndex({ updatedAt: -1 });

    console.log('✅ Conversations collection created');
  },

  async down(db, client) {
    console.log('Dropping conversations collection...');
    await db.dropCollection('conversations');
    console.log('✅ Conversations collection dropped');
  },
};
