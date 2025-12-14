import { User, RoleType } from './user.entity'; // Importamos RoleType
import { Role } from '../value-objects/role.vo';
// Asegúrate de que este nombre coincida con tu archivo real (a veces es password.hasher.ts o ipassword.hasher.ts)
import { IPasswordHasher } from '../ports/ipassword.hasher'; 

// 1. Mock del Hasher (Perfecto)
const mockPasswordHasher: IPasswordHasher = {
  hash: jest.fn(async (password: string) => `hashed_${password}`),
  compare: jest.fn(async (password: string, hash: string) => {
    return `hashed_${password}` === hash;
  }),
};

describe('User Entity', () => {
  // USO DE ENUM: Más seguro que usar string 'user'
  const roleUser = Role.create(RoleType.USER)._unsafeUnwrap();
  
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
    expect(user.status).toBe('pending_verification'); // O UserStatus.PENDING si usas enum
    expect(user.verificationToken).toBeDefined();
  });

  it('debería fallar si el nombre es muy corto', () => {
    const userResult = User.create({
      ...validProps,
      firstName: 'A', // Inválido
    });
    
    expect(userResult.isErr()).toBe(true);
    // Asegúrate de que tu entidad devuelva este mensaje exacto
    expect(userResult.error.message).toContain('short'); 
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
    expect(mockPasswordHasher.compare).toHaveBeenCalled(); // Verificamos que se llamó al spy
    
    const isNotMatch = await user.checkPassword('wrongpassword', mockPasswordHasher);
    expect(isNotMatch).toBe(false);
  });

  it('debería verificar los roles correctamente', () => {
    const adminRole = Role.create(RoleType.ADMIN)._unsafeUnwrap();
    const user = User.create({ ...validProps, roles: [roleUser, adminRole] })._unsafeUnwrap();

    expect(user.hasRole(RoleType.ADMIN)).toBe(true);
    expect(user.hasRole(RoleType.USER)).toBe(true);
    expect(user.hasRole(RoleType.HOST)).toBe(false);
  });

  it('debería serializar y deserializar (toPrimitives / fromPrimitives)', () => {
    const user = User.create(validProps)._unsafeUnwrap();
    const primitives = user.toPrimitives();
    
    // Verifica que los VOs se guardan como strings simples
    expect(primitives.roles).toContain(RoleType.USER);
    
    const rehydratedUser = User.fromPrimitives(primitives);
    
    expect(rehydratedUser).toBeInstanceOf(User);
    expect(rehydratedUser.id.value).toBe(user.id.value); // Compara valores primitivos
    // Verifica que roles[0] sea instancia de Role, no un string
    expect(rehydratedUser.roles[0]).toBeInstanceOf(Role); 
  });
});