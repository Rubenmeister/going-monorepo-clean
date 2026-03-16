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
  Inject,
  NotFoundException,
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
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { TwilioProxyService } from '../infrastructure/twilio-proxy.service';

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
    private readonly completeRideUseCase: CompleteRideUseCase,
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
    private readonly twilioProxy: TwilioProxyService,
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
    const result = await this.tripRepo.findById(rideId as any);
    if (result.isErr()) throw new NotFoundException(result.error.message);
    if (!result.value) throw new NotFoundException(`Ride ${rideId} not found`);
    return result.value.toPrimitives();
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
    @Body() _dto: StartRideDto
  ): Promise<any> {
    const result = await this.tripRepo.findById(rideId as any);
    if (result.isErr() || !result.value)
      throw new NotFoundException(`Ride ${rideId} not found`);

    const trip = result.value;
    trip.start();
    await this.tripRepo.update(trip);

    return { rideId, status: trip.status, startedAt: new Date() };
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
    const result = await this.tripRepo.findTripsByUser(
      user.id,
      limit ? Number(limit) : 20
    );
    if (result.isErr()) return [];
    return result.value.map((t) => t.toPrimitives());
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
    const result = await this.tripRepo.findActiveTripsByDriver(driverId as any);
    if (result.isErr()) return [];
    return result.value
      .slice(0, limit ? Number(limit) : 20)
      .map((t) => t.toPrimitives());
  }

  /**
   * GET /api/rides/:rideId/proxy-number
   * Retorna el número proxy enmascarado para la llamada conductor ↔ pasajero.
   * - Si Twilio está configurado: crea/retorna la sesión proxy
   * - Si no está configurado: retorna el número real del conductor (fallback)
   * El campo `caller` indica quién llama: 'user' | 'driver'
   */
  @Get(':rideId/proxy-number')
  async getProxyNumber(
    @Param('rideId') rideId: string,
    @CurrentUser() currentUser: any,
  ): Promise<{ proxyNumber: string; masked: boolean }> {
    const result = await this.tripRepo.findById(rideId as any);
    if (result.isErr() || !result.value)
      throw new NotFoundException(`Ride ${rideId} not found`);

    const trip = result.value as any;

    // Intentar obtener/crear sesión proxy
    let session = this.twilioProxy.getSession(rideId);
    if (!session && trip.driver?.phone && trip.user?.phone) {
      session = await this.twilioProxy.createSession({
        rideId,
        userPhone:   trip.user.phone,
        driverPhone: trip.driver.phone,
      });
    }

    if (session) {
      // Retornar el número proxy correcto según quién llama
      const isDriver = currentUser?.role === 'driver';
      return {
        proxyNumber: isDriver ? session.userProxyNumber : session.driverProxyNumber,
        masked: true,
      };
    }

    // Fallback: número real del conductor (sin masking)
    const fallbackNumber = trip.driver?.phone ?? '';
    return { proxyNumber: fallbackNumber, masked: false };
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
    const result = await this.tripRepo.findById(rideId as any);
    if (result.isErr() || !result.value)
      throw new NotFoundException(`Ride ${rideId} not found`);

    const trip = result.value;
    trip.cancel(reason || 'user_cancelled');
    await this.tripRepo.update(trip);

    return {
      rideId,
      status: trip.status,
      reason,
      cancelledAt: new Date(),
    };
  }
}
