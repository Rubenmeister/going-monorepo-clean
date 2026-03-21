import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-application';
import { PricingService } from '../application/pricing.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private readonly pricingService: PricingService
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
   * Estimate fare before confirming a booking/trip
   * POST /payments/estimate
   * Body examples:
   *   { serviceType: "transport", distanceKm: 5.2, durationMinutes: 12 }
   *   { serviceType: "envio", distanceKm: 8, weightKg: 2.5 }
   *   { serviceType: "tour", baseAmount: 35, quantity: 2 }
   *   { serviceType: "accommodation", baseAmount: 80, quantity: 3 }
   */
  @Post('estimate')
  estimateFare(@Body() body: any) {
    try {
      return this.pricingService.calculate(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
