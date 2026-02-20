/**
 * Location Stream WebSocket Gateway
 * Handles real-time location updates via WebSocket
 * Broadcasts driver locations to dashboard clients in real-time
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnect,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { LocationService } from '../../application/services/location.service';

interface LocationUpdatePayload {
  driverId: string;
  vehicleId: string;
  companyId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

@Injectable()
@WebSocketGateway({
  namespace: 'locations',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:4200'],
    credentials: true,
  },
})
export class LocationStreamGateway
  implements OnGatewayInit, OnGatewayConnect, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationStreamGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // companyId -> socketIds

  constructor(private readonly locationService: LocationService) {}

  afterInit(server: Server) {
    this.logger.log('Location Stream WebSocket Gateway initialized');
  }

  handleConnect(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from all company rooms
    for (const [companyId, socketIds] of this.connectedClients.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
      }
    }
  }

  /**
   * Subscribe to real-time location updates for a company
   * Event: 'subscribe'
   * Payload: { companyId: string }
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string }
  ): void {
    if (!data.companyId) {
      throw new WsException('Company ID is required');
    }

    const { companyId } = data;

    // Register client for this company
    if (!this.connectedClients.has(companyId)) {
      this.connectedClients.set(companyId, new Set());
    }
    this.connectedClients.get(companyId)!.add(client.id);

    // Join Socket.io room for company
    client.join(`company:${companyId}`);

    this.logger.debug(`Client ${client.id} subscribed to company ${companyId}`);

    // Send confirmation
    client.emit('subscribed', {
      companyId,
      timestamp: new Date(),
    });
  }

  /**
   * Unsubscribe from location updates
   * Event: 'unsubscribe'
   * Payload: { companyId: string }
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string }
  ): void {
    const { companyId } = data;

    if (this.connectedClients.has(companyId)) {
      this.connectedClients.get(companyId)!.delete(client.id);
    }

    client.leave(`company:${companyId}`);

    this.logger.debug(
      `Client ${client.id} unsubscribed from company ${companyId}`
    );
  }

  /**
   * Receive real-time location update from driver app
   * Event: 'location:update'
   * Payload: LocationUpdatePayload
   */
  @SubscribeMessage('location:update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdatePayload
  ): Promise<void> {
    try {
      // Validate payload
      if (
        !data.driverId ||
        !data.vehicleId ||
        !data.companyId ||
        data.latitude === undefined ||
        data.longitude === undefined
      ) {
        throw new WsException('Missing required location data');
      }

      // Record location in database
      const location = await this.locationService.recordLocation(
        data.companyId,
        {
          driverId: data.driverId,
          vehicleId: data.vehicleId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
        }
      );

      // Broadcast to all clients in this company room
      this.server.to(`company:${data.companyId}`).emit('location:updated', {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        timestamp: location.timestamp,
      });

      // Acknowledge receipt
      client.emit('location:ack', {
        driverId: data.driverId,
        timestamp: new Date(),
        stored: true,
      });

      this.logger.debug(
        `Location update recorded for driver ${data.driverId} in company ${data.companyId}`
      );
    } catch (error) {
      this.logger.error(`Failed to handle location update: ${error}`);
      client.emit('location:error', {
        message: 'Failed to process location update',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Request all current locations for a company
   * Event: 'locations:request-all'
   * Payload: { companyId: string }
   */
  @SubscribeMessage('locations:request-all')
  async handleRequestAllLocations(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string }
  ): Promise<void> {
    try {
      const locations =
        await this.locationService.getAllDriversCurrentLocations(
          data.companyId
        );

      const simpleLocations = locations.map((loc) => ({
        driverId: loc.driverId,
        vehicleId: loc.vehicleId,
        latitude: loc.coordinates.coordinates[1],
        longitude: loc.coordinates.coordinates[0],
        speed: loc.metadata?.speed,
        heading: loc.metadata?.heading,
        timestamp: loc.timestamp,
      }));

      client.emit('locations:all', {
        companyId: data.companyId,
        locations: simpleLocations,
        count: simpleLocations.length,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Sent ${simpleLocations.length} locations to client ${client.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to get all locations: ${error}`);
      client.emit('locations:error', {
        message: 'Failed to fetch locations',
      });
    }
  }

  /**
   * Broadcast location update to all clients in a company
   * Used by location service to push updates
   */
  broadcastLocationUpdate(
    companyId: string,
    update: {
      driverId: string;
      vehicleId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      timestamp: Date;
    }
  ): void {
    this.server.to(`company:${companyId}`).emit('location:updated', update);
  }

  /**
   * Get count of connected clients for a company
   */
  getConnectedClientCount(companyId: string): number {
    return this.connectedClients.get(companyId)?.size || 0;
  }

  /**
   * Get total connected clients across all companies
   */
  getTotalConnectedClients(): number {
    let total = 0;
    for (const socketIds of this.connectedClients.values()) {
      total += socketIds.size;
    }
    return total;
  }
}
