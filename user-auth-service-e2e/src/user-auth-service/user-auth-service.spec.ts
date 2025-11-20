import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../../apps/user-auth-service/src/app.module'; // Importa el módulo principal
import { RegisterUserDto } from '@going-monorepo-clean/domains-user-application'; // DTO

describe('AUTH E2E (user-auth-service)', () => {
  let app: INestApplication;
  const ENDPOINT = '/auth/register';

  // Usuario de prueba válido
  const validUser: RegisterUserDto = {
    email: 'test_user_e2e@going.com',
    password: 'passwordSegura123',
    firstName: 'Test',
    lastName: 'E2E',
    roles: ['user'],
  };

  // Esta función se ejecuta para configurar la aplicación
  beforeAll(async () => {
    // 1. Configura el módulo de prueba (inicia toda la app)
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      // Aquí puedes usar .overrideProvider para simular servicios externos (ej. email)
    }).compile();

    // 2. Crea la instancia de la aplicación NestJS
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Limpia el estado después de todas las pruebas
  afterAll(async () => {
    // Nota: Aquí DEBERÍAS eliminar los registros creados en la DB de prueba
    await app.close();
  });


  // ====================================================================
  // ESCENARIOS
  // ====================================================================

  it('POST /auth/register - Debería permitir el registro de un nuevo usuario (201 Created)', async () => {
    // Ejecuta la prueba
    const response = await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(validUser)
      .expect(201); // 201 Created

    // Verifica la respuesta del Caso de Uso
    expect(response.body).toHaveProperty('id');
    expect(typeof response.body.id).toBe('string');
  });

  it('POST /auth/register - Debería fallar si se intenta registrar el mismo email (409 Conflict)', async () => {
    // El usuario ya existe por la prueba anterior (es un estado acumulativo)
    const response = await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(validUser)
      .expect(409); // 409 Conflict

    // Verifica el mensaje de error del Caso de Uso (mapeado a NestJS)
    expect(response.body.message).toBe('Email already in use');
  });

  it('POST /auth/register - Debería fallar si la contraseña es muy corta (400 Bad Request - ValidationPipe)', async () => {
    const invalidUser = {
      ...validUser,
      email: 'new_invalid@test.com',
      password: 'short', // Menos de 8 caracteres
    };

    const response = await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(invalidUser)
      .expect(400); // 400 Bad Request (Error de validación del DTO)

    // Verifica el error de class-validator
    expect(response.body.message).toContain('Password must be at least 8 characters');
  });
});