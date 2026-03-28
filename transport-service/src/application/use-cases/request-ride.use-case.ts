import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Ride,
  Fare,
  GeoLocation,
  Coordinates,
  GeolocationService,
  Distance,
  IRideRepository,
  DistanceCalculatorService,
} from '../../domain/ports';
import { TokenService } from '../../infrastructure/token.service';
import { RideEventsGateway } from '../../infrastructure/gateways/ride-events.gateway';

/**
 * Request Ride Use Case
 */
@Injectable()
export class RequestRideUseCase {
  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    @Inject('GeolocationService')
    private readonly geoService: GeolocationService,
    private readonly distanceCalculator: DistanceCalculatorService,
    private readonly tokenService: TokenService,
    private readonly eventsGateway: RideEventsGateway,
  ) {}

  async execute(input: {
    userId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    serviceType?: string;
    modalidad?: string;
    scheduledAt?: Date;
    isPackage?: boolean;
    packageDescription?: string;
    recipientName?: string;
    recipientPhone?: string;
  }): Promise<any> {
    const {
      userId,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    } = input;

    // Create coordinates
    const pickupCoords = new Coordinates(pickupLatitude, pickupLongitude);
    const dropoffCoords = new Coordinates(dropoffLatitude, dropoffLongitude);

    // Create pickup location
    const pickupLocation = new GeoLocation({
      driverId: 'system',
      coordinates: pickupCoords,
      accuracy: 0,
      timestamp: new Date(),
    });

    // Estimate fare using real Haversine distance between pickup and dropoff
    const distResult = this.distanceCalculator.calculateDistance(pickupCoords, dropoffCoords);
    const estimatedDistance = Math.max(distResult.kilometers, 0.5); // min 0.5 km
    const estimatedDuration = Math.ceil((estimatedDistance / 40) * 60); // avg 40 km/h → minutes
    const surge = this.calculateSurge();

    const fare = Fare.calculate(
      estimatedDistance,
      estimatedDuration,
      surge,
      2.5, // base fare
      0.5, // per km
      0.1 // per minute
    );

    // Create ride
    const ride = new Ride({
      id: uuidv4(),
      userId,
      pickupLocation,
      dropoffLocation: dropoffCoords,
      fare,
    });

    // Generar tokens de identidad y link compartido
    const pickupToken = this.tokenService.generatePickupToken(ride.id, userId);
    const shareToken  = this.tokenService.generateShareToken(ride.id);

    // Enriquecer el ride con tokens y campos extra
    Object.assign(ride, {
      pickupToken,
      shareToken,
      serviceType:        input.serviceType ?? 'suv',
      modalidad:          input.modalidad ?? 'compartido',
      scheduledAt:        input.scheduledAt,
      totalDistanceKm:    estimatedDistance,
      isPackage:          input.isPackage ?? false,
      packageDescription: input.packageDescription,
      recipientName:      input.recipientName,
      recipientPhone:     input.recipientPhone,
    });

    // Save to database
    let savedRide: typeof ride;
    try {
      savedRide = await this.rideRepo.create(ride);
    } catch (err: any) {
      throw new Error(`No se pudo crear el viaje: ${err?.message ?? 'error desconocido'}`);
    }

    // Registrar ruta en el gateway para cálculo de progreso
    this.eventsGateway.registerRoute(
      ride.id,
      pickupLatitude, pickupLongitude,
      dropoffLatitude, dropoffLongitude,
    );

    // Calculate ETA to nearby drivers
    const eta = this.geoService.estimateEta(
      pickupLocation,
      pickupCoords,
      40 // average speed
    );

    const baseUrl = process.env.APP_URL ?? 'https://going.com.ec';

    return {
      rideId: savedRide.id,
      userId: savedRide.userId,
      status: savedRide.status,
      pickupLocation:  { latitude: pickupLatitude,  longitude: pickupLongitude },
      dropoffLocation: { latitude: dropoffLatitude, longitude: dropoffLongitude },
      fare:            fare.toObject(),
      eta,
      requestedAt:     savedRide.requestedAt,
      scheduledAt:     input.scheduledAt,
      // Tokens para el pasajero/remitente
      pickupToken,
      shareUrl: `${baseUrl}/tracking?t=${shareToken}`,
    };
  }

  /**
   * Calculate surge pricing based on demand
   */
  private calculateSurge(): number {
    // Simple implementation - could be enhanced with real demand data
    const hour = new Date().getHours();

    // Peak hours: 8-9am, 5-7pm
    if ((hour >= 8 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.5; // 50% surge
    }

    // Normal hours
    return 1.0;
  }
}
