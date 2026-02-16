import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  RegisterVehicleDto,
  RegisterVehicleUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import {
  IVehicleRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly registerVehicleUseCase: RegisterVehicleUseCase,
    @Inject(IVehicleRepository) private readonly vehicleRepo: IVehicleRepository,
  ) {}

  @Post('register')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Registrar un vehículo (requiere dashcam obligatorio)' })
  @ApiBody({ type: RegisterVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehículo registrado en estado pending_approval' })
  async registerVehicle(@Body() dto: RegisterVehicleDto): Promise<any> {
    return this.registerVehicleUseCase.execute(dto);
  }

  @Get('driver/:driverId')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Obtener vehículos de un conductor' })
  @ApiParam({ name: 'driverId', description: 'ID del conductor' })
  async getByDriver(@Param('driverId') driverId: UUID): Promise<any> {
    const result = await this.vehicleRepo.findByDriverId(driverId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value.map(v => v.toPrimitives());
  }

  @Get(':vehicleId')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiParam({ name: 'vehicleId', description: 'ID del vehículo' })
  async getById(@Param('vehicleId') vehicleId: UUID): Promise<any> {
    const result = await this.vehicleRepo.findById(vehicleId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value ? result.value.toPrimitives() : null;
  }
}
