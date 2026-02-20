// MongoDB migration: Audit Logs Collection
// Stores all security-relevant actions for LOPD Ecuador compliance.
// Who accessed what location, when, and why.

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        // audit_logs — immutable append-only log
        await db.createCollection('audit_logs', {
          capped: false, // keep all records; TTL index handles cleanup
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'logId',
                'action',
                'actorId',
                'companyId',
                'timestamp',
                'service',
              ],
              properties: {
                logId: {
                  bsonType: 'string',
                  description: 'Unique log entry ID',
                },
                action: {
                  bsonType: 'string',
                  description: 'Action performed',
                  enum: [
                    'portal_subscribed',
                    'portal_unsubscribed',
                    'trip_tracking_started',
                    'trip_tracking_ended',
                    'location_viewed',
                    'consent_granted',
                    'consent_revoked',
                    'booking_approved',
                    'booking_rejected',
                    'invoice_viewed',
                    'report_exported',
                    'sso_login',
                    'sso_login_failed',
                    'mfa_verified',
                    'mfa_failed',
                    'user_invited',
                    'user_suspended',
                    'spending_limit_changed',
                  ],
                },
                actorId: {
                  bsonType: 'string',
                  description: 'User ID performing the action',
                },
                actorEmail: {
                  bsonType: 'string',
                  description: 'Email for human-readable audit',
                },
                companyId: {
                  bsonType: 'string',
                  description: 'Company context',
                },
                targetUserId: {
                  bsonType: 'string',
                  description: 'User affected by the action',
                },
                bookingId: {
                  bsonType: 'string',
                  description: 'Related booking',
                },
                service: {
                  bsonType: 'string',
                  description: 'Microservice that generated the log',
                },
                ipAddress: {
                  bsonType: 'string',
                  description: 'IP address of actor',
                },
                userAgent: {
                  bsonType: 'string',
                  description: 'Browser/app user agent',
                },
                metadata: {
                  bsonType: 'object',
                  description: 'Additional structured context',
                },
                timestamp: {
                  bsonType: 'date',
                  description: 'When the action occurred',
                },
                // TTL field: logs auto-expire after retention period
                expiresAt: {
                  bsonType: 'date',
                  description: 'Auto-deletion date',
                },
              },
            },
          },
        });
        console.log('✅ Created audit_logs collection');

        // Indexes
        await db
          .collection('audit_logs')
          .createIndex({ logId: 1 }, { unique: true });
        await db
          .collection('audit_logs')
          .createIndex({ companyId: 1, timestamp: -1 });
        await db
          .collection('audit_logs')
          .createIndex({ actorId: 1, timestamp: -1 });
        await db
          .collection('audit_logs')
          .createIndex({ targetUserId: 1, action: 1 });
        await db
          .collection('audit_logs')
          .createIndex({ bookingId: 1, action: 1 });
        await db
          .collection('audit_logs')
          .createIndex({ action: 1, timestamp: -1 });
        // TTL: auto-delete logs after expiresAt date (set to 24–36 months by policy)
        await db
          .collection('audit_logs')
          .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        console.log('✅ Created audit_logs indexes (with TTL)');

        // sso_configs — company SSO provider settings
        await db.createCollection('sso_configs', {
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: [
                'configId',
                'companyId',
                'provider',
                'clientId',
                'createdAt',
              ],
              properties: {
                configId: { bsonType: 'string' },
                companyId: { bsonType: 'string' },
                provider: {
                  bsonType: 'string',
                  enum: ['okta', 'azure_ad', 'google_workspace'],
                },
                clientId: { bsonType: 'string' },
                // clientSecret stored encrypted
                clientSecretEncrypted: { bsonType: 'string' },
                discoveryUrl: { bsonType: 'string' },
                tenantId: { bsonType: 'string' },
                redirectUri: { bsonType: 'string' },
                enabled: { bsonType: 'bool' },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' },
              },
            },
          },
        });
        await db
          .collection('sso_configs')
          .createIndex({ configId: 1 }, { unique: true });
        await db
          .collection('sso_configs')
          .createIndex({ companyId: 1, provider: 1 }, { unique: true });
        console.log('✅ Created sso_configs collection');
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db) {
    await db.dropCollection('audit_logs');
    await db.dropCollection('sso_configs');
    console.log('✅ Dropped audit_logs and sso_configs');
  },
};
