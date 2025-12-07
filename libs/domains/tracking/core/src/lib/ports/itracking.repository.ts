import { Result } from 'neverthrow';
import { TrackingEvent } from '../entities/tracking-event.entity';

export const I_TRACKING_REPOSITORY = Symbol('ITrackingRepository');

export interface ITrackingRepository {
  save(event: TrackingEvent): Promise<Result<void, Error>>;
  findByParcelId(parcelId: string): Promise<Result<TrackingEvent[], Error>>;
}
