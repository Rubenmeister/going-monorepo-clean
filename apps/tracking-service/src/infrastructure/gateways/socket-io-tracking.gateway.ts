import { Injectable } from '@nestjs/common';
import { IDriverLocationGateway } from '@myorg/domains/tracking/core';
import { DriverLocation } from '@myorg/domains/tracking/core';
import { TrackingGateway } from '../api/tracking.gateway';

@Injectable()
export class SocketIoLocationGateway implements IDriverLocationGateway {
  constructor(private trackingGateway: TrackingGateway) {}

  async broadcastLocation(location: DriverLocation): Promise<void> {
    // Llama al método del gateway para emitir la actualización
    this.trackingGateway.emitLocationUpdate(location);
  }
}