import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { CreateTourUseCase } from './create-tour.use-case';
import { ITourRepository, TourCategory } from '@going-monorepo-clean/domains-tour-core'; // Puerto
import { CreateTourDto } from '../dto/create-tour.dto';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- Mocks de Puertos ---
const mockTourRepository = {
  save: jest.fn(),
};

describe('CreateTourUseCase', () => {
  let useCase: CreateTourUseCase;

  beforeEach(async () => {
    mockTourRepository.save.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTourUseCase,
        { provide: ITourRepository, useValue: mockTourRepository },
      ],
    }).compile();

    useCase = module.get<CreateTourUseCase>(CreateTourUseCase);
  });

  const dto: CreateTourDto = {
    hostId: UUID.generate(),
    title: 'Tour a las Islas Galápagos',
    description: 'Explora la vida salvaje.',
    location: { address: 'Puerto Ayora', city: 'Santa Cruz', country: 'EC', latitude: -0.9, longitude: -89.5 },
    price: { amount: 50000, currency: 'USD' },
    durationHours: 12,
    maxGuests: 10,
    category: 'ADVENTURE' as TourCategory,
  };

  it('debería crear y guardar el tour exitosamente', async () => {
    // 1. Simular guardado exitoso
    mockTourRepository.save.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result).toHaveProperty('id');
    expect(mockTourRepository.save).toHaveBeenCalled();
    
    const savedTour = mockTourRepository.save.mock.calls[0][0];
    expect(savedTour.status).toBe('draft');
    expect(savedTour.category).toBe('ADVENTURE');
  });

  it('debería lanzar un error si el repositorio falla al guardar', async () => {
    // 1. Simular fallo al guardar
    mockTourRepository.save.mockResolvedValue(
      err(new Error('Error de base de datos')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });
});