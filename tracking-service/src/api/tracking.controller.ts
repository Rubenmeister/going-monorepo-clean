import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-application';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly getActiveDriversUseCase: GetActiveDriversUseCase,
  ) {}

  @Get('active-drivers')
  @ApiOperation({ summary: 'Obtener conductores activos' })
  @ApiResponse({ status: 200, description: 'Lista de conductores activos con su ubicación' })
  async getActiveDrivers(): Promise<any> {
    return this.getActiveDriversUseCase.execute();
  }
}
