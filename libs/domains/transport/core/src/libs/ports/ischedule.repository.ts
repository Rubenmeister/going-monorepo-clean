import { Result } from 'neverthrow';
import { Schedule, DayOfWeek, ServiceType } from '../entities/schedule.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IScheduleRepository = Symbol('IScheduleRepository');

export interface IScheduleRepository {
  save(schedule: Schedule): Promise<Result<void, Error>>;
  update(schedule: Schedule): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Schedule | null, Error>>;
  findByRouteId(routeId: UUID): Promise<Result<Schedule[], Error>>;
  findByVehicleId(vehicleId: UUID): Promise<Result<Schedule[], Error>>;
  findByDriverId(driverId: UUID): Promise<Result<Schedule[], Error>>;
  findActiveByDayAndServiceType(
    day: DayOfWeek,
    serviceType: ServiceType,
  ): Promise<Result<Schedule[], Error>>;
}
