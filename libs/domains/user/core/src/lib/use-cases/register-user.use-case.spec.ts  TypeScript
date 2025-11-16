import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, ConflictException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { RegisterUserUseCase } from './register-user.use-case';
import { RegisterUserDto } from '../dto/register-user.dto';
import {
  User,
  Role,
  IUserRepository,
  IPasswordHasher,
} from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope

// --- 1. Crear Mocks para los Puertos ---

// Mock del Repositorio
const mockUserRepository = {
  // `jest.fn()` crea una función simulada
  findByEmail: jest.fn(),
  save: jest.fn(),
};

// Mock del Hasher
const mockPasswordHasher = {
  hash: jest.fn(),
  compare: jest.fn(),
};

// --- 2. El Archivo de Prueba ---

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  // 'beforeEach' se ejecuta antes de cada 'it' (cada prueba)
  beforeEach(async () => {
    // Resetea los mocks antes de cada prueba
    mockUserRepository.findByEmail.mockReset();
    mockUserRepository.save.mockReset();
    mockPasswordHasher.hash.mockReset();

    // Configura un módulo de prueba de NestJS (muy ligero)
    // Esto nos permite simular la Inyección de Dependencias
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: IUserRepository, // Cuando alguien pida 'IUserRepository'
          useValue: mockUserRepository, // entrégale nuestro mock
        },
        {
          provide: IPasswordHasher, // Cuando alguien pida 'IPasswordHasher'
          useValue: mockPasswordHasher, // entrégale nuestro mock
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
  });

  // El DTO de entrada para nuestras pruebas
  const dto: RegisterUserDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
  };

  it('debería registrar un usuario exitosamente', async () => {
    // --- Configuración (Arrange) ---
    // 1. Simula que el email NO existe
    mockUserRepository.findByEmail.mockResolvedValue(ok(null));

    // 2. Simula que el hasher devuelve un hash
    mockPasswordHasher.hash.mockResolvedValue('hashed_password');

    // 3. Simula que guardar en la BD es exitoso
    mockUserRepository.save.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result).toHaveProperty('id'); // Debe devolver un ID
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com'); // Verificamos que se llamó al repo
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('password123'); // Verificamos que se llamó al hasher
    expect(mockUserRepository.save).toHaveBeenCalled(); // Verificamos que se llamó a save
    expect(mockUserRepository.save.mock.calls[0][0]).toBeInstanceOf(User); // Verificamos que se guardó una Entidad User
    expect(mockUserRepository.save.mock.calls[0][0].firstName).toBe('Test'); // Verificamos los datos
  });

  it('debería fallar si el email ya existe', async () => {
    // --- Configuración (Arrange) ---
    // 1. Simula que el email SÍ existe
    const existingUser = User.create({
      email: 'test@example.com',
      passwordHash: 'some_hash',
      firstName: 'Existing',
      lastName: 'User',
      roles: [Role.create('user')._unsafeUnwrap()],
    })._unsafeUnwrap();
    
    mockUserRepository.findByEmail.mockResolvedValue(ok(existingUser));

    // --- Ejecución y Verificación (Act & Assert) ---
    // Esperamos que el caso de uso "lance" (throw) un error de Conflicto
    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);

    // Verificamos que el proceso se detuvo
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('debería fallar si el repositorio falla al guardar', async () => {
    // --- Configuración (Arrange) ---
    // 1. Simula que el email NO existe
    mockUserRepository.findByEmail.mockResolvedValue(ok(null));
    // 2. Simula que el hasher funciona
    mockPasswordHasher.hash.mockResolvedValue('hashed_password');
    // 3. Simula que guardar en la BD FALLA
    mockUserRepository.save.mockResolvedValue(err(new Error('Database error')));

    // --- Ejecución y Verificación (Act & Assert) ---
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });
});