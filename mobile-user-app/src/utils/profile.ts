/**
 * Utilidades de perfil — soporte para el REGISTRO RÁPIDO.
 *
 * Requisito de producto: el comprador entra solo con credenciales (correo +
 * contraseña) y el resto de datos (nombre, apellido, teléfono) se completan
 * conforme usa la app. Para no tocar el backend de auth (que exige nombres no
 * vacíos), el alta mínima manda un nombre derivado del correo y un apellido
 * centinela; el perfil se considera "incompleto" hasta que la persona complete
 * nombre real + teléfono, y se le pide antes de su primera reserva.
 */
import type { StoredUser } from '@services/authService';

/** Apellido centinela que marca un perfil creado por alta mínima (sin apellido real). */
export const PLACEHOLDER_LASTNAME = '·';

/** Deriva un nombre presentable a partir del correo (parte local). */
export function deriveNameFromEmail(email: string): string {
  const local = (email.split('@')[0] || 'Viajero').replace(/[._-]+/g, ' ').trim();
  const first = local.split(' ')[0] || 'Viajero';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * ¿El perfil tiene los datos mínimos para operar un viaje? Necesitamos nombre y
 * apellido reales (no el centinela) + teléfono para que la conductora o
 * conductor pueda coordinar. Los usuarios antiguos (con nombre+teléfono) ya
 * cuentan como completos, así que NO se les molesta.
 */
export function isProfileComplete(u?: StoredUser | null): boolean {
  if (!u) return false;
  if (u.profileComplete === true) return true;
  const ln = u.lastName?.trim() ?? '';
  const hasName = !!(u.firstName?.trim() && ln && ln !== PLACEHOLDER_LASTNAME);
  const hasPhone = !!u.phone?.trim();
  return hasName && hasPhone;
}
