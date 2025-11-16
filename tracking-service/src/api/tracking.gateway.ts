import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  UpdateLocationDto,
  UpdateLocationUseCase,
} from '@going-monorepo-clean/domains-tracking-application';

@WebSocketGateway({ cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrackingGateway.name);
  private validationPipe = new ValidationPipe({ whitelist: true });

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
      const dto = new UpdateLocationDto();
      dto.driverId = payload.driverId;
      dto.latitude = payload.latitude;
      dto.longitude = payload.longitude;
      
      await this.validationPipe.transform(dto, { type: 'body' });
      await this.updateLocationUseCase.execute(dto);
      
    } catch (error) {
      this.logger.warn(`Invalid location data from socket: ${error.message}`);
    }
  }
}