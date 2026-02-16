import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  GetActiveDriversUseCase,
  UpdateLocationUseCase,
  UpdateLocationDto,
} from '@going-monorepo-clean/domains-tracking-application';
import { Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly getActiveDriversUseCase: GetActiveDriversUseCase,
    private readonly updateLocationUseCase: UpdateLocationUseCase,
  ) {}

  @Get('active-drivers')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener conductores activos (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de conductores activos con su ubicación' })
  async getActiveDrivers(): Promise<any> {
    return this.getActiveDriversUseCase.execute();
  }

  @Post('update-location')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Actualizar ubicación del conductor (HTTP fallback)' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ status: 201, description: 'Ubicación actualizada' })
  @ApiResponse({ status: 400, description: 'Coordenadas inválidas' })
  async updateLocation(@Body() dto: UpdateLocationDto): Promise<any> {
    await this.updateLocationUseCase.execute(dto);
    return { message: 'Location updated' };
  }
}
