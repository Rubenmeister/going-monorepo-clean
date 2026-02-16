import { Injectable, Logger } from '@nestjs/common';
import { Result, ok } from 'neverthrow';
import { IMaskedPhoneService, MaskedPhone } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class LogMaskedPhoneService implements IMaskedPhoneService {
  private readonly logger = new Logger(LogMaskedPhoneService.name);
  private counter = 1000;

  async assignTemporaryPhone(props: {
    realPhone: string;
    assignedTo: UUID;
    assignedFor: UUID;
    tripId: UUID;
    durationMinutes: number;
  }): Promise<Result<MaskedPhone, Error>> {
    this.counter++;
    const maskedNumber = `+1-555-${String(this.counter).padStart(4, '0')}`;

    this.logger.log(
      `[STUB] Assigned masked phone ${maskedNumber} for trip ${props.tripId} ` +
      `(real: ${props.realPhone || 'N/A'}, to: ${props.assignedTo}, for: ${props.assignedFor})`,
    );

    const result = MaskedPhone.create({
      realPhone: props.realPhone || '+0000000000',
      maskedNumber,
      assignedTo: props.assignedTo,
      assignedFor: props.assignedFor,
      tripId: props.tripId,
      durationMinutes: props.durationMinutes,
    });

    return result;
  }

  async deactivateForTrip(tripId: UUID): Promise<Result<void, Error>> {
    this.logger.log(`[STUB] Deactivated masked phones for trip ${tripId}`);
    return ok(undefined);
  }

  async findActiveByTrip(tripId: UUID): Promise<Result<MaskedPhone[], Error>> {
    this.logger.log(`[STUB] Finding active masked phones for trip ${tripId}`);
    return ok([]);
  }
}
