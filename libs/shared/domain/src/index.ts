// Exporta los Value Objects
export * from './lib/uuid.vo';
export * from './lib/money.vo';
export * from './lib/location.vo';

// Exporta los DTOs compartidos
export * from './lib/dtos/shared.dtos';

// Exporta el Event Bus (puerto)
export * from './lib/event-bus';

// Exporta Auth Guards y Decorators
export * from './lib/auth';

// Exporta Filters (HttpExceptionFilter)
export * from './lib/filters';

// Exporta Health (BaseHealthController)
export * from './lib/health';

// Exporta Logging (CorrelationIdInterceptor, pinoLoggerConfig)
export * from './lib/logging';

// Exporta InMemoryEventBus
export * from './lib/events';

// Exporta Saga types
export * from './lib/saga';

// Re-exporta 'neverthrow' para que todos los dominios
// lo importen desde este único lugar
export { Result, ok, err } from 'neverthrow';