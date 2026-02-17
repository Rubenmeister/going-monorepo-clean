import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SendTemplateNotificationUseCase,
} from '@going-monorepo-clean/domains-notification-application';

/**
 * Listens for trip-related domain events and triggers template notifications.
 * Events are received via the in-memory event bus (EventEmitter2).
 * In production, replace with Redis Pub/Sub or RabbitMQ consumer.
 */
@Injectable()
export class TripNotificationListener {
  private readonly logger = new Logger(TripNotificationListener.name);

  constructor(
    private readonly sendTemplateNotification: SendTemplateNotificationUseCase,
  ) {}

  @OnEvent('tracking.driver.approaching_destination')
  async onDriverApproaching(event: {
    payload: {
      driverId: string;
      tripId: string;
      distanceKm: number;
      etaMinutes: number;
    };
  }) {
    this.logger.log(`Driver approaching destination for trip ${event.payload.tripId}`);
    try {
      await this.sendTemplateNotification.execute({
        userId: event.payload.tripId, // In production, resolve userId from tripId
        channel: 'PUSH',
        templateName: 'trip_driver_approaching',
        variables: {
          distanceKm: event.payload.distanceKm.toFixed(1),
          etaMinutes: event.payload.etaMinutes.toFixed(0),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send approaching notification: ${error}`);
    }
  }

  @OnEvent('tracking.driver.arrived_at_pickup')
  async onDriverArrived(event: {
    payload: {
      driverId: string;
      tripId: string;
    };
  }) {
    this.logger.log(`Driver arrived at pickup for trip ${event.payload.tripId}`);
    try {
      await this.sendTemplateNotification.execute({
        userId: event.payload.tripId,
        channel: 'PUSH',
        templateName: 'trip_driver_arrived',
        variables: {},
      });
    } catch (error) {
      this.logger.error(`Failed to send arrival notification: ${error}`);
    }
  }

  @OnEvent('trip.completed')
  async onTripCompleted(event: {
    payload: {
      userId: string;
      destination: string;
      amount: string;
      currency: string;
    };
  }) {
    this.logger.log(`Trip completed for user ${event.payload.userId}`);
    try {
      await this.sendTemplateNotification.execute({
        userId: event.payload.userId,
        channel: 'PUSH',
        templateName: 'trip_completed',
        variables: {
          destination: event.payload.destination,
          amount: event.payload.amount,
          currency: event.payload.currency,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send trip completed notification: ${error}`);
    }
  }

  @OnEvent('trip.cancelled')
  async onTripCancelled(event: {
    payload: {
      userId: string;
      reason: string;
    };
  }) {
    this.logger.log(`Trip cancelled for user ${event.payload.userId}`);
    try {
      await this.sendTemplateNotification.execute({
        userId: event.payload.userId,
        channel: 'PUSH',
        templateName: 'trip_cancelled',
        variables: { reason: event.payload.reason },
      });
    } catch (error) {
      this.logger.error(`Failed to send cancellation notification: ${error}`);
    }
  }
}
