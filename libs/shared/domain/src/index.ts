// Exporta los Value Objects
export * from './lib/uuid.vo';
export * from './lib/money.vo';
export * from './lib/location.vo';
export * from './lib/value-objects/permission.vo';
export * from './lib/value-objects/role.vo';

// Exporta los DTOs compartidos
export * from './lib/dtos/shared.dtos';

// Re-exporta 'neverthrow' para que todos los dominios
// lo importen desde este único lugar
export { Result, ok, err } from 'neverthrow';