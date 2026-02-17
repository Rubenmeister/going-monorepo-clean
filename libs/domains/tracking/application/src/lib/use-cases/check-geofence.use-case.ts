import { Injectable, BadRequestException } from '@nestjs/common';
import { Location, Geofence } from '@going-monorepo-clean/domains-tracking-core';
import { CheckGeofenceDto, CheckGeofenceResultDto } from '../dto/check-geofence.dto';

@Injectable()
export class CheckGeofenceUseCase {
  async execute(dto: CheckGeofenceDto): Promise<CheckGeofenceResultDto> {
    const pointResult = Location.create({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    if (pointResult.isErr()) {
      throw new BadRequestException(pointResult.error.message);
    }

    const centerResult = Location.create({
      latitude: dto.centerLatitude,
      longitude: dto.centerLongitude,
    });
    if (centerResult.isErr()) {
      throw new BadRequestException(centerResult.error.message);
    }

    const geofenceResult = Geofence.create({
      center: centerResult.value,
      radiusKm: dto.radiusKm,
      label: dto.label,
    });
    if (geofenceResult.isErr()) {
      throw new BadRequestException(geofenceResult.error.message);
    }

    const geofence = geofenceResult.value;
    const point = pointResult.value;

    return {
      isInside: geofence.contains(point),
      distanceKm: Math.round(geofence.distanceFromCenter(point) * 1000) / 1000,
      label: dto.label,
    };
  }
}
