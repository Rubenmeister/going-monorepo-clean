import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class MaskedPhoneAssignedEvent implements DomainEvent {
  readonly eventName = 'transport.masked-phone.assigned';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(
    public readonly tripId: string,
    public readonly assignedToUserId: string,
    public readonly maskedNumber: string,
  ) {
    this.occurredOn = new Date();
    this.payload = { tripId, assignedToUserId, maskedNumber };
  }
}
