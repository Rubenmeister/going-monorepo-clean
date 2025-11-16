import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  RequestTripDto,
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
  ) {}

  @Post('request')
  // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
  async requestTrip(@Body() dto: RequestTripDto): Promise<any> {
    return this.requestTripUseCase.execute(dto);
  }

  @Patch(':tripId/accept')
  // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
  async acceptTrip(
    @Param('tripId') tripId: UUID,
    @Body('driverId') driverId: UUID, // El Gateway pasará el ID del conductor
  ): Promise<any> {
    await this.acceptTripUseCase.execute(tripId, driverId);
    return { message: 'Trip accepted' };
  }
}