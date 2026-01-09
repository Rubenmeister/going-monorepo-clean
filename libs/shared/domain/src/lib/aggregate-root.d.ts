import { BaseEntity } from './base.entity';
export declare abstract class AggregateRoot<T> extends BaseEntity<T> {
    private _domainEvents;
    get domainEvents(): any[];
    protected addDomainEvent(domainEvent: any): void;
    clearEvents(): void;
}
