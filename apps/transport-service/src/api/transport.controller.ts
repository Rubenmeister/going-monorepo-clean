import { Body, Controller, Post, Param, Patch, Get, Query } from '@nestjs/common';
import { RequestTripUseCase, AcceptTripUseCase, RequestTripDto } from '@going-monorepo-clean/domains-transport-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
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
    // Assuming UUID validation happens in VO or Pipe, but here we cast string to UUID type alias
    // In a real scenario, we might want a DTO for the body or a ParseUUIDPipe
    return this.acceptTripUseCase.execute(id as UUID, driverId as UUID);
  }

  // TODO: Move to a proper FindTripsUseCase with CQRS
  @Get('search')
  async search(@Query('q') query: string) {
    // Mock response for now to unblock Frontend
    return [
      { id: 'T-001', from: 'Aeropuerto', to: 'Centro', status: 'in_progress', driver: 'Roberto P.' },
      { id: 'T-002', from: 'La Carolina', to: 'Cumbayá', status: 'requested', driver: null },
    ].filter(t => !query || t.id.toLowerCase().includes(query.toLowerCase()) || t.driver?.toLowerCase().includes(query.toLowerCase()));
  }
}