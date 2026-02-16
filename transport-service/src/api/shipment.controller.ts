import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  CreateShipmentDto,
  CreateShipmentUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { IShipmentRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('shipments')
@Controller('shipments')
export class ShipmentController {
  constructor(
    private readonly createShipmentUseCase: CreateShipmentUseCase,
    @Inject(IShipmentRepository) private readonly shipmentRepo: IShipmentRepository,
  ) {}

  @Post()
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Crear un envío' })
  @ApiBody({ type: CreateShipmentDto })
  @ApiResponse({ status: 201, description: 'Envío creado' })
  async createShipment(@Body() dto: CreateShipmentDto): Promise<any> {
    return this.createShipmentUseCase.execute(dto);
  }

  @Get('sender/:senderId')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Obtener envíos por remitente' })
  @ApiParam({ name: 'senderId', description: 'ID del remitente' })
  async getBySender(@Param('senderId') senderId: UUID): Promise<any> {
    const result = await this.shipmentRepo.findBySenderId(senderId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value.map(s => s.toPrimitives());
  }

  @Get(':shipmentId')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener un envío por ID' })
  @ApiParam({ name: 'shipmentId', description: 'ID del envío' })
  async getById(@Param('shipmentId') shipmentId: UUID): Promise<any> {
    const result = await this.shipmentRepo.findById(shipmentId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value ? result.value.toPrimitives() : null;
  }
}
