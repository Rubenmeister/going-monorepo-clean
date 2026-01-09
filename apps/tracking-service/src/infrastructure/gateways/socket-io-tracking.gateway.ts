import { Injectable } from '@nestjs/common';
import { IDriverLocationGateway, DriverLocation } from '@going-monorepo-clean/domains-tracking-core';
import { TrackingGateway } from '../../api/tracking.gateway';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class SocketIoLocationGateway implements IDriverLocationGateway {
  constructor(private trackingGateway: TrackingGateway) {}

  async broadcastLocation(location: DriverLocation): Promise<Result<void, Error>> {
    try {
      // Delegate to the WebSocket gateway
      this.trackingGateway.server?.emit('driverLocationUpdate', location.toPrimitives());
      return ok(undefined);
    } catch (error) {
      return err(new Error((error as Error).message));
    }
  }
}