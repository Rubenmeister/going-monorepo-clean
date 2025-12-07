import { BaseEntity } from './base.entity';

export abstract class AggregateRoot<T> extends BaseEntity<T> {
  private _domainEvents: any[] = [];

  get domainEvents(): any[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: any): void {
    // Add logic to handle domain events
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
