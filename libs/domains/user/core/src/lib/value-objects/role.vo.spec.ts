import { Role } from './role.vo';
import { RoleType } from '../entities/user.entity';

describe('Role Value Object', () => {

  it('debería crear un rol válido (USER)', () => {
    const roleResult = Role.create(RoleType.USER);
    expect(roleResult.isOk()).toBe(true);
    expect(roleResult._unsafeUnwrap().value).toBe(RoleType.USER);
  });

  it('debería crear un rol válido desde string en mayúsculas (ADMIN)', () => {
    const roleResult = Role.create('ADMIN');
    expect(roleResult.isOk()).toBe(true);
    expect(roleResult._unsafeUnwrap().value).toBe(RoleType.ADMIN);
  });

  it('debería fallar al crear un rol inválido (lowercase)', () => {
    const roleResult = Role.create('user'); // lowercase no válido
    expect(roleResult.isErr()).toBe(true);
    expect(roleResult._unsafeUnwrapErr().message).toBe('Invalid role: user');
  });

  it('debería fallar al crear un rol que no existe (GUEST)', () => {
    const roleResult = Role.create('GUEST');
    expect(roleResult.isErr()).toBe(true);
    expect(roleResult._unsafeUnwrapErr().message).toBe('Invalid role: GUEST');
  });

  it('debería convertir a primitivo correctamente', () => {
    const role = Role.create(RoleType.DRIVER)._unsafeUnwrap();
    expect(role.toPrimitives()).toBe('DRIVER');
  });

  it('debería crear desde un primitivo correctamente', () => {
    const role = Role.fromPrimitives('HOST');
    expect(role.value).toBe('HOST');
  });
});