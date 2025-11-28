// 1. Entidades y Value Objects
export * from './lib/entities/user.entity';
// IMPORTANTE: Exporta el Value Object Role si lo usas en la capa de aplicación
export * from './lib/value-objects/role.vo'; 

// 2. DTOs
export * from './lib/dto/register-user.dto';

// 3. Puertos (Interfaces)
export * from './lib/ports/iuser.repository';
export * from './lib/ports/ipassword.hasher';
export * from './lib/ports/itoken.service';