// libs/domains/user/application/src/index.ts

// 1. Exportar DTOs
// (Asegúrate de que estos archivos existan en estas rutas, si no, ajusta la ruta)
export * from './lib/dto/register-user.dto';
export * from './lib/dto/login-user.dto';

// 2. Exportar Casos de Uso (Use Cases)
export * from './lib/use-cases/register-user.use-case';
export * from './lib/use-cases/login-user.use-case';

// 3. Exportar cualquier otra cosa que necesites (Interfaces, etc.)
// export * from './lib/ports/...';