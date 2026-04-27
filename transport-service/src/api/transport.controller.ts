import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RequestTripDto,
  RequestTripUseCase,
  AcceptTripUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { RideEventsGateway } from '../infrastructure/gateways/ride-events.gateway';
import {
  DriverBaseModelSchema,
  DriverBaseDocument,
} from '../infrastructure/persistence/schemas/driver-base.schema';

@Controller('transport')
export class TransportController {
  private readonly logger = new Logger(TransportController.name);

  constructor(
    private readonly requestTripUseCase: RequestTripUseCase,
    private readonly acceptTripUseCase: AcceptTripUseCase,
    @Inject(ITripRepository) private readonly tripRepo: ITripRepository,
    private readonly eventsGateway: RideEventsGateway,
    @InjectModel(DriverBaseModelSchema.name)
    private readonly driverBaseModel: Model<DriverBaseDocument>,
  ) {}

  @Post('request')
  async requestTrip(@Body() dto: RequestTripDto): Promise<any> {
    return this.requestTripUseCase.execute(dto);
  }

  @Patch(':tripId/accept')
  async acceptTrip(
    @Param('tripId') tripId: UUID,
    @Body('driverId') driverId: UUID,
  ): Promise<any> {
    await this.acceptTripUseCase.execute(tripId, driverId);

    // Sin este emit el pasajero (mobile, Play Store) se queda eternamente
    // en "Buscando conductor..." aunque el trip esté aceptado en DB.
    // El RideEventsGateway entrega el evento al room ride:${tripId} donde
    // el pasajero se unió vía join:ride. La data de vehículo/placa no se
    // almacena server-side todavía — se mandan vacíos y el cliente muestra
    // placeholders; lo importante es mover el status a driver_assigned.
    let driverName = 'Conductor';
    try {
      const base =
        (await this.driverBaseModel.findOne({ driverId, isPrimary: true }).exec()) ??
        (await this.driverBaseModel.findOne({ driverId }).exec());
      if (base?.name) driverName = base.name;
    } catch (err: any) {
      this.logger.warn(`No se pudo resolver nombre del conductor ${driverId}: ${err?.message}`);
    }

    this.eventsGateway.notifyDriverAccepted(tripId, {
      name:    driverName,
      vehicle: '',
      plate:   '',
      rating:  5.0,
    });

    return { message: 'Trip accepted' };
  }

  /**
   * Cancelar trip. Mobile (Play Store) llama PATCH /transport/:rideId/cancel
   * desde ActiveRideScreen.handleCancel; sin este endpoint la app mostraba
   * "Error: No se pudo cancelar el viaje" porque el server devolvía 404.
   */
  @Patch(':tripId/cancel')
  async cancelTrip(
    @Param('tripId') tripId: UUID,
    @Body('reason') reason?: string,
  ): Promise<any> {
    const tripResult = await this.tripRepo.findById(tripId);
    if (tripResult.isErr()) {
      throw new InternalServerErrorException(tripResult.error.message);
    }
    if (!tripResult.value) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }
    const trip = tripResult.value;
    const cancelResult = trip.cancel();
    if (cancelResult.isErr()) {
      throw new BadRequestException(cancelResult.error.message);
    }
    const updateResult = await this.tripRepo.update(trip);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }

    // Avisar al conductor (si ya estaba asignado) y a observadores
    this.eventsGateway['server']?.to(`ride:${tripId}`).emit('ride:cancelled', {
      rideId:      tripId,
      reason:      reason ?? 'user_cancelled',
      cancelledAt: new Date(),
    });

    return { tripId, status: 'cancelled', cancelledAt: new Date() };
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
