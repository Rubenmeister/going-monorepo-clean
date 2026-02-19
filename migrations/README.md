# Database Migrations

This directory contains MongoDB migration scripts for the Going Platform Phase 5: Messaging & Chat System.

## Migration Files

| Version | File                              | Description                                       |
| ------- | --------------------------------- | ------------------------------------------------- |
| 001     | create-message-collection.js      | Creates messages collection with 30-day TTL       |
| 002     | create-ride-match-collection.js   | Creates ride_matches collection with 2-minute TTL |
| 003     | create-conversation-collection.js | Creates conversations collection                  |

## Running Migrations

### Using migrate-mongo

```bash
# Install migrate-mongo globally
npm install -g migrate-mongo

# Create config file (one-time setup)
migrate-mongo init

# Run all pending migrations
migrate-mongo up

# Rollback last migration
migrate-mongo down

# Check migration status
migrate-mongo status
```

### Configuration

Create `.migrate-mongorc.js` in project root:

```javascript
const config = {
  mongodb: {
    url:
      process.env.MONGODB_URI || 'mongodb://localhost:27017/going-platform-dev',
    databaseName: 'going-platform-dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'migrations',
  migrationFileExtension: '.js',
};

module.exports = config;
```

### Manual Migration (NestJS Script)

```bash
# Create a NestJS CLI command
npx nest g service migrations

# Run migrations
npm run migration:up

# Rollback migrations
npm run migration:down
```

## Collections Created

### messages

- **TTL:** 30 days (auto-cleanup)
- **Indexes:**
  - `messageId` (unique)
  - `rideId, createdAt` (compound)
  - `senderId, createdAt` (compound)
  - `receiverId, readAt` (compound)
  - `expiresAt` (TTL index)

### ride_matches

- **TTL:** 2 minutes (auto-cleanup)
- **Indexes:**
  - `matchId` (unique)
  - `rideId, createdAt` (compound)
  - `driverId, acceptanceStatus` (compound)
  - `expiresAt` (TTL index)

### conversations

- **Indexes:**
  - `conversationId` (unique)
  - `rideId`
  - `participants`
  - `updatedAt` (for sorting)

## Reverting Migrations

```bash
# Rollback all migrations
migrate-mongo down --all

# Rollback specific version
migrate-mongo down --migrations [001,002]
```

## Production Deployment

1. **Pre-deployment**

   ```bash
   migrate-mongo status
   ```

2. **During deployment**

   ```bash
   migrate-mongo up
   ```

3. **Verify**
   ```bash
   db.getCollectionNames()
   db.messages.getIndexes()
   ```

## Troubleshooting

### Migration Failed

```bash
# Check logs
migrate-mongo status

# Manual fix if needed
db.migrations.updateOne(
  { fileName: '001-create-message-collection.js' },
  { $set: { appliedAt: new Date() } }
)
```

### Indexes Not Created

```bash
# Recreate indexes manually
db.messages.createIndex({ messageId: 1 }, { unique: true })
db.messages.createIndex({ rideId: 1, createdAt: -1 })
```

## Notes

- All TTL indexes use `expireAfterSeconds: 0` for immediate cleanup
- Message collection auto-expires documents after 30 days
- RideMatch collection auto-expires documents after 2 minutes
- Indexes are critical for performance in chat operations
- Always test migrations in development first

## Related Files

- `libs/domains/notification/core/src/lib/entities/message.entity.ts`
- `libs/domains/transport/core/src/libs/entities/ride-match.entity.ts`
- `notifications-service/src/infrastructure/schemas/message.schema.ts`
- `transport-service/src/infrastructure/schemas/ride-match.schema.ts`
