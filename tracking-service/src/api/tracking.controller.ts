import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-application';
import { Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly getActiveDriversUseCase: GetActiveDriversUseCase,
  ) {}

  @Get('active-drivers')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener conductores activos (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de conductores activos con su ubicación' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: solo admins' })
  async getActiveDrivers(): Promise<any> {
    return this.getActiveDriversUseCase.execute();
  }
}
