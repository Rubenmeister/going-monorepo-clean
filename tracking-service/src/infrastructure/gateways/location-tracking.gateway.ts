import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import {
  GeoLocation,
  DriverAvailability,
  Coordinates,
  IGeoLocationRepository,
  IDriverAvailabilityRepository,
} from '../../domain/ports';
import { WebSocketJwtService } from '@going-monorepo-clean/shared-infrastructure';

/**
 * Location Tracking Gateway
 * Handles real-time WebSocket connections for driver location tracking
 */
@WebSocketGateway({
  namespace: 'tracking',
  cors: {
    origin: (
      process.env.WEBSOCKET_CORS_ORIGINS ||
      process.env.CORS_ORIGINS ||
      'http://localhost:3000,http://localhost:3001'
    ).split(','),
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'],
})
export class LocationTrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationTrackingGateway.name);
  private driverConnections = new Map<string, string>(); // driverId -> socketId
  private tripRooms = new Map<string, Set<string>>(); // tripId -> Set<socketId>

  constructor(
    @Inject('IGeoLocationRepository')
    private geoLocationRepo: IGeoLocationRepository,
    @Inject('IDriverAvailabilityRepository')
    private availabilityRepo: IDriverAvailabilityRepository,
    private wsJwtService: WebSocketJwtService
  ) {}

  afterInit(server: Server) {
    this.logger.log('LocationTrackingGateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      // Validate JWT token from handshake
      const authResult = await this.wsJwtService.authenticateConnection(client);

      if (!authResult.isValid) {
        this.logger.warn(
          `Unauthorized WebSocket connection attempted: ${authResult.error}`
        );
        client.disconnect(true);
        return;
      }

      // Attach authenticated user to socket for later reference
      (client as any).authenticatedUser = {
        userId: authResult.userId,
        driverId: authResult.driverId,
        payload: authResult.payload,
      };

      this.logger.log(
        `Client connected and authenticated: ${client.id} (userId: ${authResult.userId})`
      );
    } catch (error) {
      this.logger.error(
        `Error during WebSocket connection: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const driverId = this.findDriverIdBySocketId(client.id);
    if (driverId) {
      this.driverConnections.delete(driverId);
      // Set driver offline
      this.availabilityRepo.setOffline(driverId);
      this.logger.log(`Driver disconnected: ${driverId}`);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Driver registers for location tracking
   * Sent by driver app on startup
   * Validates that authenticated user is registering for their own ID
   */
  @SubscribeMessage('driver:register')
  async handleDriverRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { driverId: string; latitude: number; longitude: number }
  ) {
    // Validate ownership: authenticated user must be the driver
    const authenticatedUser = (client as any).authenticatedUser;
    if (
      !authenticatedUser ||
      (authenticatedUser.driverId !== data.driverId &&
        authenticatedUser.userId !== data.driverId)
    ) {
      this.logger.warn(
        `Unauthorized driver registration attempt: user=${authenticatedUser?.userId} tried to register driver=${data.driverId}`
      );
      client.emit('error', { message: 'Unauthorized driver registration' });
      return;
    }

    this.driverConnections.set(data.driverId, client.id);
    this.logger.log(`Driver registered: ${data.driverId}`);

    // Create/update availability
    const coordinates = new Coordinates(data.latitude, data.longitude);
    const location = new GeoLocation({
      driverId: data.driverId,
      coordinates,
      accuracy: 10,
      timestamp: new Date(),
    });

    await this.geoLocationRepo.saveLocation(location);

    // Save availability
    const availability = new DriverAvailability({
      driverId: data.driverId,
      status: 'online',
      currentLocation: location,
      availableSeats: 4,
      serviceTypes: ['standard'],
      lastUpdate: new Date(),
    });

    await this.availabilityRepo.upsert(availability);
    client.emit('driver:registered', { success: true });
  }

  /**
   * Driver updates location
   * Sent every 5-10 seconds by driver app
   */
  @SubscribeMessage('driver:location:update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      driverId: string;
      latitude: number;
      longitude: number;
      accuracy: number;
      heading?: number;
      speed?: number;
    }
  ) {
    try {
      const coordinates = new Coordinates(data.latitude, data.longitude);
      const location = new GeoLocation({
        driverId: data.driverId,
        coordinates,
        accuracy: data.accuracy,
        heading: data.heading,
        speed: data.speed,
        timestamp: new Date(),
      });

      // Save location to Redis GEO index
      await this.geoLocationRepo.saveLocation(location);

      // Update availability location
      const availability = await this.availabilityRepo.findByDriverId(
        data.driverId
      );
      if (availability) {
        availability.updateLocation(location);
        await this.availabilityRepo.upsert(availability);
      }

      // Broadcast to all connected users in active trips
      this.broadcastLocationToTrips(data.driverId, {
        driverId: data.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(
        `Location updated for driver ${data.driverId}: (${data.latitude}, ${data.longitude})`
      );
    } catch (error) {
      this.logger.error(`Error updating location: ${error.message}`);
      client.emit('error', { message: 'Failed to update location' });
    }
  }

  /**
   * User starts tracking a trip
   * User joins WebSocket room for real-time updates
   */
  @SubscribeMessage('trip:start:tracking')
  async handleStartTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; userId: string; driverId: string }
  ) {
    const room = `trip:${data.tripId}`;
    client.join(room);

    // Add to trip room tracking
    if (!this.tripRooms.has(data.tripId)) {
      this.tripRooms.set(data.tripId, new Set());
    }
    this.tripRooms.get(data.tripId)!.add(client.id);

    this.logger.log(`User ${data.userId} started tracking trip ${data.tripId}`);

    // Notify everyone in the trip room
    this.server.to(room).emit('trip:tracking:started', {
      tripId: data.tripId,
      driverId: data.driverId,
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Driver ends trip
   * Close tracking session
   */
  @SubscribeMessage('trip:end:tracking')
  async handleEndTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; driverId: string }
  ) {
    const room = `trip:${data.tripId}`;

    // Notify all in room
    this.server.to(room).emit('trip:tracking:ended', {
      tripId: data.tripId,
      driverId: data.driverId,
      timestamp: new Date().toISOString(),
    });

    // Remove room
    if (this.tripRooms.has(data.tripId)) {
      const sockets = this.tripRooms.get(data.tripId)!;
      sockets.forEach((socketId) => {
        this.server.sockets.sockets.get(socketId)?.leave(room);
      });
      this.tripRooms.delete(data.tripId);
    }

    this.logger.log(`Trip tracking ended: ${data.tripId}`);
  }

  /**
   * Driver goes online
   */
  @SubscribeMessage('driver:status:online')
  async handleDriverOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { driverId: string; latitude: number; longitude: number }
  ) {
    await this.availabilityRepo.setOnline(data.driverId);
    this.logger.log(`Driver online: ${data.driverId}`);
  }

  /**
   * Driver goes busy (on a trip)
   */
  @SubscribeMessage('driver:status:busy')
  async handleDriverBusy(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string }
  ) {
    await this.availabilityRepo.setBusy(data.driverId);
    this.logger.log(`Driver busy: ${data.driverId}`);
  }

  /**
   * Driver goes offline
   */
  @SubscribeMessage('driver:status:offline')
  async handleDriverOffline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string }
  ) {
    await this.availabilityRepo.setOffline(data.driverId);
    this.driverConnections.delete(data.driverId);
    this.logger.log(`Driver offline: ${data.driverId}`);
  }

  /**
   * Broadcast location update to all users in a trip
   */
  private broadcastLocationToTrips(driverId: string, locationData: any): void {
    // Find all trips this driver is on
    for (const [tripId, socketIds] of this.tripRooms.entries()) {
      if (socketIds.size > 0) {
        const room = `trip:${tripId}`;
        this.server.to(room).emit('driver:location:updated', locationData);
      }
    }
  }

  /**
   * Find driver ID by socket ID
   */
  private findDriverIdBySocketId(socketId: string): string | null {
    for (const [driverId, connectedSocketId] of this.driverConnections) {
      if (connectedSocketId === socketId) {
        return driverId;
      }
    }
    return null;
  }

  /**
   * Emit location to specific trip
   */
  emitToTrip(tripId: string, event: string, data: any): void {
    this.server.to(`trip:${tripId}`).emit(event, data);
  }

  /**
   * Get connected drivers
   */
  getConnectedDrivers(): string[] {
    return Array.from(this.driverConnections.keys());
  }

  /**
   * Get active trips
   */
  getActiveTrips(): string[] {
    return Array.from(this.tripRooms.keys());
  }
}
