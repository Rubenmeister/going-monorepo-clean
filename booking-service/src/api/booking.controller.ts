import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import {
  CreateBookingDto,
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('bookings')
export class BookingController {
  constructor(
    // Inyecta los Casos de Uso
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
  ) {}

  @Post()
  // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
  async createBooking(@Body() dto: CreateBookingDto): Promise<any> {
    // const userId = req.user.id; // Obtener userId del token
    return this.createBookingUseCase.execute(dto);
  }

  @Get('user/:userId')
  // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
  async getBookingsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findBookingsByUserUseCase.execute(userId);
  }
  
  // (Aquí puedes añadir más endpoints: CancelBooking, ConfirmBooking, etc.)
}