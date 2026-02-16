import { Controller, Post, Body, Param, Patch, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  RequestTripDto,
  RequestTripUseCase,
  AcceptTripUseCase,
  GetActiveTripByUserUseCase,
  GetTripByIdUseCase,
  CancelTripUseCase,
  StartTripUseCase,
  CompleteTripUseCase,
  GetTripsByUserUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('transport')
@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
    private readonly getActiveTripByUserUseCase: GetActiveTripByUserUseCase,
    private readonly getTripByIdUseCase: GetTripByIdUseCase,
    private readonly cancelTripUseCase: CancelTripUseCase,
    private readonly startTripUseCase: StartTripUseCase,
    private readonly completeTripUseCase: CompleteTripUseCase,
    private readonly getTripsByUserUseCase: GetTripsByUserUseCase,
  ) {}

  @Post('request')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Solicitar un viaje' })
  @ApiBody({ type: RequestTripDto })
  @ApiResponse({ status: 201, description: 'Viaje solicitado exitosamente' })
  async requestTrip(@Body() dto: RequestTripDto): Promise<any> {
    return this.requestTripUseCase.execute(dto);
  }

  @Get('user/:userId/active')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener el viaje activo de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Viaje activo del usuario (o null)' })
  async getActiveTrip(@Param('userId') userId: UUID): Promise<any> {
    const trip = await this.getActiveTripByUserUseCase.execute(userId);
    return trip ? trip.toPrimitives() : null;
  }

  @Get('user/:userId')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener todos los viajes de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de viajes del usuario' })
  async getTripsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.getTripsByUserUseCase.execute(userId);
  }

  @Get(':tripId')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener un viaje por ID' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje' })
  @ApiResponse({ status: 200, description: 'Viaje encontrado' })
  @ApiResponse({ status: 404, description: 'Viaje no encontrado' })
  async getTripById(@Param('tripId') tripId: UUID): Promise<any> {
    const trip = await this.getTripByIdUseCase.execute(tripId);
    return trip.toPrimitives();
  }

  @Patch(':tripId/accept')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Aceptar un viaje (conductor)' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje' })
  @ApiBody({ schema: { properties: { driverId: { type: 'string', format: 'uuid' } }, required: ['driverId'] } })
  @ApiResponse({ status: 200, description: 'Viaje aceptado' })
  async acceptTrip(@Param('tripId') tripId: UUID, @Body('driverId') driverId: UUID): Promise<any> {
    await this.acceptTripUseCase.execute(tripId, driverId);
    return { message: 'Trip accepted' };
  }

  @Patch(':tripId/start')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Iniciar un viaje' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje' })
  @ApiResponse({ status: 200, description: 'Viaje iniciado' })
  @ApiResponse({ status: 412, description: 'El viaje no tiene conductor asignado' })
  async startTrip(@Param('tripId') tripId: UUID): Promise<any> {
    await this.startTripUseCase.execute(tripId);
    return { message: 'Trip started' };
  }

  @Patch(':tripId/complete')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Completar un viaje' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje' })
  @ApiResponse({ status: 200, description: 'Viaje completado' })
  @ApiResponse({ status: 412, description: 'El viaje no está en progreso' })
  async completeTrip(@Param('tripId') tripId: UUID): Promise<any> {
    await this.completeTripUseCase.execute(tripId);
    return { message: 'Trip completed' };
  }

  @Patch(':tripId/cancel')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Cancelar un viaje' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje' })
  @ApiResponse({ status: 200, description: 'Viaje cancelado' })
  @ApiResponse({ status: 412, description: 'No se puede cancelar este viaje' })
  async cancelTrip(@Param('tripId') tripId: UUID): Promise<any> {
    await this.cancelTripUseCase.execute(tripId);
    return { message: 'Trip cancelled' };
  }
}
