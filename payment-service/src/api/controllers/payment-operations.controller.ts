import { Controller, Post, Get, Param, Body, HttpStatus, Inject } from '@nestjs/common';
import { IPaymentRepository, IPayoutRepository } from '../../domain/ports';
import { ProcessPaymentUseCase } from '../../application/use-cases/process-payment.use-case';
import { CompleteRideUseCase } from '../../application/use-cases/complete-ride.use-case';
import { CreatePayoutUseCase } from '../../application/use-cases/create-payout.use-case';

/**
 * Payment Operations Controller
 * Handles payment and payout operations
 */
@Controller('payments')
export class PaymentOperationsController {
  constructor(
    private processPaymentUseCase: ProcessPaymentUseCase,
    private completeRideUseCase: CompleteRideUseCase,
    private createPayoutUseCase: CreatePayoutUseCase,
    @Inject(IPaymentRepository) private paymentRepository: IPaymentRepository,
    @Inject(IPayoutRepository) private payoutRepository: IPayoutRepository
  ) {}

  @Post('process')
  async processPayment(
    @Body()
    dto: {
      tripId: string;
      passengerId: string;
      driverId: string;
      amount: number;
      paymentMethod: 'card' | 'wallet' | 'cash';
      paymentMethodId?: string;
    }
  ) {
    const payment = await this.processPaymentUseCase.execute(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment processed successfully',
      data: payment,
    };
  }

  @Post('complete-ride')
  async completeRide(
    @Body()
    dto: {
      tripId: string;
      passengerId: string;
      driverId: string;
      finalFare: number;
      actualDistance: number;
      actualDuration: number;
      paymentMethod: 'card' | 'wallet' | 'cash';
      paymentMethodId?: string;
    }
  ) {
    const result = await this.completeRideUseCase.execute(dto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Ride completed and payment processed',
      data: result,
    };
  }

  @Get('payment/:id')
  async getPayment(@Param('id') id: string) {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment not found',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Get('trip/:tripId')
  async getPaymentByTrip(@Param('tripId') tripId: string) {
    const payment = await this.paymentRepository.findByTrip(tripId);

    if (!payment) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment not found for this trip',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Get('passenger/:passengerId')
  async getPassengerPayments(@Param('passengerId') passengerId: string) {
    const payments = await this.paymentRepository.findByPassenger(
      passengerId,
      50
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: payments.length,
        payments,
      },
    };
  }

  @Get('driver/:driverId/payments')
  async getDriverPayments(@Param('driverId') driverId: string) {
    const payments = await this.paymentRepository.findByDriver(driverId, 50);

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: payments.length,
        payments,
      },
    };
  }

  @Post('payout/create')
  async createPayout(
    @Body()
    dto: {
      driverId: string;
      bankAccountId: string;
      paymentMethod: 'bank_account' | 'debit_card' | 'wallet';
    }
  ) {
    const payout = await this.createPayoutUseCase.execute(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payout created successfully',
      data: payout,
    };
  }

  @Get('payout/:id')
  async getPayout(@Param('id') id: string) {
    const payout = await this.payoutRepository.findById(id);

    if (!payout) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payout not found',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: payout,
    };
  }

  @Get('driver/:driverId/payouts')
  async getDriverPayouts(@Param('driverId') driverId: string) {
    const payouts = await this.payoutRepository.findByDriver(driverId, 50);

    return {
      statusCode: HttpStatus.OK,
      data: {
        count: payouts.length,
        payouts,
      },
    };
  }

  @Get('driver/:driverId/balance')
  async getDriverBalance(@Param('driverId') driverId: string) {
    const balance = await this.payoutRepository.calculateDriverBalance(
      driverId
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        driverId,
        totalEarned: balance,
        currency: 'USD',
      },
    };
  }
}
