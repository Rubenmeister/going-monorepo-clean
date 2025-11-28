// --- MÓDULOS DE INFRAESTRUCTURA ---
export * from './lib/database.module'; // <--- ¡Esta es la línea que te falta!

// --- SCHEMAS / ENTIDADES ---
export * from './lib/schemas/user.schema'; // (Si ya creaste el schema de usuario)

// --- UTILIDADES ---
export { Result, ok, err } from 'neverthrow';