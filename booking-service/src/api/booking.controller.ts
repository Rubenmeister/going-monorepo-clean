import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateBookingDto,
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente', schema: { properties: { id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createBooking(@Body() dto: CreateBookingDto): Promise<any> {
    return this.createBookingUseCase.execute(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener reservas de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del usuario' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getBookingsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findBookingsByUserUseCase.execute(userId);
  }
}
