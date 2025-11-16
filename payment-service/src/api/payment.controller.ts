import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-application';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
  ) {}

  @Post('intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto): Promise<any> {
    try {
      return await this.createPaymentIntentUseCase.execute(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}