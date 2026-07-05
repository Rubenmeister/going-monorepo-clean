import { Injectable, Inject, BadRequestException } from '@nestjs/common';
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
import { resolveCityWithBuffer } from '@going-platform/pricing';

/** Buffer (km) sobre el radius de cada ciudad para la cobertura compartida. */
const SHARED_COVERAGE_BUFFER_KM = 5;

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
    /**
     * Status inicial del ride. 'scheduled' para reservas (viaje a futuro que
     * aún no busca conductor). undefined → default 'requested' (inmediato).
     */
    initialStatus?: string;
    /** Precio garantizado fijado al reservar (solo viajes programados). */
    lockedFare?: number;
    /**
     * Método de pago del viaje. 'corporate' = facturación mensual a la empresa;
     * la plataforma igual le acredita al conductor su 80% en el payout semanal
     * (facturación separada empresa↔conductor). Si no se especifica, el método
     * se resuelve al cobrar (efectivo/tarjeta/etc.).
     */
    paymentMethod?: string;
  }): Promise<any> {
    const {
      userId,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    } = input;

    // Restricción geográfica para viajes compartidos: pickup Y dropoff deben
    // estar dentro de la cobertura (ciudad de la tabla + buffer de 5 km).
    // Los viajes privados/SUV/SUVXL/envíos no aplican esta restricción.
    const modalidad = input.modalidad ?? 'compartido';
    if (modalidad === 'compartido') {
      const pickupCity = resolveCityWithBuffer(
        pickupLatitude, pickupLongitude, SHARED_COVERAGE_BUFFER_KM,
      );
      const dropoffCity = resolveCityWithBuffer(
        dropoffLatitude, dropoffLongitude, SHARED_COVERAGE_BUFFER_KM,
      );
      if (!pickupCity || !dropoffCity) {
        const out = !pickupCity ? 'el origen' : 'el destino';
        throw new BadRequestException(
          `${out} está fuera de la cobertura compartida (a más de ${SHARED_COVERAGE_BUFFER_KM} km de una localidad). Solicita un viaje privado o cambia el punto.`,
        );
      }
    }

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

    // Precio garantizado del Excel (lockedFare que manda el webapp con lo que el
    // pasajero cotizó) → tarifa FIJA. Si no viene, taxímetro por distancia
    // (urbano/inmediato sin cotización previa). Así la pantalla de búsqueda y el
    // cobro muestran el MISMO precio que se vio al reservar.
    const fare =
      input.lockedFare != null && input.lockedFare > 0
        ? Fare.fixed(input.lockedFare)
        : Fare.calculate(
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

    // Generar tokens de identidad y link compartido.
    //   - pickupToken: QR largo (HMAC firmado) para verificación criptográfica.
    //   - pickupCode:  PIN 6 dígitos para verificación manual (lo que el driver
    //                  tipea cuando el QR no es práctico — el caso común MVP).
    const pickupToken = this.tokenService.generatePickupToken(ride.id, userId);
    const pickupCode  = this.tokenService.generateDeliveryToken(ride.id);
    const shareToken  = this.tokenService.generateShareToken(ride.id);

    // Enriquecer el ride con tokens y campos extra
    Object.assign(ride, {
      pickupToken,
      pickupCode,
      shareToken,
      serviceType:        input.serviceType ?? 'suv',
      modalidad:          input.modalidad ?? 'compartido',
      scheduledAt:        input.scheduledAt,
      totalDistanceKm:    estimatedDistance,
      // Reserva programada: el viaje queda "en agenda" sin buscar conductor.
      ...(input.initialStatus ? { status: input.initialStatus } : {}),
      ...(input.lockedFare != null ? { lockedFare: input.lockedFare } : {}),
      ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
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
      lockedFare:      input.lockedFare,
      // Tokens para el pasajero/remitente
      pickupToken,
      pickupCode,
      shareUrl: `${baseUrl}/tracking/live/${shareToken}`,
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
