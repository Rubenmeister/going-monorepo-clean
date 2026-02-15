import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-application';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
  ) {}

  @Post('intent')
  @ApiOperation({ summary: 'Crear un Payment Intent de Stripe' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({ status: 201, description: 'Payment Intent creado exitosamente', schema: { properties: { clientSecret: { type: 'string', description: 'Client secret de Stripe para completar el pago' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o error de Stripe' })
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto): Promise<any> {
    try {
      return await this.createPaymentIntentUseCase.execute(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
