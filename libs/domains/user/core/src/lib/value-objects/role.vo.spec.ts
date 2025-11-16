import { Role } from './role.vo';

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