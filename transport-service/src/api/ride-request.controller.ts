import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  CreateRideRequestDto,
  CreateRideRequestUseCase,
  AssignVehicleUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { IRideRequestRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('ride-requests')
@Controller('ride-requests')
export class RideRequestController {
  constructor(
    private readonly createRideRequestUseCase: CreateRideRequestUseCase,
    private readonly assignVehicleUseCase: AssignVehicleUseCase,
    @Inject(IRideRequestRepository) private readonly rideRequestRepo: IRideRequestRepository,
  ) {}

  @Post()
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Solicitar un viaje (privado o compartido, SUV/VAN/BUS, asiento delantero/trasero)' })
  @ApiBody({ type: CreateRideRequestDto })
  @ApiResponse({ status: 201, description: 'Solicitud de viaje creada' })
  async createRideRequest(@Body() dto: CreateRideRequestDto): Promise<any> {
    return this.createRideRequestUseCase.execute(dto);
  }

  @Post(':rideRequestId/assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Ejecutar algoritmo de asignación dinámica de vehículo' })
  @ApiParam({ name: 'rideRequestId', description: 'ID de la solicitud' })
  @ApiResponse({ status: 200, description: 'Vehículo asignado con teléfonos temporales' })
  async assignVehicle(@Param('rideRequestId') rideRequestId: UUID): Promise<any> {
    return this.assignVehicleUseCase.execute(rideRequestId);
  }

  @Get('passenger/:passengerId/active')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener solicitud activa de un pasajero' })
  @ApiParam({ name: 'passengerId', description: 'ID del pasajero' })
  async getActiveByPassenger(@Param('passengerId') passengerId: UUID): Promise<any> {
    const result = await this.rideRequestRepo.findActiveByPassenger(passengerId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value ? result.value.toPrimitives() : null;
  }

  @Get('passenger/:passengerId')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener historial de solicitudes de un pasajero' })
  @ApiParam({ name: 'passengerId', description: 'ID del pasajero' })
  async getByPassenger(@Param('passengerId') passengerId: UUID): Promise<any> {
    const result = await this.rideRequestRepo.findByPassengerId(passengerId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value.map(r => r.toPrimitives());
  }

  @Get('pending')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener solicitudes pendientes ordenadas por prioridad FIFO' })
  async getPendingByPriority(): Promise<any> {
    const result = await this.rideRequestRepo.findPendingByPriority();
    if (result.isErr()) throw new Error(result.error.message);
    return result.value.map(r => r.toPrimitives());
  }
}
