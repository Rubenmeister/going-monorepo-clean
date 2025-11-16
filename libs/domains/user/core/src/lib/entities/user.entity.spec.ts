import { User } from './user.entity';
import { Role } from '../value-objects/role.vo';
import { IPasswordHasher } from '../ports/ipassword-hasher';

// 1. Crear un "Mock" (simulación) del Hasher
// No queremos usar 'bcrypt' real en una prueba unitaria
const mockPasswordHasher: IPasswordHasher = {
  hash: jest.fn(async (password: string) => `hashed_${password}`),
  compare: jest.fn(async (password: string, hash: string) => {
    return `hashed_${password}` === hash;
  }),
};

describe('User Entity', () => {
  const roleUser = Role.create('user')._unsafeUnwrap();
  const validProps = {
    email: 'test@example.com',
    passwordHash: 'hashed_password123',
    firstName: 'Test',
    lastName: 'User',
    roles: [roleUser],
  };

  it('debería crear un usuario exitosamente', () => {
    const userResult = User.create(validProps);
    
    expect(userResult.isOk()).toBe(true);
    const user = userResult.value;
    
    expect(user.id).toBeDefined();
    expect(user.firstName).toBe('Test');
    expect(user.status).toBe('pending_verification');
    expect(user.verificationToken).toBeDefined();
  });

  it('debería fallar si el nombre es muy corto', () => {
    const userResult = User.create({
      ...validProps,
      firstName: 'A', // Inválido
    });
    
    expect(userResult.isErr()).toBe(true);
    expect(userResult.error.message).toBe('First name is too short');
  });

  it('debería verificar una cuenta pendiente', () => {
    const user = User.create(validProps)._unsafeUnwrap();
    
    expect(user.status).toBe('pending_verification');
    
    const verifyResult = user.verifyAccount();
    
    expect(verifyResult.isOk()).toBe(true);
    expect(user.status).toBe('active');
    expect(user.verificationToken).toBeUndefined();
  });

  it('debería fallar al verificar una cuenta ya activa', () => {
    const user = User.create(validProps)._unsafeUnwrap();
    user.verifyAccount(); // Se activa la primera vez
    
    const secondVerifyResult = user.verifyAccount(); // Se intenta de nuevo
    
    expect(secondVerifyResult.isErr()).toBe(true);
    expect(secondVerifyResult.error.message).toBe('Account is already active');
  });

  it('debería verificar la contraseña correctamente usando el hasher', async () => {
    const user = User.create(validProps)._unsafeUnwrap();
    
    const isMatch = await user.checkPassword('password123', mockPasswordHasher);
    expect(isMatch).toBe(true);
    
    const isNotMatch = await user.checkPassword('wrongpassword', mockPasswordHasher);
    expect(isNotMatch).toBe(false);
  });

  it('debería verificar los roles correctamente', () => {
    const adminRole = Role.create('admin')._unsafeUnwrap();
    const user = User.create({ ...validProps, roles: [roleUser, adminRole] })._unsafeUnwrap();

    expect(user.hasRole('admin')).toBe(true);
    expect(user.hasRole('user')).toBe(true);
    expect(user.hasRole('driver')).toBe(false);
  });

  it('debería serializar y deserializar (toPrimitives / fromPrimitives) correctamente', () => {
    const user = User.create(validProps)._unsafeUnwrap();
    const primitives = user.toPrimitives();
    
    // Verifica que los VOs se guardan como strings
    expect(primitives.roles).toEqual(['user']);
    
    const rehydratedUser = User.fromPrimitives(primitives);
    
    expect(rehydratedUser).toBeInstanceOf(User);
    expect(rehydratedUser.id).toBe(user.id);
    expect(rehydratedUser.roles[0]).toBeInstanceOf(Role); // Verifica que el VO se reconstruyó
  });
});