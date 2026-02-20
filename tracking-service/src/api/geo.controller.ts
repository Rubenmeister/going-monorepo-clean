import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../../domain/ports';
import {
  LocationUpdateDto,
  NearbyDriversQueryDto,
  NearbyDriversResponseDto,
  CreateTrackingSessionDto,
  TrackingSessionResponseDto,
  CompleteTrackingSessionDto,
} from './dtos';
import {
  GeolocationService,
  DistanceCalculatorService,
  Coordinates,
  Distance,
} from '../../domain/ports';

/**
 * Geolocation Controller
 * REST APIs for location services
 */
@Controller('tracking/geo')
@UseGuards(JwtAuthGuard)
export class GeoController {
  constructor(
    @Inject('GeolocationService')
    private readonly geoService: GeolocationService,
    @Inject('DistanceCalculatorService')
    private readonly distanceCalculator: DistanceCalculatorService
  ) {}

  /**
   * Update driver's current location
   */
  @Put('driver/location')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateDriverLocation(
    @CurrentUser() user: any,
    @Body() dto: LocationUpdateDto
  ): Promise<void> {
    const coordinates = new Coordinates(dto.latitude, dto.longitude);

    // TODO: Save to Redis and emit WebSocket event
    // This will be implemented with tracking service
  }

  /**
   * Find nearby available drivers
   * GET /api/tracking/geo/nearby-drivers?latitude=X&longitude=Y&radius=5
   */
  @Get('nearby-drivers')
  async getNearbyDrivers(
    @Query() query: NearbyDriversQueryDto
  ): Promise<NearbyDriversResponseDto> {
    const coordinates = new Coordinates(query.latitude, query.longitude);
    const radius = new Distance(query.radius || 5);
    const limit = query.limit || 10;

    const availableDrivers = await this.geoService.findNearbyAvailableDrivers(
      query.latitude,
      query.longitude,
      radius,
      limit
    );

    const drivers = availableDrivers.map((driver) => ({
      driverId: driver.driverId,
      name: 'Driver Name', // TODO: Fetch from user service
      rating: 4.5, // TODO: Fetch from rating service
      latitude: driver.currentLocation.coordinates.latitude,
      longitude: driver.currentLocation.coordinates.longitude,
      distance: this.distanceCalculator.calculateDistance(
        coordinates,
        driver.currentLocation.coordinates
      ).kilometers,
      eta: this.geoService.estimateEta(driver.currentLocation, coordinates),
      availableSeats: driver.availableSeats,
      serviceTypes: driver.serviceTypes,
    }));

    return {
      drivers,
      totalCount: drivers.length,
      searchRadius: radius.kilometers,
    };
  }

  /**
   * Find closest available driver
   */
  @Get('closest-driver')
  async getClosestDriver(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number
  ) {
    const searchRadius = new Distance(radius || 10);
    const closestDriver = await this.geoService.findClosestAvailableDriver(
      latitude,
      longitude,
      searchRadius
    );

    if (!closestDriver) {
      return {
        driver: null,
        message: 'No available drivers found',
      };
    }

    return {
      driverId: closestDriver.driverId,
      name: 'Driver Name',
      rating: 4.5,
      latitude: closestDriver.currentLocation.coordinates.latitude,
      longitude: closestDriver.currentLocation.coordinates.longitude,
      eta: this.geoService.estimateEta(
        closestDriver.currentLocation,
        new Coordinates(latitude, longitude)
      ),
    };
  }

  /**
   * Create a tracking session for a trip
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createTrackingSession(
    @CurrentUser() user: any,
    @Body() dto: CreateTrackingSessionDto
  ): Promise<TrackingSessionResponseDto> {
    // TODO: Create tracking session and join WebSocket room
    return {} as any;
  }

  /**
   * Get tracking session details
   */
  @Get('sessions/:tripId')
  async getTrackingSession(
    @Param('tripId') tripId: string
  ): Promise<TrackingSessionResponseDto> {
    // TODO: Fetch from MongoDB
    return {} as any;
  }

  /**
   * Complete a tracking session
   */
  @Put('sessions/:tripId/complete')
  async completeTrackingSession(
    @Param('tripId') tripId: string,
    @Body() dto: CompleteTrackingSessionDto
  ): Promise<TrackingSessionResponseDto> {
    // TODO: Mark as completed and close WebSocket room
    return {} as any;
  }

  /**
   * Get driver's location history
   */
  @Get('driver/:driverId/history')
  async getDriverHistory(
    @Param('driverId') driverId: string,
    @Query('days') days?: number
  ) {
    // TODO: Fetch from MongoDB
    return {
      sessions: [],
    };
  }

  /**
   * Get distance between two drivers
   */
  @Get('distance')
  async getDistance(
    @Query('driver1') driver1: string,
    @Query('driver2') driver2: string
  ) {
    const distance = await this.geoService.getDistanceBetweenDrivers(
      driver1,
      driver2
    );

    return {
      driver1,
      driver2,
      distance: distance ? distance.kilometers : null,
      unit: 'km',
    };
  }

  /**
   * Check if driver is in service area
   */
  @Get('service-area/check')
  async checkServiceArea(
    @Query('driverId') driverId: string,
    @Query('centerLatitude') centerLatitude: number,
    @Query('centerLongitude') centerLongitude: number,
    @Query('radius') radius: number = 10
  ) {
    const serviceCenter = new Coordinates(centerLatitude, centerLongitude);
    const serviceRadius = new Distance(radius);

    const isInArea = await this.geoService.isDriverInServiceArea(
      driverId,
      serviceCenter,
      serviceRadius
    );

    return {
      driverId,
      isInServiceArea: isInArea,
      serviceCenter: { latitude: centerLatitude, longitude: centerLongitude },
      serviceRadius: radius,
    };
  }
}
