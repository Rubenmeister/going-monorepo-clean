import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateBookingDto,
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  GetBookingByIdUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
  CompleteBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
    private readonly getBookingByIdUseCase: GetBookingByIdUseCase,
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    private readonly completeBookingUseCase: CompleteBookingUseCase,
  ) {}

  @Post()
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  async createBooking(@Body() dto: CreateBookingDto): Promise<any> {
    return this.createBookingUseCase.execute(dto);
  }

  @Get('user/:userId')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener reservas de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del usuario' })
  async getBookingsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findBookingsByUserUseCase.execute(userId);
  }

  @Get(':id')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener una reserva por ID' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async getBookingById(@Param('id') id: UUID): Promise<any> {
    const booking = await this.getBookingByIdUseCase.execute(id);
    return booking.toPrimitives();
  }

  @Patch(':id/confirm')
  @Roles('admin')
  @ApiOperation({ summary: 'Confirmar una reserva pendiente' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Reserva confirmada' })
  @ApiResponse({ status: 412, description: 'La reserva no está pendiente' })
  async confirmBooking(@Param('id') id: UUID): Promise<any> {
    await this.confirmBookingUseCase.execute(id);
    return { message: 'Booking confirmed' };
  }

  @Patch(':id/cancel')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Cancelar una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada' })
  @ApiResponse({ status: 412, description: 'No se puede cancelar esta reserva' })
  async cancelBooking(@Param('id') id: UUID): Promise<any> {
    await this.cancelBookingUseCase.execute(id);
    return { message: 'Booking cancelled' };
  }

  @Patch(':id/complete')
  @Roles('admin')
  @ApiOperation({ summary: 'Marcar una reserva como completada' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiResponse({ status: 200, description: 'Reserva completada' })
  @ApiResponse({ status: 412, description: 'Solo reservas confirmadas pueden completarse' })
  async completeBooking(@Param('id') id: UUID): Promise<any> {
    await this.completeBookingUseCase.execute(id);
    return { message: 'Booking completed' };
  }
}
