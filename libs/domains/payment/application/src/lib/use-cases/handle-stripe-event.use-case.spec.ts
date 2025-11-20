import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { HandleStripeEventUseCase } from './handle-stripe-event.use-case';
import {
  ITransactionRepository,
  IPaymentGateway,
  Transaction,
} from '@going-monorepo-clean/domains-payment-core'; // Puertos y Entidad
import { UUID, Money } from '@going-monorepo-clean/shared-domain';

// --- Mocks de Puertos (Adaptadores) ---
const mockTransactionRepository = {
  save: jest.fn(),
  update: jest.fn(),
  findByPaymentIntentId: jest.fn(),
};

const mockPaymentGateway = {
  createPaymentIntent: jest.fn(),
  constructWebhookEvent: jest.fn(), // <--- El método clave a simular
};

// --- Datos Simulados ---
const TRANSACTION_ID = UUID.generate();
const PAYMENT_INTENT_ID = 'pi_test_12345';
const mockTransaction = Transaction.fromPrimitives({
  id: TRANSACTION_ID,
  userId: UUID.generate(),
  referenceId: UUID.generate(),
  paymentIntentId: PAYMENT_INTENT_ID,
  amount: Money.create(1000, 'USD')._unsafeUnwrap(),
  status: 'pending',
  createdAt: new Date(),
});

describe('HandleStripeEventUseCase', () => {
  let useCase: HandleStripeEventUseCase;

  beforeEach(async () => {
    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleStripeEventUseCase,
        { provide: ITransactionRepository, useValue: mockTransactionRepository },
        { provide: IPaymentGateway, useValue: mockPaymentGateway },
      ],
    }).compile();

    useCase = module.get<HandleStripeEventUseCase>(HandleStripeEventUseCase);
  });

  const mockPayload = Buffer.from('raw_payload');
  const mockSignature = 't=12345,v1=...';
  const mockStripeEvent = {
    type: 'payment_intent.succeeded',
    data: { object: { id: PAYMENT_INTENT_ID } },
  } as any;

  it('debería actualizar a "succeeded" cuando el evento es exitoso', async () => {
    // 1. Simular éxito en la verificación del webhook
    mockPaymentGateway.constructWebhookEvent.mockResolvedValue(ok(mockStripeEvent));
    
    // 2. Simular que encontramos la transacción pendiente
    mockTransactionRepository.findByPaymentIntentId.mockResolvedValue(ok(mockTransaction));

    // 3. Simular éxito en la actualización
    mockTransactionRepository.update.mockResolvedValue(ok(undefined));

    // --- Ejecución (Act) ---
    await useCase.execute(mockPayload, mockSignature);

    // --- Verificación (Assert) ---
    expect(mockPaymentGateway.constructWebhookEvent).toHaveBeenCalled();
    expect(mockTransactionRepository.findByPaymentIntentId).toHaveBeenCalledWith(PAYMENT_INTENT_ID);
    expect(mockTransactionRepository.update).toHaveBeenCalledTimes(1);

    // Verificar que el estado de la entidad fue modificado a 'succeeded'
    const updatedTransaction = mockTransactionRepository.update.mock.calls[0][0];
    expect(updatedTransaction.status).toBe('succeeded');
  });

  it('debería lanzar un error si la verificación del webhook falla', async () => {
    // 1. Simular fallo en la verificación del webhook
    mockPaymentGateway.constructWebhookEvent.mockResolvedValue(
      err(new Error('Stripe signature failed')),
    );

    // --- Ejecución (Act & Assert) ---
    await expect(useCase.execute(mockPayload, mockSignature)).rejects.toThrow(Error);
    
    // El proceso debe detenerse inmediatamente
    expect(mockTransactionRepository.findByPaymentIntentId).not.toHaveBeenCalled();
  });

  it('debería lanzar NotFoundException si la transacción no existe', async () => {
    // 1. Simular éxito en la verificación
    mockPaymentGateway.constructWebhookEvent.mockResolvedValue(ok(mockStripeEvent));
    
    // 2. Simular que no se encuentra la transacción
    mockTransactionRepository.findByPaymentIntentId.mockResolvedValue(ok(null));

    // --- Ejecución (Act & Assert) ---
    // Esperamos que el caso de uso lance un error
    await expect(useCase.execute(mockPayload, mockSignature)).rejects.toThrow(InternalServerErrorException); 
  });
});