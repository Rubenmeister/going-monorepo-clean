import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../../apps/payment-service/src/app.module'; // Módulo principal
import { CreatePaymentIntentDto } from '@going-monorepo-clean/domains-payment-application'; // DTO
import { IPaymentGateway } from '@going-monorepo-clean/domains-payment-core'; // Puerto

// Mock de Stripe para E2E: Evita llamar a la API externa
const mockStripeGateway = {
  createPaymentIntent: jest.fn().mockResolvedValue(
    ok({ clientSecret: 'cs_e2e_test', paymentIntentId: 'pi_e2e_001' }),
  ),
  constructWebhookEvent: jest.fn(),
};

describe('PAYMENT E2E (payment-service)', () => {
  let app: INestApplication;
  const ENDPOINT = '/payments/intent';

  const validPayment: CreatePaymentIntentDto = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    referenceId: '987e6543-e89b-12d3-a456-426614174000',
    amount: { amount: 1000, currency: 'USD' },
  };

  beforeAll(async () => {
    // 1. Configura la aplicación
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IPaymentGateway) // Reemplaza el Adaptador de Stripe
      .useValue(mockStripeGateway)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });


  it('POST /payments/intent - Debería crear un Payment Intent y registrar la TX (200 OK)', async () => {
    // Ejecuta la prueba
    const response = await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(validPayment)
      .expect(200);

    // Verifica la respuesta del Caso de Uso (el clientSecret del Mock)
    expect(response.body).toHaveProperty('clientSecret', 'cs_e2e_test');

    // Verifica que el Mock (Stripe) fue llamado
    expect(mockStripeGateway.createPaymentIntent).toHaveBeenCalled();

    // Verificación implícita: Si el test pasa, la capa de infraestructura (Mongoose)
    // también funcionó, ya que el Caso de Uso llamó al Repositorio.
  });

  it('POST /payments/intent - Debería fallar si el monto es negativo (400 Bad Request)', async () => {
    const invalidPayment = {
      ...validPayment,
      amount: { amount: -10, currency: 'USD' }, // Monto inválido
    };

    // Ejecuta la prueba
    const response = await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(invalidPayment)
      .expect(400);

    // Verifica el error de class-validator (ValidationPipe)
    expect(response.body.message).toContain('amount must not be less than 0');
    
    // Verifica que el Mock (Stripe) NO fue llamado
    expect(mockStripeGateway.createPaymentIntent).not.toHaveBeenCalled();
  });
});