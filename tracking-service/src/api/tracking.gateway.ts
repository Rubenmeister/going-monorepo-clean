import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  LocationUpdateDto,
  UpdateLocationUseCase,
} from '@going-monorepo-clean/domains-tracking-application';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
    credentials: true,
  }
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private readonly updateLocationUseCase: UpdateLocationUseCase,
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
      const dto: LocationUpdateDto = {
        driverId: payload?.driverId,
        latitude: payload?.latitude,
        longitude: payload?.longitude,
      };
      await this.updateLocationUseCase.execute(dto);
    } catch (error) {
      this.logger.warn(`Invalid location data from socket: ${error.message}`);
    }
  }
}