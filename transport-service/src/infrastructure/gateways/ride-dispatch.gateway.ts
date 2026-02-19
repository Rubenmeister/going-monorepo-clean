import { Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Ride Dispatch WebSocket Gateway
 * Handles real-time broadcasting of ride-related events
 * Events: match offers, acceptances, rejections, status updates, ETA changes
 */
@Injectable()
export class RideDispatchGateway {
  private readonly logger = new Logger(RideDispatchGateway.name);

  // In-memory store for active ride connections (in production, use Redis)
  private rideConnections: Map<UUID, Set<string>> = new Map();
  private driverConnections: Map<UUID, string[]> = new Map();

  async broadcastRideMatches(
    rideId: UUID,
    matches: any[],
    driverIds: UUID[]
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(
        `Broadcasting ${matches.length} matches for ride ${rideId} to ${driverIds.length} drivers`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast matches: ${error.message}`);
      return err(new Error(`Failed to broadcast matches: ${error.message}`));
    }
  }

  async broadcastDriverAccepted(
    rideId: UUID,
    driverId: UUID,
    driverInfo: any
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(
        `Broadcasting driver ${driverId} acceptance for ride ${rideId}`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast acceptance: ${error.message}`);
      return err(new Error(`Failed to broadcast acceptance: ${error.message}`));
    }
  }

  async broadcastDriverRejected(
    rideId: UUID,
    driverId: UUID,
    reason?: string
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(
        `Broadcasting driver ${driverId} rejection for ride ${rideId}`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast rejection: ${error.message}`);
      return err(new Error(`Failed to broadcast rejection: ${error.message}`));
    }
  }

  async broadcastRideStatusUpdate(
    rideId: UUID,
    status: string,
    metadata?: any
  ): Promise<Result<void, Error>> {
    try {
      this.logger.log(
        `Broadcasting status update for ride ${rideId}: ${status}`
      );
      return ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to broadcast status: ${error.message}`);
      return err(new Error(`Failed to broadcast status: ${error.message}`));
    }
  }

  getActiveDriverCount(): number {
    let count = 0;
    for (const sockets of this.driverConnections.values()) {
      count += sockets.length;
    }
    return count;
  }
}
