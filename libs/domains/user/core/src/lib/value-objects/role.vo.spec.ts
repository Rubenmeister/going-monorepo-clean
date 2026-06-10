import {
  Role,
  sanitizeSelfServiceRoles,
  SELF_SERVICE_ROLES,
  ELEVATED_ROLES,
} from './role.vo';

describe('Role Value Object', () => {

  it('debería crear un rol válido (user)', () => {
    const roleResult = Role.create('user');
    expect(roleResult.isOk()).toBe(true);
    expect(roleResult.value.value).toBe('user');
  });

  it('debería crear un rol válido en mayúsculas (ADMIN)', () => {
    const roleResult = Role.create('ADMIN');
    // El VO debe normalizarlo a minúsculas
    expect(roleResult.isOk()).toBe(true);
    expect(roleResult.value.value).toBe('admin');
  });

  it('debería fallar al crear un rol inválido (guest)', () => {
    const roleResult = Role.create('guest');
    expect(roleResult.isErr()).toBe(true);
    expect(roleResult.error.message).toBe('Invalid role');
  });

  it('debería convertir a primitivo correctamente', () => {
    const role = Role.create('driver')._unsafeUnwrap();
    expect(role.toPrimitives()).toBe('driver');
  });

  it('debería crear desde un primitivo correctamente', () => {
    const role = Role.fromPrimitives('host');
    expect(role.value).toBe('host');
  });

  it('debería verificar los roles correctamente', () => {
    const adminRole = Role.create('admin')._unsafeUnwrap();
    const driverRole = Role.create('driver')._unsafeUnwrap();
    
    expect(adminRole.isAdmin()).toBe(true);
    expect(adminRole.isDriver()).toBe(false);
    expect(driverRole.isDriver()).toBe(true);
  });
});

describe('sanitizeSelfServiceRoles — anti privilege-escalation', () => {
  it('descarta "admin" y cae a "user"', () => {
    const { roles, rejected } = sanitizeSelfServiceRoles(['admin']);
    expect(roles).toEqual(['user']);
    expect(rejected).toContain('admin');
  });

  it('es case-insensitive ("ADMIN" → user)', () => {
    expect(sanitizeSelfServiceRoles(['ADMIN']).roles).toEqual(['user']);
  });

  it('descarta los elevados pero conserva los válidos', () => {
    const { roles } = sanitizeSelfServiceRoles(['driver', 'admin', 'operator']);
    expect(roles).toEqual(['driver']);
  });

  it('default "user" si viene vacío, indefinido o no-array', () => {
    expect(sanitizeSelfServiceRoles(undefined).roles).toEqual(['user']);
    expect(sanitizeSelfServiceRoles([]).roles).toEqual(['user']);
    expect(sanitizeSelfServiceRoles('admin' as unknown).roles).toEqual(['user']);
  });

  it('conserva todos los roles auto-asignables y deduplica', () => {
    expect(sanitizeSelfServiceRoles([...SELF_SERVICE_ROLES, 'user']).roles.sort()).toEqual(
      [...SELF_SERVICE_ROLES].sort()
    );
  });

  it('ningún rol elevado es auto-asignable', () => {
    for (const r of ELEVATED_ROLES) {
      expect(sanitizeSelfServiceRoles([r]).roles).toEqual(['user']);
    }
  });

  it('descarta valores basura/desconocidos', () => {
    const { roles, rejected } = sanitizeSelfServiceRoles(['superuser', 'root', 123 as unknown]);
    expect(roles).toEqual(['user']);
    expect(rejected).toEqual(expect.arrayContaining(['superuser', 'root']));
  });
});