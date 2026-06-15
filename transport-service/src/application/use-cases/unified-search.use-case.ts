import { Injectable, Logger, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PricingService,
  classifyRoute,
  getFare,
  getPrivateFare,
  getDynamicSurchargeRate,
  type ClientSegment,
} from 'pricing';
import type {
  SearchQueryDto,
  SearchResponseDto,
  OnDemandOption,
  SearchRouteInfo,
  ScheduledOption,
  AlternativeSchedule,
  CoverageStatus,
} from '../../api/dtos/search-query.dto';
import { ScheduledTripService } from '../scheduled-trip.service';

type VehicleType = 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'minibus' | 'bus';

/**
 * UnifiedSearchUseCase — el "Buscar viaje" que auto-resuelve la modalidad.
 *
 * Matriz espacio-temporal:
 *   urbano + inmediato        → ride-hailing dinámico (tarifa por tiempo/feriado)
 *   urbano + agendado         → reserva urbana (Fase 2)
 *   interurbano + inmediato   → viaje privado interurbano (tarifa FARES + dinámico)
 *   interurbano + agendado    → cupos compartidos en calendario (Fase 2)
 *   corredor aeropuerto       → tarifa fija de aeropuerto
 *
 * Pricing: siempre vía libs/pricing (FARES = tabla autoritativa) para que la
 * cotización del buscador y el cobro nunca difieran.
 */
@Injectable()
export class UnifiedSearchUseCase {
  private readonly logger = new Logger(UnifiedSearchUseCase.name);

  constructor(
    private readonly pricing: PricingService,
    @Optional() private readonly scheduledTrips?: ScheduledTripService,
  ) {}

  async execute(input: SearchQueryDto): Promise<SearchResponseDto> {
    const cls = classifyRoute(
      input.pickup.lat,
      input.pickup.lng,
      input.destination.lat,
      input.destination.lng,
    );

    const temporalPreference = input.temporalPreference ?? 'immediate';
    const clientSegment: ClientSegment = input.clientSegment ?? 'public';
    const vehicleType = (input.vehicleType ?? 'suv') as VehicleType;
    const dateTime = input.scheduledDateTime
      ? new Date(input.scheduledDateTime)
      : new Date();

    const route: Omit<SearchRouteInfo, 'coverageStatus'> = {
      routeClass: cls.routeClass,
      isIntercity: cls.isIntercity,
      isAirportCorridor: cls.isAirportCorridor,
      originCity: cls.originCity,
      originLabel: cls.originLabel,
      destinationCity: cls.destinationCity,
      destinationLabel: cls.destinationLabel,
      distanceKm: cls.distanceKm,
      estimatedDurationMinutes: cls.estimatedDurationMinutes,
      inCoverage: cls.routeClass !== 'out_of_coverage',
    };

    const onDemandOptions: OnDemandOption[] = [];
    const notices: string[] = [];
    let scheduledOptions: ScheduledOption[] | undefined;
    let alternativeSchedules: AlternativeSchedule[] | undefined;

    switch (cls.routeClass) {
      case 'out_of_coverage':
        notices.push(
          'Una de las ubicaciones está fuera de nuestra zona de cobertura actual.',
        );
        break;

      case 'urban': {
        // Ride-hailing urbano con tarifa dinámica (hora pico / feriado / noche).
        const surgeMultiplier = 1 + getDynamicSurchargeRate(dateTime, 'privado');
        const fare = this.pricing.calculate({
          serviceType: 'transport',
          distanceKm: cls.distanceKm,
          durationMinutes: cls.estimatedDurationMinutes,
          surgeMultiplier,
        });
        onDemandOptions.push({
          serviceType: 'urban_ride',
          label: 'Going',
          description: `Viaje en ${cls.originLabel} · ${cls.distanceKm} km aprox.`,
          price: fare.total,
          currency: fare.currency,
          estimatedEtaMinutes: cls.estimatedDurationMinutes,
          breakdown: { ...fare.breakdown, surgeMultiplier },
        });
        if (temporalPreference === 'scheduled') {
          notices.push(
            'La reserva urbana programada estará disponible muy pronto.',
          );
        }
        break;
      }

      case 'airport_corridor': {
        // Tarifa fija de aeropuerto (compartido por persona) desde FARES.
        const airportFare = getFare(cls.originCity!, cls.destinationCity!);
        if (airportFare != null) {
          onDemandOptions.push({
            serviceType: 'airport_transfer',
            label: 'Going al Aeropuerto',
            description: `${cls.originLabel} ⇄ ${cls.destinationLabel} · tarifa fija por persona`,
            price: airportFare,
            currency: 'USD',
            estimatedEtaMinutes: cls.estimatedDurationMinutes,
            breakdown: { tarifaFija: airportFare },
          });
        } else {
          notices.push(
            `Aún no tenemos tarifa de aeropuerto configurada para ${cls.originLabel} ⇄ ${cls.destinationLabel}.`,
          );
        }
        notices.push(
          'El viaje privado al aeropuerto se cotiza por zona de Quito (próximamente en el buscador).',
        );
        break;
      }

      case 'intercity': {
        // Viaje privado interurbano inmediato: base FARES + dinámico.
        const sharedPerSeat = getFare(cls.originCity!, cls.destinationCity!);
        if (sharedPerSeat == null) {
          notices.push(
            `Aún no operamos la ruta ${cls.originLabel} → ${cls.destinationLabel}. ` +
              `Cuando la habilitemos publicaremos los días y horas de salida y regreso.`,
          );
        } else {
          const privateBase = getPrivateFare(sharedPerSeat, vehicleType);
          const fare = this.pricing.calcIntercityFare({
            basePrice: privateBase,
            mode: 'privado',
            serviceDateTime: dateTime,
            clientSegment,
          });
          onDemandOptions.push({
            serviceType: 'intercity_private_immediate',
            label: 'Intercity Privado',
            description: `${cls.originLabel} → ${cls.destinationLabel} · vehículo dedicado (${vehicleType.toUpperCase()})`,
            price: fare.total,
            currency: fare.currency,
            estimatedEtaMinutes: cls.estimatedDurationMinutes,
            vehicleType,
            breakdown: fare.breakdown,
          });
        }

        // Cupos de viaje compartido programado (asientos en calendario).
        if (this.scheduledTrips) {
          const res = await this.scheduledTrips.findOptions(
            cls.originCity!,
            cls.destinationCity!,
            dateTime,
          );
          scheduledOptions = res.scheduledOptions;
          alternativeSchedules = res.alternativeSchedules;
          if (
            scheduledOptions.length === 0 &&
            alternativeSchedules.length > 0
          ) {
            notices.push(
              'No hay salidas compartidas a esa hora; te mostramos horarios cercanos disponibles.',
            );
          } else if (
            scheduledOptions.length === 0 &&
            alternativeSchedules.length === 0
          ) {
            notices.push(
              `Aún no hay viajes compartidos programados en ${cls.originLabel} → ${cls.destinationLabel}. ` +
                `Cuando se abran verás aquí los días y horas de salida y regreso.`,
            );
          }
        }
        break;
      }
    }

    // Estado de cobertura: 'route_not_yet' cuando la zona está cubierta pero la
    // ruta no devolvió ninguna opción (ni inmediata ni programada) → la app
    // muestra "ruta todavía no disponible + días/horas al habilitarse".
    const coverageStatus: CoverageStatus =
      cls.routeClass === 'out_of_coverage'
        ? 'out_of_coverage'
        : onDemandOptions.length === 0 && (scheduledOptions?.length ?? 0) === 0
          ? 'route_not_yet'
          : 'available';

    return {
      searchId: uuidv4(),
      route: { ...route, coverageStatus },
      temporalPreference,
      onDemandOptions,
      scheduledOptions,
      alternativeSchedules,
      notices,
    };
  }
}
