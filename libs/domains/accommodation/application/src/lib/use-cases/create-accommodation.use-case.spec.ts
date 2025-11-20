import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { CreateAccommodationUseCase } from './create-accommodation.use-case';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core'; // Puerto
import { CreateAccommodationDto } from '../dto/create-accommodation.dto';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- Mocks de Puertos ---
const mockAccommodationRepository = {
  save: jest.fn(),
};

describe('CreateAccommodationUseCase', () => {
  let useCase: CreateAccommodationUseCase;

  beforeEach(async () => {
    mockAccommodationRepository.save.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccommodationUseCase,
        { provide: IAccommodationRepository, useValue: mockAccommodationRepository },
      ],
    }).compile();

    useCase = module.get<CreateAccommodationUseCase>(CreateAccommodationUseCase);
  });

  const dto: CreateAccommodationDto = {
    hostId: UUID.generate(),
    title: 'Cabaña de Playa',
    description: 'Hermosa cabaña frente al mar',
    location: { address: 'Calle 1', city: 'Manta', country: 'EC', latitude: -1.0, longitude: -80.7 },
    pricePerNight: { amount: 10000, currency: 'USD' },
    capacity: 4,
    amenities: ['Piscina', 'WiFi'],
  };

  it('debería crear y guardar el alojamiento exitosamente', async () => {
    // 1. Simular guardado exitoso
    mockAccommodationRepository.save.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result).toHaveProperty('id');
    expect(mockAccommodationRepository.save).toHaveBeenCalled();
    
    const savedAccommodation = mockAccommodationRepository.save.mock.calls[0][0];
    expect(savedAccommodation.status).toBe('draft');
    expect(savedAccommodation.title).toBe('Cabaña de Playa');
  });

  it('debería lanzar un error si el repositorio falla al guardar', async () => {
    // 1. Simular fallo al guardar
    mockAccommodationRepository.save.mockResolvedValue(
      err(new Error('Error de base de datos')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });
});