import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { CreateParcelUseCase } from './create-parcel.use-case';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core'; // Puerto
import { CreateParcelDto } from '../dto/create-parcel.dto';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- Mocks de Puertos ---
const mockParcelRepository = {
  save: jest.fn(),
};

describe('CreateParcelUseCase', () => {
  let useCase: CreateParcelUseCase;

  beforeEach(async () => {
    mockParcelRepository.save.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateParcelUseCase,
        { provide: IParcelRepository, useValue: mockParcelRepository },
      ],
    }).compile();

    useCase = module.get<CreateParcelUseCase>(CreateParcelUseCase);
  });

  const dto: CreateParcelDto = {
    userId: UUID.generate(),
    origin: { address: 'Origen', city: 'Quito', country: 'EC', latitude: -0.2, longitude: -78.5 },
    destination: { address: 'Destino', city: 'Guayaquil', country: 'EC', latitude: -2.2, longitude: -79.9 },
    description: 'Paquete de documentos urgentes',
    price: { amount: 1500, currency: 'USD' },
  };

  it('debería crear y guardar el envío exitosamente', async () => {
    // 1. Simular guardado exitoso
    mockParcelRepository.save.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result).toHaveProperty('id');
    expect(mockParcelRepository.save).toHaveBeenCalled();
    
    const savedParcel = mockParcelRepository.save.mock.calls[0][0];
    expect(savedParcel.status).toBe('pending');
  });

  it('debería lanzar un error si el repositorio falla al guardar', async () => {
    // 1. Simular fallo al guardar
    mockParcelRepository.save.mockResolvedValue(
      err(new Error('Error de base de datos')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });
});