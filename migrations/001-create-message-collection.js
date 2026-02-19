/**
 * Migration: Create Message Collection with Indexes
 * Phase 5: Messaging & Chat System
 *
 * Creates messages collection for storing chat messages with:
 * - Read receipts tracking
 * - Delivery status
 * - Automatic expiry (30 days)
 */

module.exports = {
  async up(db) {
    console.log('🚀 Creating messages collection with indexes...');

    // Create collection with validation
    await db.createCollection('messages', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'id',
            'rideId',
            'senderId',
            'receiverId',
            'content',
            'status',
            'messageType',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: {
              bsonType: 'string',
              description: 'Unique message identifier (UUID)',
            },
            rideId: {
              bsonType: 'string',
              description: 'Ride this message belongs to',
            },
            senderId: {
              bsonType: 'string',
              description: 'User who sent the message',
            },
            receiverId: {
              bsonType: 'string',
              description: 'User who receives the message',
            },
            content: {
              bsonType: 'string',
              description: 'Message content (max 2000 chars)',
            },
            attachments: {
              bsonType: 'array',
              description: 'File/image attachments',
              items: {
                bsonType: 'object',
                properties: {
                  type: { bsonType: 'string', enum: ['image', 'file'] },
                  url: { bsonType: 'string' },
                  size: { bsonType: 'long' },
                  uploadedAt: { bsonType: 'date' },
                },
              },
            },
            readReceipts: {
              bsonType: 'array',
              description: 'Read receipts from recipients',
              items: {
                bsonType: 'object',
                properties: {
                  userId: { bsonType: 'string' },
                  readAt: { bsonType: 'date' },
                },
              },
            },
            status: {
              bsonType: 'string',
              enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
              description: 'Message delivery status',
            },
            messageType: {
              bsonType: 'string',
              enum: ['TEXT', 'IMAGE', 'MEDIA', 'SYSTEM'],
              description: 'Type of message',
            },
            relatedTo: {
              bsonType: 'string',
              description: 'ID of related message (for threading)',
            },
            createdAt: {
              bsonType: 'date',
              description: 'Message creation timestamp',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'Last update timestamp',
            },
            expiresAt: {
              bsonType: 'date',
              description: 'Auto-delete timestamp (30 days from creation)',
            },
          },
        },
      },
    });

    // Create indexes
    const collection = db.collection('messages');

    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ rideId: 1, createdAt: -1 });
    await collection.createIndex({ senderId: 1, createdAt: -1 });
    await collection.createIndex({ receiverId: 1, 'readReceipts.userId': 1 });
    await collection.createIndex({ status: 1 });

    // TTL index for automatic deletion
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ Messages collection created with 6 indexes');
  },

  async down(db) {
    console.log('🔄 Dropping messages collection...');
    await db.dropCollection('messages');
    console.log('✅ Messages collection dropped');
  },
};
