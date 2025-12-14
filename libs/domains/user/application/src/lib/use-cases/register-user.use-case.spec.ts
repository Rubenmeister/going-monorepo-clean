import { Result, ok, err } from 'neverthrow';
import { RegisterUserUseCase } from './register-user.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import {
  User,
  Role,
  IUserRepository,
  IPasswordHasher,
  RoleType,
} from '@going-monorepo-clean/domains-user-core';

// --- 1. Crear Mocks para los Puertos ---

// Mock del Repositorio
const mockUserRepository: IUserRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findByVerificationToken: jest.fn(),
};

// Mock del Hasher
const mockPasswordHasher: IPasswordHasher = {
  hash: jest.fn(),
  compare: jest.fn(),
};

// --- 2. El Archivo de Prueba ---

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    // Resetea los mocks antes de cada prueba
    jest.clearAllMocks();

    // Create use case with mocks (no NestJS needed)
    useCase = new RegisterUserUseCase(mockUserRepository, mockPasswordHasher);
  });

  // El DTO de entrada para nuestras pruebas
  const dto: RegisterUserDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    roles: [RoleType.USER],
  };

  it('debería registrar un usuario exitosamente', async () => {
    // 1. Simula que el email NO existe
    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

    // 2. Simula que el hasher devuelve un hash
    (mockPasswordHasher.hash as jest.Mock).mockResolvedValue('hashed_password');

    // 3. Simula que guardar en la BD es exitoso
    (mockUserRepository.save as jest.Mock).mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result.isOk()).toBe(true);
    const user = result._unsafeUnwrap();
    expect(user).toHaveProperty('id');
    expect(user.firstName).toBe('Test');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('password123');
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('debería fallar si el email ya existe', async () => {
    // 1. Simula que el email SÍ existe
    const existingUser = User.create({
      email: 'test@example.com',
      passwordHash: 'some_hash',
      firstName: 'Existing',
      lastName: 'User',
      roles: [Role.create(RoleType.USER)._unsafeUnwrap()],
    })._unsafeUnwrap();
    
    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

    // --- Ejecución y Verificación (Act & Assert) ---
    const result = await useCase.execute(dto);
    
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('User already exists');

    // Verificamos que el proceso se detuvo
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('debería fallar si el repositorio falla al guardar', async () => {
    // 1. Simula que el email NO existe
    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    // 2. Simula que el hasher funciona
    (mockPasswordHasher.hash as jest.Mock).mockResolvedValue('hashed_password');
    // 3. Simula que guardar en la BD FALLA
    (mockUserRepository.save as jest.Mock).mockResolvedValue(err(new Error('Database error')));

    // --- Ejecución y Verificación (Act & Assert) ---
    const result = await useCase.execute(dto);
    
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('Database error');
  });
});