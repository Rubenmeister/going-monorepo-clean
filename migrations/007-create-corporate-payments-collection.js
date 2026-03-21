// MongoDB migration for Corporate Payments
// Creates collection for corporate payment transactions

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        // Create corporate_payments collection
        await db.createCollection('corporate_payments', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'paymentId',
                'companyId',
                'bookingId',
                'amount',
                'currency',
                'paymentMethod',
                'status',
                'employeeId',
                'billedToCompany',
                'description',
                'createdAt',
                'updatedAt',
                'createdBy',
              ],
              properties: {
                paymentId: {
                  bsonType: 'string',
                  description: 'Unique payment identifier',
                },
                companyId: {
                  bsonType: 'string',
                  description: 'Company making the payment',
                },
                bookingId: {
                  bsonType: 'string',
                  description: 'Associated booking ID',
                },
                originalPaymentId: {
                  bsonType: 'string',
                  description: 'Reference to original B2C payment',
                },
                amount: {
                  bsonType: 'double',
                  description: 'Payment amount',
                },
                currency: {
                  bsonType: 'string',
                  description: 'Currency code (USD, EUR, etc)',
                },
                paymentMethod: {
                  bsonType: 'string',
                  enum: ['corporate_credit', 'corporate_account', 'invoice'],
                  description: 'Payment method',
                },
                status: {
                  bsonType: 'string',
                  enum: [
                    'pending',
                    'authorized',
                    'captured',
                    'failed',
                    'refunded',
                  ],
                  description: 'Payment status',
                },
                departmentId: {
                  bsonType: 'string',
                  description: 'Department ID for cost allocation',
                },
                employeeId: {
                  bsonType: 'string',
                  description: 'Employee using the service',
                },
                approverUserId: {
                  bsonType: 'string',
                  description: 'Manager who approved the payment',
                },
                approvalTimestamp: {
                  bsonType: 'date',
                  description: 'When payment was approved',
                },
                transactionId: {
                  bsonType: 'string',
                  description: 'Payment processor transaction ID',
                },
                authorizationCode: {
                  bsonType: 'string',
                  description: 'Payment authorization code',
                },
                billedToCompany: {
                  bsonType: 'bool',
                  description: 'Whether billed to company account',
                },
                invoiceId: {
                  bsonType: 'string',
                  description: 'Individual invoice ID',
                },
                consolidatedInvoiceId: {
                  bsonType: 'string',
                  description: 'Consolidated monthly invoice ID',
                },
                description: {
                  bsonType: 'string',
                  description: 'Payment description',
                },
                tags: {
                  bsonType: 'array',
                  items: { bsonType: 'string' },
                  description: 'Tags for categorization',
                },
                createdAt: {
                  bsonType: 'date',
                  description: 'Creation timestamp',
                },
                updatedAt: {
                  bsonType: 'date',
                  description: 'Last update timestamp',
                },
                processedAt: {
                  bsonType: 'date',
                  description: 'When payment was processed',
                },
                errorCode: {
                  bsonType: 'string',
                  description: 'Error code if payment failed',
                },
                errorMessage: {
                  bsonType: 'string',
                  description: 'Error message if payment failed',
                },
                createdBy: {
                  bsonType: 'string',
                  description: 'User ID who initiated payment',
                },
              },
            },
          },
        });
        console.log('✅ Created corporate_payments collection');

        // Create corporate_refunds collection
        await db.createCollection('corporate_refunds', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'refundId',
                'paymentId',
                'amount',
                'status',
                'createdAt',
              ],
              properties: {
                refundId: {
                  bsonType: 'string',
                },
                paymentId: {
                  bsonType: 'string',
                },
                amount: {
                  bsonType: 'double',
                },
                status: {
                  bsonType: 'string',
                  enum: ['pending', 'processed', 'failed'],
                },
                reason: {
                  bsonType: 'string',
                },
                transactionId: {
                  bsonType: 'string',
                },
                createdAt: {
                  bsonType: 'date',
                },
                processedAt: {
                  bsonType: 'date',
                },
                createdBy: {
                  bsonType: 'string',
                },
              },
            },
          },
        });
        console.log('✅ Created corporate_refunds collection');

        // Create indexes
        const collections = [
          {
            name: 'corporate_payments',
            indexes: [
              { fields: { paymentId: 1 }, options: { unique: true } },
              { fields: { companyId: 1, createdAt: -1 } },
              { fields: { employeeId: 1, status: 1 } },
              { fields: { companyId: 1, status: 1 } },
              { fields: { bookingId: 1 } },
              { fields: { consolidatedInvoiceId: 1 } },
              { fields: { approverUserId: 1, status: 1 } },
            ],
          },
          {
            name: 'corporate_refunds',
            indexes: [
              { fields: { refundId: 1 }, options: { unique: true } },
              { fields: { paymentId: 1 } },
              { fields: { status: 1, createdAt: -1 } },
            ],
          },
        ];

        for (const collection of collections) {
          for (const index of collection.indexes) {
            await db
              .collection(collection.name)
              .createIndex(index.fields, index.options || {});
          }
          console.log(`✅ Created indexes for ${collection.name}`);
        }
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const collections = ['corporate_payments', 'corporate_refunds'];

        for (const collection of collections) {
          await db.dropCollection(collection);
          console.log(`✅ Dropped ${collection} collection`);
        }
      });
    } finally {
      await session.endSession();
    }
  },
};
