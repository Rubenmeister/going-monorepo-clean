import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { PaymentGatewayService } from '../infrastructure/payment/payment-gateway.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Throttle } from '@nestjs/throttler';

interface AuthUser { id: string; email: string; role: string; }

/**
 * PaymentController — Endpoints de pago para Going.
 *
 * Proveedores simultáneos:
 *   Datafast  → tarjeta de crédito/débito  (paymentMethod: 'card')
 *   DeUna     → QR Banco Pichincha         (paymentMethod: 'transfer')
 *
 * Flujo:
 *  GET  /payments/methods        — métodos disponibles para mostrar al pasajero
 *  POST /payments/initiate       — inicia el pago (incluye paymentMethod en body)
 *  POST /payments/webhook/datafast — DATAFAST notifica resultado (server-to-server)
 *  POST /payments/webhook/deuna  — DeUna notifica resultado
 *  GET  /payments/:id/status     — consulta estado de una transacción
 */
@Controller('payments')
export class PaymentController {
  private readonly appBaseUrl: string;

  constructor(
    private readonly gateway: PaymentGatewayService,
    private readonly config:  ConfigService,
  ) {
    this.appBaseUrl = config.get('APP_BASE_URL', 'http://localhost:3000');
  }

  // ─── 0. MÉTODOS DISPONIBLES ──────────────────────────────────────────────────

  @Get('methods')
  getAvailableMethods() {
    return { methods: this.gateway.availableMethods() };
  }

  // ─── 1. INICIAR PAGO ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async initiatePayment(
    @CurrentUser() user: AuthUser,
    @Body() body: {
      rideId:          string;
      amountUsd:       number;
      description?:    string;
      paymentMethod?:  'card' | 'transfer';   // tarjeta → Datafast | QR → DeUna
      cardDetails?: {
        number:      string;
        expiryMonth: string;
        expiryYear:  string;
        cvv:         string;
        holderName:  string;
      };
    },
  ) {
    if (!body.rideId)    throw new BadRequestException('rideId requerido');
    if (!body.amountUsd || body.amountUsd <= 0)
      throw new BadRequestException('amountUsd debe ser mayor a 0');

    const transactionId = uuidv4();

    const result = await this.gateway.initiatePayment({
      transactionId,
      rideId:        body.rideId,
      userId:        user.id,
      amountUsd:     body.amountUsd,
      description:   body.description ?? `Viaje Going #${body.rideId.slice(0, 8)}`,
      paymentMethod: body.paymentMethod,
      returnUrl:     `${this.appBaseUrl}/payment/result?status=approved&txn=${transactionId}`,
      cancelUrl:     `${this.appBaseUrl}/payment/result?status=cancelled&txn=${transactionId}`,
      cardDetails:   body.cardDetails,
    });

    return result;
  }

  // ─── 2a. WEBHOOK DATAFAST (sin JWT — Datafast llama directamente) ─────────────

  @Post('webhook/datafast')
  @HttpCode(HttpStatus.OK)
  async handleWebhookDatafast(
    @Headers() headers: Record<string, string>,
    @Body()    body:    Record<string, unknown>,
  ) {
    const result = await this.gateway.handleWebhook('datafast', headers, body);
    return { received: true, provider: 'datafast', status: result.status };
  }

  // ─── 2b. WEBHOOK DEUNA (sin JWT — DeUna llama directamente) ──────────────────

  @Post('webhook/deuna')
  @HttpCode(HttpStatus.OK)
  async handleWebhookDeuna(
    @Headers() headers: Record<string, string>,
    @Body()    body:    Record<string, unknown>,
  ) {
    const result = await this.gateway.handleWebhook('deuna', headers, body);
    return { received: true, provider: 'deuna', status: result.status };
  }

  // ─── 2c. WEBHOOK GENÉRICO (retrocompatibilidad) ───────────────────────────────

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhookLegacy(
    @Headers() headers: Record<string, string>,
    @Body()    body:    Record<string, unknown>,
  ) {
    // Detectar proveedor por cabecera
    const provider = headers['x-deuna-signature'] ? 'deuna' : 'datafast';
    const result   = await this.gateway.handleWebhook(provider, headers, body);
    return { received: true, provider, status: result.status };
  }

  // ─── 3. CONSULTAR ESTADO ──────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':transactionId/status')
  async getStatus(@Param('transactionId') transactionId: string) {
    if (!transactionId) throw new BadRequestException('transactionId requerido');
    const result = await this.gateway.getStatus(transactionId);
    if (result.status === 'error') throw new NotFoundException(result.error ?? 'Transacción no encontrada');
    return result;
  }

  // ─── 4. MOCK CHECKOUT (solo en modo mock) ─────────────────────────────────────
  // Simula la página de DATAFAST. Aprueba automáticamente y redirige al returnUrl.

  @Get('mock-checkout')
  async mockCheckout(
    @Query('transactionId') transactionId: string,
    @Query('amount')        amount:        string,
    @Query('returnUrl')     returnUrl:     string,
    @Query('cancelUrl')     cancelUrl:     string,
    @Query('action')        action:        string, // 'approve' | 'cancel'
    @Res() res: Response,
  ) {
    const mock = this.gateway.mockProvider;
    if (!mock) {
      return res.status(404).send('Mock checkout solo disponible con PAYMENT_PROVIDER=mock');
    }

    if (action === 'cancel') {
      mock.confirmMock(transactionId, false);
      return res.redirect(cancelUrl || `${this.appBaseUrl}/payment/result?status=cancelled`);
    }

    // Aprobación automática (o manual si action !== 'approve')
    mock.confirmMock(transactionId, true);

    const redirect = returnUrl || `${this.appBaseUrl}/payment/result?status=approved&txn=${transactionId}`;
    return res.redirect(redirect);
  }
}
