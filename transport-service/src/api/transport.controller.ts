import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  RequestTripDto,
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@ApiTags('transport')
@Controller('transport')
export class TransportController {
  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
  ) {}

  @Post('request')
  @ApiOperation({ summary: 'Solicitar un viaje' })
  @ApiBody({ type: RequestTripDto })
  @ApiResponse({ status: 201, description: 'Viaje solicitado exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async requestTrip(@Body() dto: RequestTripDto): Promise<any> {
    return this.requestTripUseCase.execute(dto);
  }

  @Patch(':tripId/accept')
  @ApiOperation({ summary: 'Aceptar un viaje (conductor)' })
  @ApiParam({ name: 'tripId', description: 'ID del viaje', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ schema: { properties: { driverId: { type: 'string', format: 'uuid', description: 'ID del conductor' } }, required: ['driverId'] } })
  @ApiResponse({ status: 200, description: 'Viaje aceptado', schema: { properties: { message: { type: 'string', example: 'Trip accepted' } } } })
  async acceptTrip(
    @Param('tripId') tripId: UUID,
    @Body('driverId') driverId: UUID,
  ): Promise<any> {
    await this.acceptTripUseCase.execute(tripId, driverId);
    return { message: 'Trip accepted' };
  }
}
