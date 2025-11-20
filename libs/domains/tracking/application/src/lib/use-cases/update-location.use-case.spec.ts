import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { UpdateLocationUseCase } from './update-location.use-case';
import {
  ITrackingRepository,
  ITrackingGateway,
  DriverLocation,
} from '@going-monorepo-clean/domains-tracking-core'; // Puertos y Entidad
import { Location } from '@going-monorepo-clean/shared-domain';
import { LocationUpdateDto } from '../dto/location-update.dto';

// --- Mocks de Puertos (Adaptadores) ---
const mockTrackingRepository = {
  save: jest.fn(),
  findByDriverId: jest.fn(),
  findAllActive: jest.fn(),
};

const mockTrackingGateway = {
  broadcastLocationUpdate: jest.fn(),
  broadcastToRoom: jest.fn(),
};

describe('UpdateLocationUseCase', () => {
  let useCase: UpdateLocationUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLocationUseCase,
        { provide: ITrackingRepository, useValue: mockTrackingRepository },
        { provide: ITrackingGateway, useValue: mockTrackingGateway },
      ],
    }).compile();

    useCase = module.get<UpdateLocationUseCase>(UpdateLocationUseCase);
  });

  const dto: LocationUpdateDto = {
    driverId: UUID.generate(),
    latitude: 0.1234,
    longitude: -78.5678,
  };

  it('debería guardar y difundir la ubicación exitosamente', async () => {
    // 1. Simular que guardar en Redis es exitoso
    mockTrackingRepository.save.mockResolvedValue(ok(undefined));

    // 2. Simular que difundir por WebSocket es exitoso
    mockTrackingGateway.broadcastLocationUpdate.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(mockTrackingRepository.save).toHaveBeenCalledTimes(1);
    expect(mockTrackingGateway.broadcastLocationUpdate).toHaveBeenCalledTimes(1);

    // Verificar que se guardó una entidad DriverLocation correcta
    const savedLocation: DriverLocation = mockTrackingRepository.save.mock.calls[0][0];
    expect(savedLocation).toBeInstanceOf(DriverLocation);
    expect(savedLocation.location.latitude).toBe(dto.latitude);
  });

  it('debería lanzar BadRequestException si la latitud es inválida', async () => {
    const invalidDto = { ...dto, latitude: 100 } as LocationUpdateDto; // Latitud fuera de rango

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(invalidDto)).rejects.toThrow(BadRequestException);
    
    // Verificamos que NUNCA se intentó guardar o difundir
    expect(mockTrackingRepository.save).not.toHaveBeenCalled();
    expect(mockTrackingGateway.broadcastLocationUpdate).not.toHaveBeenCalled();
  });

  it('debería lanzar un error si el repositorio (Redis) falla al guardar', async () => {
    // 1. Simular fallo al guardar
    mockTrackingRepository.save.mockResolvedValue(
      err(new Error('Redis connection failed')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
    
    // La difusión NUNCA debe ocurrir si el guardado falla
    expect(mockTrackingGateway.broadcastLocationUpdate).not.toHaveBeenCalled();
  });

  it('debería guardar la ubicación incluso si la difusión falla', async () => {
    // 1. Simular éxito en el guardado
    mockTrackingRepository.save.mockResolvedValue(ok(undefined));

    // 2. Simular fallo en la difusión
    mockTrackingGateway.broadcastLocationUpdate.mockResolvedValue(
      err(new Error('Socket.io error')),
    );

    // --- Ejecución (Act) ---
    await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(mockTrackingRepository.save).toHaveBeenCalledTimes(1); // El guardado fue exitoso
    expect(mockTrackingGateway.broadcastLocationUpdate).toHaveBeenCalledTimes(1); // Se intentó difundir
  });
});