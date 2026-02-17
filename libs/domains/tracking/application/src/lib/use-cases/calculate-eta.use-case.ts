import { Injectable, BadRequestException } from '@nestjs/common';
import { Geofence } from '@going-monorepo-clean/domains-tracking-core';
import { CalculateEtaDto, EtaResultDto } from '../dto/calculate-eta.dto';

const DEFAULT_SPEED_KMH = 30;

@Injectable()
export class CalculateEtaUseCase {
  async execute(dto: CalculateEtaDto): Promise<EtaResultDto> {
    const distanceKm = Geofence.haversineKm(
      dto.originLatitude,
      dto.originLongitude,
      dto.destinationLatitude,
      dto.destinationLongitude,
    );

    const speed = dto.averageSpeedKmh ?? DEFAULT_SPEED_KMH;
    if (speed <= 0) {
      throw new BadRequestException('Average speed must be greater than 0');
    }

    const estimatedHours = distanceKm / speed;
    const estimatedMinutes = Math.round(estimatedHours * 60 * 10) / 10; // 1 decimal

    return {
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      estimatedMinutes,
      averageSpeedKmh: speed,
    };
  }
}
