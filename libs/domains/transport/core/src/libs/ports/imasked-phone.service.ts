import { Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { MaskedPhone } from '../value-objects/masked-phone.vo';

export const IMaskedPhoneService = Symbol('IMaskedPhoneService');

export interface IMaskedPhoneService {
  assignTemporaryPhone(props: {
    realPhone: string;
    assignedTo: UUID;
    assignedFor: UUID;
    tripId: UUID;
    durationMinutes: number;
  }): Promise<Result<MaskedPhone, Error>>;

  deactivateForTrip(tripId: UUID): Promise<Result<void, Error>>;

  findActiveByTrip(tripId: UUID): Promise<Result<MaskedPhone[], Error>>;
}
