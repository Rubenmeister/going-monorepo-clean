import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Schedule, IScheduleRepository } from '@going-monorepo-clean/domains-transport-core';
import { CreateScheduleDto } from '../dto/create-schedule.dto';

@Injectable()
export class CreateScheduleUseCase {
  constructor(
    @Inject(IScheduleRepository)
    private readonly scheduleRepo: IScheduleRepository,
  ) {}

  async execute(dto: CreateScheduleDto): Promise<{ id: string }> {
    const scheduleResult = Schedule.create({
      routeId: dto.routeId,
      vehicleId: dto.vehicleId,
      driverId: dto.driverId,
      serviceType: dto.serviceType,
      departureTime: dto.departureTime,
      arrivalTime: dto.arrivalTime,
      days: dto.days,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
    });

    if (scheduleResult.isErr()) {
      throw new InternalServerErrorException(scheduleResult.error.message);
    }

    const schedule = scheduleResult.value;
    const saveResult = await this.scheduleRepo.save(schedule);
    if (saveResult.isErr()) throw new InternalServerErrorException(saveResult.error.message);

    return { id: schedule.id };
  }
}
