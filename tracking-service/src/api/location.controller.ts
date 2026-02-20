/**
 * Location Controller
 * REST API endpoints for real-time location tracking
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  UseGuards,
  Logger,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CorporateJwtAuthGuard } from '@going-monorepo-clean/features-corporate-auth';
import { LocationService } from '../application/services/location.service';

interface LocationUpdateDto {
  driverId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

interface LocationHistoryQueryDto {
  driverId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
}

interface NearbySearchDto {
  longitude: number;
  latitude: number;
  radiusMeters?: number;
}

@Controller('api/locations')
@UseGuards(CorporateJwtAuthGuard)
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(private readonly locationService: LocationService) {}

  /**
   * POST /api/locations
   * Record a new location update from a driver (real-time)
   */
  @Post()
  @HttpCode(201)
  async recordLocation(@Body() dto: LocationUpdateDto, @Req() req: Request) {
    const user = (req as any).user;
    const companyId = user.companyId;

    this.logger.log(
      `Location recorded for driver ${dto.driverId} in company ${companyId}`
    );

    const location = await this.locationService.recordLocation(companyId, dto);

    return {
      success: true,
      data: location,
      message: 'Location recorded successfully',
    };
  }

  /**
   * GET /api/locations/current/:driverId
   * Get current location of a specific driver
   */
  @Get('current/:driverId')
  async getDriverCurrentLocation(
    @Param('driverId') driverId: string,
    @Req() req: Request
  ) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const location = await this.locationService.getDriverCurrentLocation(
      companyId,
      driverId
    );

    return {
      success: true,
      data: location,
    };
  }

  /**
   * GET /api/locations/all
   * Get current locations for all active drivers
   */
  @Get('all')
  async getAllDriversLocations(@Req() req: Request) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const locations = await this.locationService.getAllDriversCurrentLocations(
      companyId
    );

    return {
      success: true,
      data: locations,
      count: locations.length,
    };
  }

  /**
   * GET /api/locations/history
   * Get location history for a driver within time range
   * Query params: driverId, startTime, endTime (ISO 8601)
   */
  @Get('history')
  async getLocationHistory(
    @Query() query: LocationHistoryQueryDto,
    @Req() req: Request
  ) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new ForbiddenException('Invalid date format. Use ISO 8601 format.');
    }

    const locations = await this.locationService.getLocationHistory(
      companyId,
      query.driverId,
      startTime,
      endTime
    );

    return {
      success: true,
      data: locations,
      count: locations.length,
    };
  }

  /**
   * GET /api/locations/heatmap
   * Get heatmap data for visualization
   */
  @Get('heatmap')
  async getHeatmapData(
    @Query('gridSize') gridSize?: string,
    @Req() req: Request
  ) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const size = gridSize ? parseInt(gridSize, 10) : 1000;
    const heatmapData = await this.locationService.getHeatmapData(
      companyId,
      size
    );

    return {
      success: true,
      data: heatmapData,
      gridSize: size,
    };
  }

  /**
   * POST /api/locations/nearby
   * Find locations near a geographic point
   */
  @Post('nearby')
  async findLocationsNearby(@Body() dto: NearbySearchDto, @Req() req: Request) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const radiusMeters = dto.radiusMeters || 5000; // Default 5km
    const locations = await this.locationService.findLocationsNearby(
      companyId,
      dto.longitude,
      dto.latitude,
      radiusMeters
    );

    return {
      success: true,
      data: locations,
      center: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      radius: radiusMeters,
      count: locations.length,
    };
  }

  /**
   * GET /api/locations/trip-summary
   * Get trip summary for analysis
   * Query params: driverId, startTime, endTime (ISO 8601)
   */
  @Get('trip-summary')
  async getTripSummary(
    @Query() query: LocationHistoryQueryDto,
    @Req() req: Request
  ) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new ForbiddenException('Invalid date format. Use ISO 8601 format.');
    }

    const summary = await this.locationService.getTripSummary(
      companyId,
      query.driverId,
      startTime,
      endTime
    );

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * GET /api/locations/route-visualization
   * Get route data for map visualization
   * Query params: driverId, startTime, endTime (ISO 8601)
   */
  @Get('route-visualization')
  async getRouteVisualization(
    @Query() query: LocationHistoryQueryDto,
    @Req() req: Request
  ) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new ForbiddenException('Invalid date format. Use ISO 8601 format.');
    }

    const routeData = await this.locationService.getRouteForVisualization(
      companyId,
      query.driverId,
      startTime,
      endTime
    );

    return {
      success: true,
      data: routeData,
    };
  }

  /**
   * GET /api/locations/active-drivers
   * Get count of currently active drivers
   */
  @Get('active-drivers')
  async getActiveDriverCount(@Req() req: Request) {
    const user = (req as any).user;
    const companyId = user.companyId;

    const count = await this.locationService.getActiveDriverCount(companyId);

    return {
      success: true,
      data: {
        activeDrivers: count,
        timestamp: new Date(),
      },
    };
  }
}
