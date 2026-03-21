import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Inject,
} from '@nestjs/common';
import {
  RequestTripDto,
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
    @Inject(ITripRepository) private readonly tripRepo: ITripRepository
  ) {}

  @Post('request')
  async requestTrip(@Body() dto: RequestTripDto): Promise<any> {
    return this.requestTripUseCase.execute(dto);
  }

  @Patch(':tripId/accept')
  async acceptTrip(
    @Param('tripId') tripId: UUID,
    @Body('driverId') driverId: UUID
  ): Promise<any> {
    await this.acceptTripUseCase.execute(tripId, driverId);
    return { message: 'Trip accepted' };
  }

  @Get('pending')
  async getPendingTrips(): Promise<any[]> {
    const result = await this.tripRepo.findPendingTrips();
    if (result.isErr()) return [];
    return result.value.map((t) => t.toPrimitives());
  }

  @Get('user/:userId/history')
  async getUserTripHistory(@Param('userId') userId: UUID): Promise<any[]> {
    const result = await this.tripRepo.findTripsByUser(userId);
    if (result.isErr()) return [];
    return result.value.map((t) => t.toPrimitives());
  }

  @Get('driver/:driverId/active')
  async getDriverActiveTrips(
    @Param('driverId') driverId: UUID
  ): Promise<any[]> {
    const result = await this.tripRepo.findActiveTripsByDriver(driverId);
    if (result.isErr()) return [];
    return result.value.map((t) => t.toPrimitives());
  }
}
