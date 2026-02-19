import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Ride Dispatch Gateway
 * WebSocket server for real-time ride requests and dispatch
 */
@WebSocketGateway({
  namespace: 'rides',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class RideDispatchGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RideDispatchGateway.name);
  private driverConnections = new Map<string, string>(); // driverId -> socketId
  private rideRooms = new Map<string, Set<string>>(); // rideId -> Set<socketId>

  handleConnection(client: Socket) {
    this.logger.log(`Driver connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const driverId = this.findDriverIdBySocketId(client.id);
    if (driverId) {
      this.driverConnections.delete(driverId);
      this.logger.log(`Driver disconnected: ${driverId}`);
    }
  }

  /**
   * Driver registers for ride dispatch
   */
  @SubscribeMessage('driver:register')
  async handleDriverRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string; latitude: number; longitude: number }
  ) {
    this.driverConnections.set(data.driverId, client.id);
    this.logger.log(`Driver registered: ${data.driverId}`);
    client.emit('driver:registered', { success: true });
  }

  /**
   * Broadcast ride request to nearby drivers
   */
  broadcastRideRequest(rideId: string, rideData: any): void {
    this.server.emit('ride:requested', {
      rideId,
      ...rideData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify ride acceptance
   */
  notifyRideAccepted(rideId: string, driverId: string, driverData: any): void {
    this.server.emit('ride:accepted', {
      rideId,
      driverId,
      driver: driverData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify ride started
   */
  notifyRideStarted(rideId: string, driverId: string): void {
    this.server.emit('ride:started', {
      rideId,
      driverId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify ride completed
   */
  notifyRideCompleted(
    rideId: string,
    finalFare: number,
    distance: number,
    duration: number
  ): void {
    this.server.emit('ride:completed', {
      rideId,
      finalFare,
      distance,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Driver declines a ride
   */
  @SubscribeMessage('ride:decline')
  async handleRideDecline(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; driverId: string }
  ) {
    this.logger.log(`Driver ${data.driverId} declined ride ${data.rideId}`);
    this.server.emit('ride:declined', {
      rideId: data.rideId,
      driverId: data.driverId,
    });
  }

  /**
   * Find driver by socket ID
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
   * Get connected drivers count
   */
  getConnectedDriversCount(): number {
    return this.driverConnections.size;
  }
}
