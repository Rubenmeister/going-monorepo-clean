/**
 * Shared Infrastructure Module Exports
 * Provides common infrastructure components for all microservices
 */

// Middleware
export * from './lib/middleware/https.middleware';
export * from './lib/middleware/request-signature.middleware';

// Signing & Security
export * from './lib/signing/request-signer.service';

// Authentication
export { CurrentUser } from './lib/decorators/current-user.decorator';

// Audit Logging (Phase 3)
export * from './lib/decorators/audit.decorator';
export * from './lib/interceptors/audit.interceptor';
export * from './lib/schemas/audit-log.schema';
export * from './lib/persistence/mongo-audit-log.repository';

// Geolocation Domain (Phase 4)
export * from './domains/geolocation';
