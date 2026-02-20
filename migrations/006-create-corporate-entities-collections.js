// MongoDB migration for Corporate Portal entities
// Creates collections for companies, corporate users, bookings, approvals, and tracking consents

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        // Create companies collection
        await db.createCollection('companies', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['companyId', 'name', 'email', 'country', 'createdAt'],
              properties: {
                companyId: {
                  bsonType: 'string',
                  description: 'Unique company identifier',
                },
                name: {
                  bsonType: 'string',
                  description: 'Company legal name',
                },
                email: {
                  bsonType: 'string',
                  description: 'Company contact email',
                },
                country: {
                  bsonType: 'string',
                  enum: ['EC', 'CO', 'PE', 'CL', 'AR', 'BR'],
                  description: 'Country code (Ecuador focus)',
                },
                taxId: {
                  bsonType: 'string',
                  description: 'Tax identification number (RUC for Ecuador)',
                },
                industry: {
                  bsonType: 'string',
                  description: 'Industry classification',
                },
                status: {
                  bsonType: 'string',
                  enum: ['active', 'inactive', 'suspended'],
                  description: 'Company status',
                },
                plan: {
                  bsonType: 'string',
                  enum: ['starter', 'professional', 'enterprise'],
                  description: 'Subscription plan',
                },
                settings: {
                  bsonType: 'object',
                  properties: {
                    requireMFAForAdmins: { bsonType: 'bool' },
                    requireApprovalForAllBookings: { bsonType: 'bool' },
                    enableRealTimeTracking: { bsonType: 'bool' },
                    currencyCode: { bsonType: 'string' },
                  },
                },
                createdAt: {
                  bsonType: 'date',
                  description: 'Creation timestamp',
                },
                updatedAt: {
                  bsonType: 'date',
                  description: 'Last update timestamp',
                },
              },
            },
          },
        });
        console.log('✅ Created companies collection');

        // Create corporate users collection
        await db.createCollection('corporate_users', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['userId', 'companyId', 'email', 'role', 'createdAt'],
              properties: {
                userId: {
                  bsonType: 'string',
                  description: 'User unique identifier',
                },
                companyId: {
                  bsonType: 'string',
                  description: 'Company the user belongs to',
                },
                email: {
                  bsonType: 'string',
                  description: 'User email',
                },
                fullName: {
                  bsonType: 'string',
                  description: 'Full name',
                },
                role: {
                  bsonType: 'string',
                  enum: ['super_admin', 'manager', 'employee'],
                  description: 'User role within company',
                },
                department: {
                  bsonType: 'string',
                  description: 'Department assignment',
                },
                status: {
                  bsonType: 'string',
                  enum: ['active', 'inactive', 'suspended'],
                  description: 'User status',
                },
                mfaEnabled: {
                  bsonType: 'bool',
                  description: 'Multi-factor authentication enabled',
                },
                mfaSecret: {
                  bsonType: 'string',
                  description: 'Encrypted MFA secret',
                },
                ssoProvider: {
                  bsonType: 'string',
                  enum: ['okta', 'azure_ad', 'google_workspace', 'none'],
                  description: 'SSO provider',
                },
                ssoId: {
                  bsonType: 'string',
                  description: 'SSO external identifier',
                },
                createdAt: {
                  bsonType: 'date',
                },
                updatedAt: {
                  bsonType: 'date',
                },
              },
            },
          },
        });
        console.log('✅ Created corporate_users collection');

        // Create corporate bookings collection
        await db.createCollection('corporate_bookings', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'bookingId',
                'companyId',
                'serviceId',
                'status',
                'createdAt',
              ],
              properties: {
                bookingId: {
                  bsonType: 'string',
                  description: 'Unique booking identifier',
                },
                companyId: {
                  bsonType: 'string',
                  description: 'Company making the booking',
                },
                originalBookingId: {
                  bsonType: 'string',
                  description: 'Reference to original B2C booking',
                },
                serviceId: {
                  bsonType: 'string',
                  description: 'Service being booked',
                },
                serviceType: {
                  bsonType: 'string',
                  enum: ['transport', 'accommodation', 'tour', 'experience'],
                },
                bookedById: {
                  bsonType: 'string',
                  description: 'Employee or Admin who made/requested booking',
                },
                assignedToId: {
                  bsonType: 'string',
                  description: 'Employee assigned to use the service',
                },
                paymentMethod: {
                  bsonType: 'string',
                  enum: ['corporate_credit', 'personal_card', 'invoice'],
                },
                totalPrice: {
                  bsonType: 'object',
                  properties: {
                    amount: { bsonType: 'double' },
                    currency: { bsonType: 'string' },
                  },
                },
                approvalStatus: {
                  bsonType: 'string',
                  enum: ['pending', 'approved', 'rejected', 'cancelled'],
                  description: 'Approval workflow status',
                },
                approvedBy: {
                  bsonType: 'string',
                  description: 'Manager who approved the booking',
                },
                approvedAt: {
                  bsonType: 'date',
                  description: 'When the booking was approved',
                },
                status: {
                  bsonType: 'string',
                  enum: [
                    'pending',
                    'confirmed',
                    'in_progress',
                    'completed',
                    'cancelled',
                  ],
                },
                createdAt: {
                  bsonType: 'date',
                },
                updatedAt: {
                  bsonType: 'date',
                },
              },
            },
          },
        });
        console.log('✅ Created corporate_bookings collection');

        // Create approval workflows collection
        await db.createCollection('approval_workflows', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'workflowId',
                'companyId',
                'bookingId',
                'status',
                'createdAt',
              ],
              properties: {
                workflowId: {
                  bsonType: 'string',
                  description: 'Workflow unique identifier',
                },
                companyId: {
                  bsonType: 'string',
                },
                bookingId: {
                  bsonType: 'string',
                },
                requesterUserId: {
                  bsonType: 'string',
                  description: 'Employee requesting the booking',
                },
                assignedToUserId: {
                  bsonType: 'string',
                  description: 'Employee who will use the service',
                },
                approvalChain: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'object',
                    properties: {
                      approverId: { bsonType: 'string' },
                      approverName: { bsonType: 'string' },
                      level: { bsonType: 'int32' },
                      status: {
                        bsonType: 'string',
                        enum: ['pending', 'approved', 'rejected'],
                      },
                      approvedAt: { bsonType: 'date' },
                      comments: { bsonType: 'string' },
                    },
                  },
                },
                status: {
                  bsonType: 'string',
                  enum: ['pending', 'approved', 'rejected', 'cancelled'],
                },
                createdAt: {
                  bsonType: 'date',
                },
                completedAt: {
                  bsonType: 'date',
                },
              },
            },
          },
        });
        console.log('✅ Created approval_workflows collection');

        // Create department spending limits collection
        await db.createCollection('department_spending_limits', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'limitId',
                'companyId',
                'department',
                'dailyLimit',
                'createdAt',
              ],
              properties: {
                limitId: {
                  bsonType: 'string',
                },
                companyId: {
                  bsonType: 'string',
                },
                department: {
                  bsonType: 'string',
                  description: 'Department name',
                },
                dailyLimit: {
                  bsonType: 'object',
                  properties: {
                    amount: { bsonType: 'double' },
                    currency: { bsonType: 'string' },
                  },
                },
                monthlyLimit: {
                  bsonType: 'object',
                  properties: {
                    amount: { bsonType: 'double' },
                    currency: { bsonType: 'string' },
                  },
                },
                perEmployeeDaily: {
                  bsonType: 'object',
                  properties: {
                    amount: { bsonType: 'double' },
                    currency: { bsonType: 'string' },
                  },
                },
                status: {
                  bsonType: 'string',
                  enum: ['active', 'inactive'],
                },
                createdAt: {
                  bsonType: 'date',
                },
                updatedAt: {
                  bsonType: 'date',
                },
              },
            },
          },
        });
        console.log('✅ Created department_spending_limits collection');

        // Create consolidated invoices collection
        await db.createCollection('consolidated_invoices', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'invoiceId',
                'companyId',
                'period',
                'totalAmount',
                'status',
                'createdAt',
              ],
              properties: {
                invoiceId: {
                  bsonType: 'string',
                  description: 'Unique invoice identifier',
                },
                companyId: {
                  bsonType: 'string',
                },
                invoiceNumber: {
                  bsonType: 'string',
                  description: 'Human-readable invoice number',
                },
                period: {
                  bsonType: 'object',
                  properties: {
                    startDate: { bsonType: 'date' },
                    endDate: { bsonType: 'date' },
                    month: {
                      bsonType: 'string',
                      description: 'YYYY-MM format',
                    },
                  },
                },
                bookingIds: {
                  bsonType: 'array',
                  items: { bsonType: 'string' },
                  description: 'List of bookings included in invoice',
                },
                totalAmount: {
                  bsonType: 'object',
                  properties: {
                    amount: { bsonType: 'double' },
                    currency: { bsonType: 'string' },
                  },
                },
                breakdown: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'object',
                    properties: {
                      serviceType: { bsonType: 'string' },
                      count: { bsonType: 'int32' },
                      subtotal: { bsonType: 'double' },
                    },
                  },
                },
                status: {
                  bsonType: 'string',
                  enum: ['draft', 'sent', 'paid', 'overdue'],
                },
                dueDate: {
                  bsonType: 'date',
                },
                paidAt: {
                  bsonType: 'date',
                },
                pdfUrl: {
                  bsonType: 'string',
                  description: 'URL to generated PDF invoice',
                },
                createdAt: {
                  bsonType: 'date',
                },
                updatedAt: {
                  bsonType: 'date',
                },
              },
            },
          },
        });
        console.log('✅ Created consolidated_invoices collection');

        // Create tracking consents collection
        await db.createCollection('tracking_consents', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'consentId',
                'companyId',
                'userId',
                'bookingId',
                'granted',
                'createdAt',
              ],
              properties: {
                consentId: {
                  bsonType: 'string',
                },
                companyId: {
                  bsonType: 'string',
                },
                userId: {
                  bsonType: 'string',
                  description: 'Employee who is being tracked',
                },
                bookingId: {
                  bsonType: 'string',
                  description: 'Trip being tracked',
                },
                granted: {
                  bsonType: 'bool',
                  description: 'Whether employee granted tracking permission',
                },
                grantedAt: {
                  bsonType: 'date',
                  description: 'When consent was given',
                },
                revokedAt: {
                  bsonType: 'date',
                  description: 'When consent was revoked (if applicable)',
                },
                ipAddress: {
                  bsonType: 'string',
                  description: 'IP address from mobile app when consent given',
                },
                deviceId: {
                  bsonType: 'string',
                  description: 'Device identifier',
                },
                createdAt: {
                  bsonType: 'date',
                },
              },
            },
          },
        });
        console.log('✅ Created tracking_consents collection');

        // Create indexes for better query performance
        const collections = [
          {
            name: 'companies',
            indexes: [
              { fields: { companyId: 1 }, options: { unique: true } },
              { fields: { status: 1 } },
            ],
          },
          {
            name: 'corporate_users',
            indexes: [
              { fields: { userId: 1 }, options: { unique: true } },
              { fields: { companyId: 1, role: 1 } },
              { fields: { email: 1 } },
              { fields: { ssoId: 1 } },
            ],
          },
          {
            name: 'corporate_bookings',
            indexes: [
              { fields: { bookingId: 1 }, options: { unique: true } },
              { fields: { companyId: 1, status: 1 } },
              { fields: { bookedById: 1, createdAt: -1 } },
              { fields: { assignedToId: 1 } },
            ],
          },
          {
            name: 'approval_workflows',
            indexes: [
              { fields: { workflowId: 1 }, options: { unique: true } },
              { fields: { companyId: 1, status: 1 } },
              { fields: { bookingId: 1 } },
            ],
          },
          {
            name: 'department_spending_limits',
            indexes: [
              {
                fields: { companyId: 1, department: 1 },
                options: { unique: true },
              },
            ],
          },
          {
            name: 'consolidated_invoices',
            indexes: [
              { fields: { invoiceId: 1 }, options: { unique: true } },
              {
                fields: { companyId: 1, 'period.month': 1 },
                options: { unique: true },
              },
              { fields: { status: 1 } },
            ],
          },
          {
            name: 'tracking_consents',
            indexes: [
              { fields: { consentId: 1 }, options: { unique: true } },
              {
                fields: { companyId: 1, userId: 1, bookingId: 1 },
                options: { unique: true },
              },
              { fields: { granted: 1, createdAt: -1 } },
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
        const collections = [
          'companies',
          'corporate_users',
          'corporate_bookings',
          'approval_workflows',
          'department_spending_limits',
          'consolidated_invoices',
          'tracking_consents',
        ];

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
