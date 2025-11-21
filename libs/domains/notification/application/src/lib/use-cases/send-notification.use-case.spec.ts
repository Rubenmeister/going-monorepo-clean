import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { SendNotificationUseCase } from './send-notification.use-case';
import {
  INotificationRepository,
  INotificationGateway,
  Notification,
} from '@going-monorepo-clean/domains-notification-core'; // Puertos y Entidad
import { CreateNotificationDto } from '../dto/create-notification.dto';

// --- Mocks de Puertos (Adaptadores) ---
const mockNotificationRepository = {
  save: jest.fn(),
  update: jest.fn(),
  findByUserId: jest.fn(),
};

const mockNotificationGateway = {
  send: jest.fn(),
};

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;

  beforeEach(async () => {
    // Resetear mocks antes de cada prueba
    mockNotificationRepository.save.mockReset();
    mockNotificationRepository.update.mockReset();
    mockNotificationGateway.send.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendNotificationUseCase,
        { provide: INotificationRepository, useValue: mockNotificationRepository },
        { provide: INotificationGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    useCase = module.get<SendNotificationUseCase>(SendNotificationUseCase);
  });

  const dto: CreateNotificationDto = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    channel: 'PUSH',
    title: 'Viaje Aceptado',
    body: 'Tu conductor viene en camino.',
  };

  it('debería guardar la notificación y marcarla como SENT si el envío es exitoso', async () => {
    // 1. Simular guardado inicial (PENDING) exitoso
    mockNotificationRepository.save.mockResolvedValue(ok(undefined));

    // 2. Simular envío por el Gateway exitoso
    mockNotificationGateway.send.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    const result = await useCase.execute(dto);

    // --- Verificación (Assert) ---
    expect(result.isOk()).toBe(true);
    expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1); // Debe guardarse una vez inicialmente
    expect(mockNotificationGateway.send).toHaveBeenCalledTimes(1); // Debe intentar enviar
    expect(mockNotificationRepository.update).toHaveBeenCalledTimes(1); // Debe actualizarse a 'SENT'

    // Verificar que el estado actualizado es 'SENT'
    const updatedNotification: Notification = mockNotificationRepository.update.mock.calls[0][0];
    expect(updatedNotification.status).toBe('SENT');
  });

  it('debería guardar la notificación y marcarla como FAILED si el Gateway falla', async () => {
    // 1. Simular guardado inicial (PENDING) exitoso
    mockNotificationRepository.save.mockResolvedValue(ok(undefined));

    // 2. Simular fallo en el envío
    mockNotificationGateway.send.mockResolvedValue(
      err(new Error('Fallo de conexión con Firebase')),
    );
    
    // 3. Simular que la actualización del estado (a FAILED) funciona
    mockNotificationRepository.update.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act & Assert) ---
    const result = await useCase.execute(dto);

    expect(result.isErr()).toBe(true);
    expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1); // Debe guardarse una vez
    expect(mockNotificationGateway.send).toHaveBeenCalledTimes(1); // Debe intentar enviar
    expect(mockNotificationRepository.update).toHaveBeenCalledTimes(1); // Debe actualizarse a 'FAILED'

    // Verificar que el estado actualizado es 'FAILED'
    const failedNotification: Notification = mockNotificationRepository.update.mock.calls[0][0];
    expect(failedNotification.status).toBe('FAILED');
  });

  it('debería lanzar un error si el repositorio falla al guardar inicialmente', async () => {
    // 1. Simular fallo al guardar
    mockNotificationRepository.save.mockResolvedValue(
      err(new Error('Fallo de base de datos')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(dto)).resolves.toHaveProperty('isErr', true); // Se resuelve, pero es un Error Result
    
    // Verificamos que el Gateway NUNCA fue llamado
    expect(mockNotificationGateway.send).not.toHaveBeenCalled();
  });
});