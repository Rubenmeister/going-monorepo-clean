import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  RideRequest,
  IRideRequestRepository,
  IVehicleRepository,
  IDriverProfileRepository,
  IScheduleRepository,
  IMaskedPhoneService,
  VehicleAssignedEvent,
  Vehicle,
  SeatPosition,
} from '@going-monorepo-clean/domains-transport-core';
import { IEventBus, UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Algoritmo dinámico de asignación de vehículos.
 *
 * Factores de puntuación:
 * 1. Distancia del vehículo al pasajero (Haversine) — peso: 40%
 * 2. Tipo de vehículo solicitado coincide — peso: 25%
 * 3. Disponibilidad de asientos (y tipo de asiento) — peso: 15%
 * 4. Rating del conductor — peso: 10%
 * 5. Prioridad FIFO (quien llamó primero) — peso: 10%
 *
 * Para viaje PRIVADO: se requiere vehículo con TODOS los asientos disponibles.
 * Para viaje COMPARTIDO: se requiere al menos passengersCount asientos libres.
 */

interface VehicleCandidate {
  vehicle: Vehicle;
  distanceKm: number;
  score: number;
  bestSeatNumber: number;
}

@Injectable()
export class AssignVehicleUseCase {
  private readonly logger = new Logger(AssignVehicleUseCase.name);

  private static readonly SEARCH_RADIUS_KM = 15;
  private static readonly WEIGHT_DISTANCE = 0.40;
  private static readonly WEIGHT_VEHICLE_TYPE = 0.25;
  private static readonly WEIGHT_SEAT_AVAILABILITY = 0.15;
  private static readonly WEIGHT_DRIVER_RATING = 0.10;
  private static readonly WEIGHT_PRIORITY = 0.10;

  constructor(
    @Inject(IRideRequestRepository)
    private readonly rideRequestRepo: IRideRequestRepository,
    @Inject(IVehicleRepository)
    private readonly vehicleRepo: IVehicleRepository,
    @Inject(IDriverProfileRepository)
    private readonly driverProfileRepo: IDriverProfileRepository,
    @Inject(IMaskedPhoneService)
    private readonly maskedPhoneService: IMaskedPhoneService,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(rideRequestId: UUID): Promise<{
    vehicleId: string;
    driverId: string;
    seatNumber: number;
    maskedPhoneDriver: string;
    maskedPhonePassenger: string;
  }> {
    // 1. Obtener la solicitud
    const requestResult = await this.rideRequestRepo.findById(rideRequestId);
    if (requestResult.isErr()) throw new Error(requestResult.error.message);
    const rideRequest = requestResult.value;
    if (!rideRequest) throw new NotFoundException('Ride request not found');

    // 2. Marcar como buscando
    const searching = rideRequest.markSearching();
    await this.rideRequestRepo.update(searching);

    // 3. Buscar vehículos cercanos del tipo solicitado
    const vehiclesResult = await this.vehicleRepo.findAvailableVehiclesNearLocation(
      rideRequest.origin.latitude,
      rideRequest.origin.longitude,
      AssignVehicleUseCase.SEARCH_RADIUS_KM,
      rideRequest.vehicleTypePreference.value,
    );
    if (vehiclesResult.isErr()) throw new Error(vehiclesResult.error.message);
    let vehicles = vehiclesResult.value;

    // 4. Si no hay del tipo exacto, buscar de cualquier tipo compatible
    if (vehicles.length === 0) {
      const allVehiclesResult = await this.vehicleRepo.findAvailableVehiclesNearLocation(
        rideRequest.origin.latitude,
        rideRequest.origin.longitude,
        AssignVehicleUseCase.SEARCH_RADIUS_KM,
      );
      if (allVehiclesResult.isErr()) throw new Error(allVehiclesResult.error.message);
      vehicles = allVehiclesResult.value;
    }

    // 5. Filtrar por disponibilidad de asientos
    const filtered = vehicles.filter(v => {
      if (rideRequest.isPrivate()) {
        // Viaje privado: todos los asientos deben estar libres
        return v.getAvailableSeats().length === v.seats.length;
      }
      // Viaje compartido: al menos passengersCount asientos libres
      return v.getAvailableSeats().length >= rideRequest.passengersCount;
    });

    if (filtered.length === 0) {
      const noDriver = rideRequest.noDriverFound();
      await this.rideRequestRepo.update(noDriver);
      throw new NotFoundException('No vehicles available matching criteria');
    }

    // 6. Calcular puntuación para cada candidato
    const candidates = await this.scoreCandidates(filtered, rideRequest);

    // 7. Ordenar por puntuación descendente (mayor = mejor)
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];

    // 8. Asignar asiento en el vehículo
    const assignSeatResult = best.vehicle.assignSeat(best.bestSeatNumber, rideRequest.passengerId);
    if (assignSeatResult.isErr()) throw new Error(assignSeatResult.error.message);
    await this.vehicleRepo.update(assignSeatResult.value);

    // 9. Actualizar ride request
    const assignResult = rideRequest.assignVehicle(
      best.vehicle.id,
      best.vehicle.driverId,
      best.bestSeatNumber,
    );
    if (assignResult.isErr()) throw new Error(assignResult.error.message);
    await this.rideRequestRepo.update(assignResult.value);

    // 10. Asignar teléfonos temporales (conductor y pasajero)
    const driverProfileResult = await this.driverProfileRepo.findByUserId(best.vehicle.driverId);
    const driverProfile = driverProfileResult.isOk() ? driverProfileResult.value : null;
    const driverPhone = driverProfile?.phone ?? '';

    let maskedPhoneDriver = '';
    let maskedPhonePassenger = '';

    try {
      const driverMasked = await this.maskedPhoneService.assignTemporaryPhone({
        realPhone: driverPhone,
        assignedTo: best.vehicle.driverId,
        assignedFor: rideRequest.passengerId,
        tripId: rideRequest.id,
        durationMinutes: 120,
      });
      if (driverMasked.isOk()) maskedPhoneDriver = driverMasked.value.maskedNumber;

      const passengerMasked = await this.maskedPhoneService.assignTemporaryPhone({
        realPhone: '',
        assignedTo: rideRequest.passengerId,
        assignedFor: best.vehicle.driverId,
        tripId: rideRequest.id,
        durationMinutes: 120,
      });
      if (passengerMasked.isOk()) maskedPhonePassenger = passengerMasked.value.maskedNumber;
    } catch (error) {
      this.logger.warn(`Masked phone assignment failed: ${error.message}`);
    }

    // 11. Publicar evento
    try {
      await this.eventBus.publish(
        new VehicleAssignedEvent(
          rideRequest.id,
          best.vehicle.id,
          best.vehicle.driverId,
          rideRequest.passengerId,
          best.bestSeatNumber,
          best.vehicle.type.value,
          rideRequest.rideType,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to publish VehicleAssignedEvent: ${error.message}`);
    }

    return {
      vehicleId: best.vehicle.id,
      driverId: best.vehicle.driverId,
      seatNumber: best.bestSeatNumber,
      maskedPhoneDriver,
      maskedPhonePassenger,
    };
  }

  private async scoreCandidates(
    vehicles: Vehicle[],
    rideRequest: RideRequest,
  ): Promise<VehicleCandidate[]> {
    const candidates: VehicleCandidate[] = [];

    for (const vehicle of vehicles) {
      const distanceKm = vehicle.currentLocation
        ? AssignVehicleUseCase.haversineKm(
            rideRequest.origin.latitude,
            rideRequest.origin.longitude,
            vehicle.currentLocation.latitude,
            vehicle.currentLocation.longitude,
          )
        : AssignVehicleUseCase.SEARCH_RADIUS_KM;

      // Factor 1: Distancia (menor distancia = mayor puntuación)
      const maxDist = AssignVehicleUseCase.SEARCH_RADIUS_KM;
      const distanceScore = Math.max(0, 1 - (distanceKm / maxDist));

      // Factor 2: Tipo de vehículo coincide
      const typeScore = vehicle.type.value === rideRequest.vehicleTypePreference.value ? 1.0 : 0.3;

      // Factor 3: Disponibilidad de asiento preferido
      let seatScore = 0;
      let bestSeat: number;
      if (rideRequest.seatPreference === SeatPosition.FRONT) {
        const frontSeats = vehicle.getAvailableFrontSeats();
        if (frontSeats.length > 0) {
          seatScore = 1.0;
          bestSeat = frontSeats[0].seatNumber;
        } else {
          const backSeats = vehicle.getAvailableBackSeats();
          seatScore = 0.5;
          bestSeat = backSeats[0]?.seatNumber ?? vehicle.getAvailableSeats()[0]?.seatNumber ?? 1;
        }
      } else {
        const backSeats = vehicle.getAvailableBackSeats();
        if (backSeats.length > 0) {
          seatScore = 1.0;
          bestSeat = backSeats[0].seatNumber;
        } else {
          const frontSeats = vehicle.getAvailableFrontSeats();
          seatScore = 0.5;
          bestSeat = frontSeats[0]?.seatNumber ?? vehicle.getAvailableSeats()[0]?.seatNumber ?? 1;
        }
      }

      // Factor 4: Rating del conductor
      const profileResult = await this.driverProfileRepo.findByUserId(vehicle.driverId);
      const driverRating = profileResult.isOk() && profileResult.value
        ? profileResult.value.rating / 5.0
        : 0.5;

      // Factor 5: FIFO - prioridad de la solicitud
      const priorityScore = Math.max(0, 1 - (rideRequest.priority / 100));

      // Cálculo ponderado final
      const score =
        (distanceScore * AssignVehicleUseCase.WEIGHT_DISTANCE) +
        (typeScore * AssignVehicleUseCase.WEIGHT_VEHICLE_TYPE) +
        (seatScore * AssignVehicleUseCase.WEIGHT_SEAT_AVAILABILITY) +
        (driverRating * AssignVehicleUseCase.WEIGHT_DRIVER_RATING) +
        (priorityScore * AssignVehicleUseCase.WEIGHT_PRIORITY);

      candidates.push({
        vehicle,
        distanceKm,
        score,
        bestSeatNumber: bestSeat,
      });
    }

    return candidates;
  }

  /**
   * Fórmula de Haversine para calcular distancia entre 2 puntos GPS en km.
   */
  public static haversineKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = AssignVehicleUseCase.toRad(lat2 - lat1);
    const dLon = AssignVehicleUseCase.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(AssignVehicleUseCase.toRad(lat1)) *
      Math.cos(AssignVehicleUseCase.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
