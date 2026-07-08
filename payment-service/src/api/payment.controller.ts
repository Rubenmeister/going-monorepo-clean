import {
  Controller, Post, Body, BadRequestException, UseGuards,
  Inject, ServiceUnavailableException, Logger, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-application';
import { IPaymentGateway } from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { PricingService } from '../application/pricing.service';
import {
  FareEngine,
  FareQuoteInput,
} from '../application/fare-engine.service';
import { QuoteStore } from '../application/quote-store.service';
import { DATAFAST_GATEWAY, DEUNA_GATEWAY } from '../infrastructure/infrastructure.module';

/**
 * Auth split:
 *   - /quote, /estimate → PÚBLICOS por diseño (UX: usuario ve precio antes
 *     de signup). Mitigación de price scraping: rate limiting (próxima
 *     pasada — Redis-based throttler por IP).
 *   - /intent, /quote/confirm → JWT requerido (acciones que crean state +
 *     mueven dinero). Aplicamos guard a método individual.
 */
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private readonly pricingService: PricingService,
    private readonly fareEngine: FareEngine,
    private readonly quoteStore: QuoteStore,
    @Inject(DATAFAST_GATEWAY) private readonly datafastGateway: IPaymentGateway,
    @Inject(DEUNA_GATEWAY)    private readonly deunaGateway:    IPaymentGateway,
  ) {}

  @Post('intent')
  @UseGuards(AuthGuard('jwt'))
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto): Promise<any> {
    try {
      return await this.createPaymentIntentUseCase.execute(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * @deprecated Usar POST /payments/quote.
   *
   * Estimate fare — versión legacy: el caller pasa `distanceKm` ya calculado.
   * POST /payments/estimate
   *
   * IMPORTANTE: este endpoint es PÚBLICO (sin JWT) — siempre devuelve
   * precio público. NO aplica el +25% corporativo aunque el caller sea
   * una empresa, porque no tenemos identidad para confiar. Si una empresa
   * necesita el quote real con su recargo, debe usar POST /payments/quote
   * (acepta clientSegment en el body con validación) o llamar
   * autenticado a POST /bookings/estimate del booking-service.
   *
   * Mantenido por compatibilidad con clientes externos legacy (ops dashboards
   * que cotizaban sin pasar por la app). Será removido cuando podamos
   * confirmar que nadie externo lo consume (~1 trimestre de telemetría).
   */
  @Post('estimate')
  estimateFare(@Body() body: any) {
    try {
      return this.pricingService.calculate(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Quote unificado — motor de precios con distancia real por carretera.
   * POST /payments/quote
   *
   * Body:
   *   {
   *     "origin":       { "lat": -0.1807, "lng": -78.4678 },
   *     "destination":  { "lat": -0.0023, "lng": -78.4550 },
   *     "category":     "transport" | "envio",
   *     "mode":         "privado" | "compartido",           // transport
   *     "clientSegment":"public" | "agency" | "corporate",
   *     "weightKg":     2.5,                                // envio
   *     "serviceDateTime": "2026-04-25T09:00:00Z",          // opcional
   *     "redeemPoints":    200,                             // opcional tipo B
   *     "availablePoints": 450                              // saldo conocido
   *   }
   *
   * Response (ver FareQuote): distanceKm, total, breakdown, surge rates,
   * pointsEarned, pointsDiscount, routingProvider.
   */
  @Post('quote')
  async quoteFare(@Body() body: FareQuoteInput) {
    if (!body?.origin?.lat || !body?.origin?.lng) {
      throw new BadRequestException('origin.lat y origin.lng son requeridos');
    }
    if (!body?.destination?.lat || !body?.destination?.lng) {
      throw new BadRequestException(
        'destination.lat y destination.lng son requeridos',
      );
    }
    if (!body.category) {
      throw new BadRequestException('category (transport|envio) es requerido');
    }
    if (!body.clientSegment) {
      throw new BadRequestException(
        'clientSegment (public|agency|corporate) es requerido',
      );
    }

    try {
      const dto: FareQuoteInput = {
        ...body,
        serviceDateTime: body.serviceDateTime
          ? new Date(body.serviceDateTime as any)
          : undefined,
      };
      const quote = await this.fareEngine.quote(dto);
      // Guardamos el quote firmado en Redis (TTL 5 min) para que la
      // confirmación posterior pueda validar que el precio no fue
      // manipulado en el cliente.
      const userId = (body as any).userId; // opcional — el caller protegido lo pasa
      const stored = await this.quoteStore.save(quote, dto, userId);
      return {
        ...quote,
        quoteId: stored?.quoteId ?? null,
        quoteExpiresAt: stored?.expiresAt ?? null,
      };
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  /**
   * Confirmar quote previamente generado.
   * POST /payments/quote/confirm
   *
   * Body: { quoteId: "<uuid>", userId?: "<uuid>" }
   *
   * Recupera el quote del store, valida firma + ownership, y lo
   * invalida (single-use). Retorna el FareQuote original que el caller
   * debe usar como precio definitivo de la transacción.
   */
  @Post('quote/confirm')
  @UseGuards(AuthGuard('jwt'))
  async confirmQuote(
    @Body() body: { quoteId: string; userId?: string },
    @Req() req: any,
  ) {
    if (!body?.quoteId) {
      throw new BadRequestException('quoteId requerido');
    }
    // Ownership del JWT, NO del body (auditoría B1): antes se pasaba body.userId,
    // así que omitirlo saltaba el binding del quote a su dueño.
    const jwtUserId = req?.user?.id ?? req?.user?.userId;
    const stored = await this.quoteStore.claim(body.quoteId, jwtUserId);
    if (!stored) {
      throw new BadRequestException(
        'Quote inválido o expirado. Re-cotiza el viaje antes de confirmar.',
      );
    }
    // Single-use: borrarlo evita confirms duplicados.
    await this.quoteStore.invalidate(stored.quoteId);
    return {
      quoteId: stored.quoteId,
      total: stored.total,
      currency: stored.currency,
      distanceKm: stored.distanceKm,
      durationMinutes: stored.durationMinutes,
      pointsRedeemed: stored.pointsRedeemed,
      pointsEarned: stored.pointsEarned,
      input: stored.input,
      lockedAt: stored.createdAt,
    };
  }

  /**
   * Crear intent de pago digital Ecuador (Datafast tarjeta / DeUna QR).
   * POST /payments/ec/intent
   *
   * Body:
   *   {
   *     "method":   "datafast" | "deuna",
   *     "amount":   13.50,                     // USD, mayor a 0.50
   *     "currency": "USD",                     // opcional (default 'USD')
   *     "metadata": { tripId, userId, ... }    // opcional, va al webhook
   *   }
   *
   * Response (200):
   *   {
   *     "method":          "datafast" | "deuna",
   *     "paymentIntentId": "<checkoutId|orderId>",
   *     "clientSecret":    "<para mSDK / paymentLink>",
   *     "checkoutUrl":     "<URL para abrir en WebBrowser>",  (Datafast)
   *     "paymentLink":     "<URL del QR / link>",             (DeUna)
   *   }
   *
   * Errores:
   *   400 — body inválido o monto < 0.50
   *   503 — gateway no configurado (env vars faltan)
   *
   * Completion: el webhook de Datafast/DeUna confirma el pago. El cliente
   * mobile puede pollear GET /payments/payment/:id para detectar el cambio
   * a status='completed', o esperar la notification push.
   *
   * NO requiere @UseGuards(AuthGuard) por ahora — para permitir flujos
   * donde el usuario invitado paga sin signup completo (caso uso futuro).
   * Si en el futuro se requiere auth, agregar AuthGuard.
   */
  @Post('ec/intent')
  async createEcuadorIntent(@Body() body: {
    method:   'datafast' | 'deuna';
    amount:   number;
    currency?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!body?.method || (body.method !== 'datafast' && body.method !== 'deuna')) {
      throw new BadRequestException('method debe ser "datafast" o "deuna"');
    }
    if (typeof body.amount !== 'number' || body.amount < 0.5) {
      throw new BadRequestException('amount es requerido (USD, mínimo 0.50)');
    }

    const currency = (body.currency || 'USD').toUpperCase();
    if (currency !== 'USD') {
      throw new BadRequestException('Solo soportamos USD por ahora');
    }
    const amountVO = Money.fromPrimitives({ amount: body.amount, currency: 'USD' });
    const gateway = body.method === 'datafast' ? this.datafastGateway : this.deunaGateway;

    const result = await gateway.createPaymentIntent(amountVO);
    if (result.isErr()) {
      const msg = result.error.message;
      this.logger.warn(`[payments/ec/intent] gateway ${body.method} fail: ${msg}`);
      // Si el gateway no está configurado (faltan env vars), devolvemos 503
      // — Service Unavailable temporal, no 500 / 400. Mobile interpreta
      // como "pago digital no disponible, fallback a efectivo".
      if (msg.toLowerCase().includes('no configurado')) {
        throw new ServiceUnavailableException(
          `${body.method.toUpperCase()} no está disponible en este momento. Usa efectivo o intenta más tarde.`,
        );
      }
      throw new BadRequestException(msg);
    }

    const intent = result.value;
    this.logger.log(
      `[payments/ec/intent] ${body.method} intent ${intent.paymentIntentId} created ` +
      `(amount=${body.amount} ${currency}, refId=${(body.metadata as any)?.tripId ?? 'n/a'})`,
    );

    // Shape unificado para mobile. checkoutUrl / paymentLink son aliases
    // según el método — mobile usa una u otra según UI flow:
    //   datafast → abrir checkoutUrl en WebBrowser (OPPWA hosted checkout)
    //   deuna    → mostrar paymentLink como QR + opción "abrir app DeUna"
    return {
      method:          body.method,
      paymentIntentId: intent.paymentIntentId,
      clientSecret:    intent.clientSecret,
      // Aliases convenientes para mobile UX (mismo valor que clientSecret
      // pero con nombre semántico según el método)
      checkoutUrl:     body.method === 'datafast' ? intent.clientSecret : undefined,
      paymentLink:     body.method === 'deuna'    ? intent.clientSecret : undefined,
    };
  }
}
