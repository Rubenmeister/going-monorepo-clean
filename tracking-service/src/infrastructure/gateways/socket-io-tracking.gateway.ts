import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Result, ok } from 'neverthrow';
import {
  DriverLocation,
  ITrackingGateway,
} from '@going-monorepo-clean/domains-tracking-core';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketIoTrackingGateway implements ITrackingGateway {
  @WebSocketServer()
  server: Server;

  async broadcastLocationUpdate(
    location: DriverLocation,
  ): Promise<Result<void, Error>> {
    const primitives = location.toPrimitives();
    this.server.emit('driverLocationUpdated', primitives);
    return ok(undefined);
  }

  async broadcastToRoom(room: string, event: string, data: any): Promise<Result<void, Error>> {
    this.server.to(room).emit(event, data);
    return ok(undefined);
  }
}