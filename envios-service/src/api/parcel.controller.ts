import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateParcelDto,
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
  GetParcelByIdUseCase,
  AssignDriverToParcelUseCase,
  MarkParcelInTransitUseCase,
  DeliverParcelUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('parcels')
@Controller('parcels')
export class ParcelController {
  constructor(
    private readonly createParcelUseCase: CreateParcelUseCase,
    private readonly findParcelsByUserUseCase: FindParcelsByUserUseCase,
    private readonly getParcelByIdUseCase: GetParcelByIdUseCase,
    private readonly assignDriverUseCase: AssignDriverToParcelUseCase,
    private readonly markInTransitUseCase: MarkParcelInTransitUseCase,
    private readonly deliverParcelUseCase: DeliverParcelUseCase,
  ) {}

  @Post()
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Crear un nuevo envío' })
  @ApiBody({ type: CreateParcelDto })
  @ApiResponse({ status: 201, description: 'Envío creado exitosamente' })
  async createParcel(@Body() dto: CreateParcelDto): Promise<any> {
    return this.createParcelUseCase.execute(dto);
  }

  @Get('user/:userId')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener envíos de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de envíos del usuario' })
  async getParcelsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findParcelsByUserUseCase.execute(userId);
  }

  @Get(':id')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener un envío por ID' })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiResponse({ status: 200, description: 'Envío encontrado' })
  @ApiResponse({ status: 404, description: 'Envío no encontrado' })
  async getParcelById(@Param('id') id: UUID): Promise<any> {
    const parcel = await this.getParcelByIdUseCase.execute(id);
    return parcel.toPrimitives();
  }

  @Patch(':id/assign-driver')
  @Roles('admin')
  @ApiOperation({ summary: 'Asignar conductor a un envío' })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiBody({ schema: { properties: { driverId: { type: 'string', format: 'uuid' } }, required: ['driverId'] } })
  @ApiResponse({ status: 200, description: 'Conductor asignado' })
  @ApiResponse({ status: 412, description: 'El envío no está pendiente' })
  async assignDriver(@Param('id') id: UUID, @Body('driverId') driverId: UUID): Promise<any> {
    await this.assignDriverUseCase.execute(id, driverId);
    return { message: 'Driver assigned' };
  }

  @Patch(':id/in-transit')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Marcar envío como en tránsito' })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiResponse({ status: 200, description: 'Envío en tránsito' })
  @ApiResponse({ status: 412, description: 'Debe tener conductor asignado' })
  async markInTransit(@Param('id') id: UUID): Promise<any> {
    await this.markInTransitUseCase.execute(id);
    return { message: 'Parcel in transit' };
  }

  @Patch(':id/deliver')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Marcar envío como entregado' })
  @ApiParam({ name: 'id', description: 'ID del envío' })
  @ApiResponse({ status: 200, description: 'Envío entregado' })
  @ApiResponse({ status: 412, description: 'El envío no está en tránsito' })
  async deliver(@Param('id') id: UUID): Promise<any> {
    await this.deliverParcelUseCase.execute(id);
    return { message: 'Parcel delivered' };
  }
}
