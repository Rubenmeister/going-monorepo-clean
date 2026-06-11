import { Result, ok, err } from 'neverthrow';

export type RoleType = 'admin' | 'user' | 'driver' | 'host' | 'guide' | 'operator' | 'corporate';

export class Role {
  readonly value: RoleType;

  private constructor(value: RoleType) {
    this.value = value;
  }

  public static create(value: string): Result<Role, Error> {
    const role = value.toLowerCase() as RoleType;
    if (!['admin', 'user', 'driver', 'host', 'guide', 'operator', 'corporate'].includes(role)) {
      return err(new Error('Invalid role'));
    }
    return ok(new Role(role));
  }

  public isAdmin(): boolean {
    return this.value === 'admin';
  }
  
  public isDriver(): boolean {
    return this.value === 'driver';
  }
  
  public toPrimitives(): string {
    return this.value;
  }
  
  public static fromPrimitives(value: string): Role {
    return new Role(value as RoleType);
  }
}

/**
 * Roles que una persona puede AUTO-ASIGNARSE en el registro público
 * (POST /auth/register). Cualquier otro rol es "elevado" y SOLO se otorga
 * por flujos protegidos.
 */
export const SELF_SERVICE_ROLES: readonly RoleType[] = [
  'user',
  'driver',
  'host',
  'guide',
];

/**
 * Roles ELEVADOS: jamás se pueden obtener desde el registro público.
 *   - admin     → control total del sistema. Solo vía bootstrap-admin (token)
 *                 o un endpoint admin-only con guard.
 *   - operator  → operadora/operador turístico; se otorga al aprobar el
 *                 onboarding (POST /operators/onboarding), no en el alta.
 *   - corporate → cuenta empresarial (companyId + facturación con recargo).
 *                 Se provisiona desde corporate-service / panel admin.
 *
 * Histórico: el endpoint público aceptaba estos roles desde el body, lo que
 * permitía a cualquiera crear un admin sin autenticación. Ver
 * register-user.use-case.ts (sanitizeSelfServiceRoles).
 */
export const ELEVATED_ROLES: readonly RoleType[] = [
  'admin',
  'operator',
  'corporate',
];

/** Rol por defecto cuando no se solicita ninguno auto-asignable válido. */
export const DEFAULT_ROLE: RoleType = 'user';

/**
 * Filtra una lista de roles solicitados dejando SOLO los auto-asignables.
 *   - Normaliza a minúsculas y descarta vacíos/duplicados.
 *   - Descarta (sin lanzar error) cualquier rol elevado o desconocido: el
 *     registro continúa, pero como usuario normal.
 *   - Si no queda ninguno válido, devuelve [DEFAULT_ROLE].
 *
 * Devuelve también `rejected` (lo descartado) para poder auditarlo/loguearlo.
 */
export function sanitizeSelfServiceRoles(requested?: unknown): {
  roles: RoleType[];
  rejected: string[];
} {
  const list = Array.isArray(requested) ? requested : [];
  const normalized = list
    .map((r) => (typeof r === 'string' ? r.toLowerCase().trim() : ''))
    .filter((r) => r.length > 0);

  const allowed = new Set<RoleType>();
  const rejected: string[] = [];
  for (const r of normalized) {
    if ((SELF_SERVICE_ROLES as readonly string[]).includes(r)) {
      allowed.add(r as RoleType);
    } else {
      rejected.push(r);
    }
  }

  const roles = allowed.size > 0 ? Array.from(allowed) : [DEFAULT_ROLE];
  return { roles, rejected };
}