import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { firstValueFrom } from 'rxjs';

@WebSocketGateway({ cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(TrackingGateway.name);
  private trackingServiceHttpUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // URL del endpoint HTTP del tracking-service
    this.trackingServiceHttpUrl = `${this.configService.get('TRACKING_SERVICE_URL')}/tracking`;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado al Gateway: ${client.id}`);
    // Aquí puedes manejar la autenticación del socket
    // (ej. recibir un token JWT y unirse a una "sala")
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Escucha el evento 'updateLocation' enviado por el conductor
   * y lo reenvía al tracking-service vía HTTP POST.
   */
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(@MessageBody() payload: any): Promise<void> {
    try {
      // Reenvía el payload al endpoint HTTP del microservicio de tracking
      // (que a su vez llama al UpdateLocationUseCase)
      // ESTO ES MÁS ROBUSTO QUE UN WEBSOCKET AL WEBSOCKET
      await firstValueFrom(
        this.httpService.post(`${this.trackingServiceHttpUrl}/update-location-internal`, payload)
      );
    } catch (error) {
      this.logger.error('Error reenviando ubicación al tracking-service', error.message);
    }
  }
}