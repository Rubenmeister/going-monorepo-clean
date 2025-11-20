import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { CreateExperienceUseCase } from './create-experience.use-case';
import { IExperienceRepository } from '@going-monorepo-clean/domains-experience-core'; // Puerto
import { CreateExperienceDto } from '../dto/create-experience.dto';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { Experience } from '@going-monorepo-clean/domains-experience-core'; // Entidad

// --- Mocks de Puertos (Simulaciones) ---
const mockExperienceRepository = {
  save: jest.fn(),
};

describe('CreateExperienceUseCase', () => {
  let useCase: CreateExperienceUseCase;

  beforeEach(async () => {
    // 1. Resetear mocks antes de cada prueba
    mockExperienceRepository.save.mockReset();

    // 2. Configurar el módulo de prueba de NestJS (ligero)
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateExperienceUseCase,
        { provide: IExperienceRepository, useValue: mockExperienceRepository },
      ],
    }).compile();

    useCase = module.get<CreateExperienceUseCase>(CreateExperienceUseCase);
  });

  // DTO de entrada válido
  const dto: CreateExperienceDto = {
    hostId: UUID.generate(),
    title: 'Clase de Cocina Ancestral',
    description: 'Aprende a cocinar platos típicos de la sierra ecuatoriana.',
    location: { 
      address: 'Finca La Merced', 
      city: 'Otavalo', 
      country: 'EC', 
      latitude: 0.23, 
      longitude: -78.26 
    },
    price: { amount: 8000, currency: 'USD' }, // $80.00
    durationHours: 4,
  };

  it('debería crear y guardar la experiencia exitosamente', async () => {
    // 1. Simular guardado exitoso
    mockExperienceRepository.save.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result).toHaveProperty('id'); // Debe devolver un ID
    expect(mockExperienceRepository.save).toHaveBeenCalledTimes(1); // Debe llamar a save una vez
    
    // Verificar que la Entidad Experience se guarda con el estado inicial correcto
    const savedExperience: Experience = mockExperienceRepository.save.mock.calls[0][0];
    expect(savedExperience).toBeInstanceOf(Experience);
    expect(savedExperience.status).toBe('draft');
    expect(savedExperience.title).toBe(dto.title);
  });

  it('debería lanzar un error si el repositorio falla al guardar', async () => {
    // 1. Simular fallo al guardar
    mockExperienceRepository.save.mockResolvedValue(
      err(new Error('Error de base de datos simulado')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
    expect(mockExperienceRepository.save).toHaveBeenCalledTimes(1); // Se intentó guardar
  });

  it('debería lanzar un error si el VO Location es inválido (ej. latitud)', async () => {
    const invalidDto = { ...dto, location: { ...dto.location, latitude: 100 } }; // Latitud inválida
    
    // --- Ejecución (Act & Assert) ---
    // El caso de uso debería atrapar el error del VO Location.create() y lanzar una excepción
    await expect(useCase.execute(invalidDto)).rejects.toThrow(InternalServerErrorException);
    expect(mockExperienceRepository.save).not.toHaveBeenCalled(); // No debe intentar guardar
  });
});