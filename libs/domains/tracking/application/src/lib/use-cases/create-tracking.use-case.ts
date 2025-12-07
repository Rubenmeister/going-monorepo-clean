import {
  ITrackingRepository,
  TrackingEvent,
} from '@going-monorepo-clean/domains-tracking-core';
import { Result, ok, err } from 'neverthrow';

export interface CreateTrackingEventDto {
  parcelId: string;
  status: string;
  location?: string;
  description?: string;
}

export class CreateTrackingEventUseCase {
  constructor(private readonly trackingRepo: ITrackingRepository) {}

  async execute(dto: CreateTrackingEventDto): Promise<Result<TrackingEvent, Error>> {
    const eventOrError = TrackingEvent.create({
      parcelId: dto.parcelId,
      status: dto.status,
      location: dto.location,
      description: dto.description,
    });

    if (eventOrError.isErr()) {
      return err(eventOrError.error);
    }

    const event = eventOrError.value;
    const saveResult = await this.trackingRepo.save(event);

    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    return ok(event);
  }
}
