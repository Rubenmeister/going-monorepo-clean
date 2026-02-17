import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@going-monorepo-clean/shared-domain';
import {
  SaveLocationHistoryUseCase,
  SaveLocationHistoryDto,
  GetTripRouteUseCase,
  CheckGeofenceUseCase,
  CheckGeofenceDto,
  CalculateEtaUseCase,
  CalculateEtaDto,
  GetDriverLocationForTripUseCase,
  GetDriverLocationForTripDto,
  CheckProximityUseCase,
  CheckProximityInput,
} from '@going-monorepo-clean/domains-tracking-application';

@ApiTags('geolocation')
@Controller('geolocation')
export class GeolocationController {
  constructor(
    private readonly saveLocationHistoryUseCase: SaveLocationHistoryUseCase,
    private readonly getTripRouteUseCase: GetTripRouteUseCase,
    private readonly checkGeofenceUseCase: CheckGeofenceUseCase,
    private readonly calculateEtaUseCase: CalculateEtaUseCase,
    private readonly getDriverLocationForTripUseCase: GetDriverLocationForTripUseCase,
    private readonly checkProximityUseCase: CheckProximityUseCase,
  ) {}

  // --- Location History ---

  @Post('history')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Save a location history record' })
  @ApiBody({ type: SaveLocationHistoryDto })
  @ApiResponse({ status: 201, description: 'Location history saved' })
  async saveLocationHistory(@Body() dto: SaveLocationHistoryDto) {
    await this.saveLocationHistoryUseCase.execute(dto);
    return { message: 'Location history saved' };
  }

  @Get('trip/:tripId/route')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Get the route (GPS breadcrumbs) for a trip' })
  @ApiResponse({ status: 200, description: 'Array of route points' })
  async getTripRoute(@Param('tripId') tripId: string) {
    return this.getTripRouteUseCase.execute(tripId);
  }

  // --- Geofencing ---

  @Post('geofence/check')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Check if a point is within a geofence' })
  @ApiBody({ type: CheckGeofenceDto })
  @ApiResponse({ status: 200, description: 'Geofence check result' })
  async checkGeofence(@Body() dto: CheckGeofenceDto) {
    return this.checkGeofenceUseCase.execute(dto);
  }

  // --- ETA ---

  @Post('eta')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Calculate estimated time of arrival between two points' })
  @ApiBody({ type: CalculateEtaDto })
  @ApiResponse({ status: 200, description: 'ETA calculation result' })
  async calculateEta(@Body() dto: CalculateEtaDto) {
    return this.calculateEtaUseCase.execute(dto);
  }

  // --- Driver Location for Trip ---

  @Get('trip/:tripId/driver/:driverId')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get the current driver location for a specific trip' })
  @ApiQuery({ name: 'destLat', required: false, description: 'Destination latitude for ETA' })
  @ApiQuery({ name: 'destLng', required: false, description: 'Destination longitude for ETA' })
  @ApiResponse({ status: 200, description: 'Driver location with optional ETA' })
  async getDriverLocationForTrip(
    @Param('tripId') tripId: string,
    @Param('driverId') driverId: string,
    @Query('destLat') destLat?: string,
    @Query('destLng') destLng?: string,
  ) {
    const dto: GetDriverLocationForTripDto = { driverId, tripId };
    return this.getDriverLocationForTripUseCase.execute(
      dto,
      destLat ? parseFloat(destLat) : undefined,
      destLng ? parseFloat(destLng) : undefined,
    );
  }

  // --- Proximity Check ---

  @Post('proximity/check')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Check driver proximity to pickup/destination and emit events' })
  @ApiResponse({ status: 200, description: 'Proximity check result' })
  async checkProximity(@Body() input: CheckProximityInput) {
    return this.checkProximityUseCase.execute(input);
  }
}
