import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, IEventBus } from '../event-bus';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * In-memory EventBus implementation using NestJS EventEmitter2.
 * For production cross-service communication, replace with Redis/RabbitMQ transport.
 */
@Injectable()
export class InMemoryEventBus implements IEventBus {
  private readonly logger = new Logger(InMemoryEventBus.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(
      `Publishing event: ${event.eventName} | payload: ${JSON.stringify(event.payload)}`,
    );
    this.eventEmitter.emit(event.eventName, event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
