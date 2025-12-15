import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  UpdateDriverLocationUseCase,
  UpdateDriverLocationCommand,
} from '@going-monorepo-clean/domains-tracking-application';
import {
  IDriverLocationGateway,
  DriverLocation,
} from '@going-monorepo-clean/domains-tracking-core';
import { Result, ok, err } from 'neverthrow';

@WebSocketGateway({ cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect, IDriverLocationGateway {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly updateDriverLocationUseCase: UpdateDriverLocationUseCase,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() payload: any,
  ): Promise<void> {
    try {
      const command: UpdateDriverLocationCommand = {
        driverId: payload.driverId,
        latitude: payload.latitude,
        longitude: payload.longitude,
      };

      // We pass 'this' as the gateway implementation to the use case?
      // No, that would be circular/weird dependency if injected in constructor.
      // Usually UseCase is created with dependencies.
      // If TrackingGateway USES UpdateDriverLocationUseCase, and UpdateDriverLocationUseCase USES TrackingGateway... Circular Dependency.
      // Ideally, the Gateway (Infrastructure) and the Broadcaster (Infrastructure) are separate, or validly circular if managed by NestJS forwardRef.
      // But passing 'this' to execute() is not how UseCase is built.
      
      const result = await this.updateDriverLocationUseCase.execute(command);
      
      if (result.isErr()) {
        this.logger.error(`Error updating location: ${result.error.message}`);
      }
      
    } catch (error) {
      this.logger.warn(`Invalid location data from socket: ${error.message}`);
    }
  }

  async broadcastLocation(location: DriverLocation): Promise<Result<void, Error>> {
    try {
      this.server.emit('driverLocationUpdate', location.toPrimitives());
      return ok(undefined);
    } catch (error) {
      return err(new Error(`Broadcast failed: ${error.message}`));
    }
  }
}
