export * from './lib/database.module';
export * from './lib/schemas/user.schema';
// --- BACKEND SPECIFIC UTILS ---
export * from './swagger/setup';
export * from './logger/logger.config';
export { DatabaseModule as MongoDatabaseModule } from './lib/database/mongo-config.service';
