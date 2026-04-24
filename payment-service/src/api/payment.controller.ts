import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-application';
import { PricingService } from '../application/pricing.service';
import {
  FareEngine,
  FareQuoteInput,
} from '../application/fare-engine.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private readonly pricingService: PricingService,
    private readonly fareEngine: FareEngine,
  ) {}

  @Post('intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto): Promise<any> {
    try {
      return await this.createPaymentIntentUseCase.execute(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Estimate fare — versión legacy: el caller pasa `distanceKm` ya calculado.
   * POST /payments/estimate
   *
   * Preferido: usar POST /payments/quote que calcula distancia REAL por
   * carretera + aplica recargos + canje de puntos.
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
      return await this.fareEngine.quote(dto);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
