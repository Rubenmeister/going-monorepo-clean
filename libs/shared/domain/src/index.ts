// Exporta los Value Objects
export * from './lib/uuid.vo';
export * from './lib/money.vo';
export * from './lib/location.vo';

// Exporta los DTOs compartidos
export * from './lib/dtos/shared.dtos';

// Exporta 'neverthrow' para que todos los dominios
// lo importen desde este único lugar
export { Result, ok, err } from 'neverthrow';

// Base Classes
export * from './lib/base.entity';
export * from './lib/aggregate-root';