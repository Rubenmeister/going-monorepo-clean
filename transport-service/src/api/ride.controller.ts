import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../../domain/ports';
import {
  RequestRideDto,
  RideResponseDto,
  AcceptRideDto,
  StartRideDto,
  CompleteRideDto,
} from './dtos/request-ride.dto';
import {
  RequestRideUseCase,
  AcceptRideUseCase,
  CompleteRideUseCase,
} from '../application/use-cases';

/**
 * Ride Controller
 * REST API endpoints for ride management
 */
@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RideController {
  constructor(
    private readonly requestRideUseCase: RequestRideUseCase,
    private readonly acceptRideUseCase: AcceptRideUseCase,
    private readonly completeRideUseCase: CompleteRideUseCase
  ) {}

  /**
   * Request a new ride
   * POST /api/rides/request
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async requestRide(
    @CurrentUser() user: any,
    @Body() dto: RequestRideDto
  ): Promise<RideResponseDto> {
    return this.requestRideUseCase.execute({
      userId: user.id,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      dropoffLatitude: dto.dropoffLatitude,
      dropoffLongitude: dto.dropoffLongitude,
      serviceType: dto.serviceType,
    });
  }

  /**
   * Get ride details
   * GET /api/rides/:rideId
   */
  @Get(':rideId')
  async getRide(@Param('rideId') rideId: string): Promise<any> {
    // TODO: Fetch from repository
    return {
      rideId,
      message: 'Ride details',
    };
  }

  /**
   * Accept a ride (driver endpoint)
   * PUT /api/rides/:rideId/accept
   */
  @Put(':rideId/accept')
  async acceptRide(
    @CurrentUser() user: any,
    @Param('rideId') rideId: string,
    @Body() dto: AcceptRideDto
  ): Promise<any> {
    return this.acceptRideUseCase.execute({
      rideId,
      driverId: dto.driverId || user.id,
    });
  }

  /**
   * Start a ride
   * PUT /api/rides/:rideId/start
   */
  @Put(':rideId/start')
  async startRide(
    @Param('rideId') rideId: string,
    @Body() dto: StartRideDto
  ): Promise<any> {
    // TODO: Update ride status to 'started'
    return {
      rideId,
      status: 'started',
      startedAt: new Date(),
    };
  }

  /**
   * Complete a ride
   * PUT /api/rides/:rideId/complete
   */
  @Put(':rideId/complete')
  async completeRide(
    @Param('rideId') rideId: string,
    @Body() dto: CompleteRideDto
  ): Promise<any> {
    return this.completeRideUseCase.execute({
      rideId,
      distanceKm: dto.distanceKm,
      durationSeconds: dto.durationSeconds,
    });
  }

  /**
   * Get user's ride history
   * GET /api/rides/history/user
   */
  @Get('history/user')
  async getUserRideHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    // TODO: Fetch from repository
    return [];
  }

  /**
   * Get driver's ride history
   * GET /api/rides/history/driver/:driverId
   */
  @Get('history/driver/:driverId')
  async getDriverRideHistory(
    @Param('driverId') driverId: string,
    @Query('limit') limit?: number
  ): Promise<any[]> {
    // TODO: Fetch from repository
    return [];
  }

  /**
   * Cancel a ride
   * PUT /api/rides/:rideId/cancel
   */
  @Put(':rideId/cancel')
  async cancelRide(
    @Param('rideId') rideId: string,
    @Body('reason') reason: string
  ): Promise<any> {
    // TODO: Update ride status to 'cancelled'
    return {
      rideId,
      status: 'cancelled',
      reason,
      cancelledAt: new Date(),
    };
  }
}
