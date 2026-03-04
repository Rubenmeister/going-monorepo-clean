// Decorators
export { CurrentUser } from './decorators/current-user.decorator';

// Filters
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// Middlewares
export { HttpsMiddleware } from './middlewares/https.middleware';
export { RequestSignatureMiddleware } from './middlewares/request-signature.middleware';

// Interceptors
export { AuditInterceptor } from './interceptors/audit.interceptor';
export { SentryInterceptor } from './interceptors/sentry.interceptor';

// Re-export existing services
export { CircuitBreakerService } from './services/circuit-breaker.service';
export { RedisPoolService } from './services/redis-pool.service';
export { TokenBucketService } from './services/token-bucket.service';
export { WebSocketJwtService } from './services/websocket-jwt.service';
export {
  WebSocketAuthPayload,
  WebSocketAuthResult,
} from './services/websocket-jwt.service';

// Audit log (shared persistence)
export {
  AuditLogDocument,
  AuditLogSchema,
} from '../../../../shared-infrastructure/src/lib/schemas/audit-log.schema';
export { MongoAuditLogRepository } from '../../../../shared-infrastructure/src/lib/persistence/mongo-audit-log.repository';
