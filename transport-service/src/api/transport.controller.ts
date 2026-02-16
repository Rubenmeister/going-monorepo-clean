import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  RequestTripDto,
  RequestTripUseCase,
  AcceptTripUseCase,
  GetActiveTripByUserUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('transport')
@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
    private readonly getActiveTripByUserUseCase: GetActiveTripByUserUseCase,
  ) {}

  @Post('request')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Solicitar un viaje' })
  @ApiBody({ type: RequestTripDto })
  @ApiResponse({ status: 201, description: 'Viaje solicitado exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: solo usuarios y admins' })
  async requestTrip(@Body() dto: RequestTripDto): Promise<any> {
    return this.requestTripUseCase.execute(dto);
  }

  @Get('user/:userId/active')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener el viaje activo de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Viaje activo del usuario (o null si no tiene)' })
  async getActiveTrip(@Param('userId') userId: UUID): Promise<any> {
    const trip = await this.getActiveTripByUserUseCase.execute(userId);
    return trip ? trip.toPrimitives() : null;
  }

  @Patch(':tripId/accept')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Aceptar un viaje (conductor)' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ schema: { properties: { driverId: { type: 'string', format: 'uuid', description: 'ID del conductor' } }, required: ['driverId'] } })
  @ApiResponse({ status: 200, description: 'Viaje aceptado', schema: { properties: { message: { type: 'string', example: 'Trip accepted' } } } })
  @ApiResponse({ status: 403, description: 'Acceso denegado: solo conductores y admins' })
  async acceptTrip(
    @Param('tripId') tripId: UUID,
    @Body('driverId') driverId: UUID,
  ): Promise<any> {
    await this.acceptTripUseCase.execute(tripId, driverId);
    return { message: 'Trip accepted' };
  }
}
