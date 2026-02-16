/**
 * Interfaz base para eventos de dominio.
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;
}

/**
 * Puerto del Event Bus para publicación de eventos de dominio.
 * Permite desacoplar los use cases de la infraestructura de mensajería.
 */
export const IEventBus = Symbol('IEventBus');

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
