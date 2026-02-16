import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventBus, DomainEvent } from '@going-monorepo-clean/shared-domain';

/**
 * Implementación de IEventBus usando NestJS EventEmitter2.
 * Los eventos se publican localmente y pueden ser escuchados por handlers
 * decorados con @OnEvent() en cualquier módulo del servicio.
 */
@Injectable()
export class NestJsEventBus implements IEventBus {
  private readonly logger = new Logger(NestJsEventBus.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(`Publishing event: ${event.eventName}`);
    this.eventEmitter.emit(event.eventName, event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
