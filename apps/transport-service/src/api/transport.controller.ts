import { Body, Controller, Post, Param, Patch, Get, Query } from '@nestjs/common';
import { RequestTripUseCase, AcceptTripUseCase, SearchTripsUseCase, RequestTripDto } from '@going-monorepo-clean/domains-transport-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
    private readonly searchTripsUseCase: SearchTripsUseCase,
  ) {}

  @Post('request')
  async requestTrip(@Body() dto: RequestTripDto) {
    return this.requestTripUseCase.execute(dto);
  }

  @Patch(':id/accept')
  async acceptTrip(
    @Param('id') id: string,
    @Body('driverId') driverId: string
  ) {
    // Assuming UUID validation happens in VO or Pipe
    return this.acceptTripUseCase.execute(id as any, driverId as any);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.searchTripsUseCase.execute(query);
  }
}