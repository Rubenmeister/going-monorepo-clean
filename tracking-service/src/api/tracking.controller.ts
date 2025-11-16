import { Controller, Get } from '@nestjs/common';
import {
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-application';

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly getActiveDriversUseCase: GetActiveDriversUseCase,
  ) {}

  @Get('active-drivers')
  async getActiveDrivers(): Promise<any> {
    return this.getActiveDriversUseCase.execute();
  }
}