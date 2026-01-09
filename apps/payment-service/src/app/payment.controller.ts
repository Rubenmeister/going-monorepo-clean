import { Controller, Post, Body, BadRequestException, Headers, Res, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { IsString, IsNumber, IsUUID } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

class ChargeDto {
  @IsUUID()
  bookingId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  token: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('charge')
  @ApiOperation({ summary: 'Process a payment with Kushki' })
  @ApiResponse({ status: 201, description: 'Payment successful', type: String })
  async charge(@Body() body: ChargeDto) {
    const result = await this.paymentService.processCharge({
      bookingId: body.bookingId,
      userId: body.userId,
      amount: body.amount,
      token: body.token,
    });

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return { transactionId: result.value };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Kushki Webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async handleWebhook(@Headers() headers: any, @Body() body: any, @Res() res: Response) {
    // Verify signature (mocked for now)
    if (!headers['x-kushki-signature']) {
      // this.logger.warn('Missing signature');
      // In prod, return 400 or 401
    }

    await this.paymentService.handleWebhookEvent(body);
    
    // Always return 200 to acknowledge receipt
    res.status(HttpStatus.OK).send('OK');
  }
}
