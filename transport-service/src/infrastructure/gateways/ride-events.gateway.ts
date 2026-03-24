import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * RideEventsGateway — Socket.io server para eventos en tiempo real del viaje.
 *
 * ROOMS (salas):
 *   ride:{rideId}         — pasajero + conductor del viaje, reciben todos los eventos
 *   driver:{driverId}     — conductor específico (para ofertas de viaje)
 *   tracking:{rideId}     — observadores externos (link compartido, read-only)
 *
 * EVENTOS DEL CONDUCTOR → SERVIDOR (emit desde app del conductor):
 *   driver:location       — { rideId, lat, lng, heading?, speed? }
 *   driver:arrived        — { rideId }                  ← conductor llegó al punto de recogida
 *   driver:started        — { rideId }                  ← viaje iniciado
 *   driver:completed      — { rideId, distanceKm, durationSeconds }
 *
 * EVENTOS SERVIDOR → PASAJERO/OBSERVADORES (broadcast):
 *   ride:driver_location  — { lat, lng, heading, speed, eta }
 *   ride:driver_arrived   — { rideId, message }
 *   ride:started          — { rideId, startedAt }
 *   ride:completed        — { rideId, finalFare, completedAt }
 *   ride:fare_updated     — { rideId, totalFare }        ← cuando cambia el monto en ruta
 *   ride:eta_update       — { rideId, etaSeconds, etaText }
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/rides',
})
export class RideEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RideEventsGateway.name);

  // rideId → { driverId, lastLat, lastLng, lastUpdate }
  private readonly driverPositions = new Map<string, {
    driverId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt: Date;
  }>();

  constructor(private readonly jwtService: JwtService) {}

  // ─── Conexión ──────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.userId = payload.sub;
        client.data.role   = payload.roles?.[0] ?? 'user';
      }
      this.logger.log(`Client connected: ${client.id} user=${client.data.userId ?? 'anonymous'}`);
    } catch {
      // Token inválido — se permite conexión anónima para observadores (link compartido)
      this.logger.debug(`Anonymous connection: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Cliente se une a la sala del viaje ────────────────────────────────────

  @SubscribeMessage('join:ride')
  handleJoinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; token?: string },
  ) {
    const room = `ride:${data.rideId}`;
    client.join(room);
    this.logger.log(`${client.id} joined ${room}`);

    // Si hay posición reciente del conductor, enviársela inmediatamente
    const pos = this.driverPositions.get(data.rideId);
    if (pos) {
      client.emit('ride:driver_location', {
        rideId: data.rideId,
        lat:    pos.lat,
        lng:    pos.lng,
        heading: pos.heading,
        speed:   pos.speed,
      });
    }

    return { joined: room };
  }

  // Sala pública de observadores (link compartido — read-only)
  @SubscribeMessage('join:tracking')
  handleJoinTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const decoded = Buffer.from(data.token, 'base64').toString('utf8');
      const rideId  = decoded.split('-')[0];
      client.join(`tracking:${rideId}`);
      client.join(`ride:${rideId}`);           // también recibe eventos del viaje
      this.logger.log(`Observer joined tracking for ride ${rideId}`);
      return { joined: `tracking:${rideId}` };
    } catch {
      return { error: 'Token inválido' };
    }
  }

  // ─── Conductor actualiza su posición GPS ───────────────────────────────────

  @SubscribeMessage('driver:location')
  handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      rideId:   string;
      lat:      number;
      lng:      number;
      heading?: number;
      speed?:   number;
    },
  ) {
    const { rideId, lat, lng, heading, speed } = data;

    // Guardar última posición en memoria
    this.driverPositions.set(rideId, {
      driverId:  client.data.userId ?? 'unknown',
      lat, lng, heading, speed,
      updatedAt: new Date(),
    });

    // Calcular ETA al destino (simplificado: velocidad promedio 30 km/h en ciudad)
    const etaSeconds = speed && speed > 0
      ? Math.round((500 / speed) * 3600)   // ~500m restantes estimados
      : null;

    const etaText = etaSeconds
      ? etaSeconds < 60
        ? 'Menos de 1 minuto'
        : `${Math.round(etaSeconds / 60)} min`
      : null;

    // Broadcast a todos en la sala del viaje
    this.server.to(`ride:${rideId}`).emit('ride:driver_location', {
      rideId, lat, lng, heading, speed,
      eta: etaSeconds,
      etaText,
    });

    if (etaText) {
      this.server.to(`ride:${rideId}`).emit('ride:eta_update', {
        rideId,
        etaSeconds,
        etaText,
      });
    }
  }

  // ─── Conductor llegó al punto de recogida ──────────────────────────────────

  @SubscribeMessage('driver:arrived')
  handleDriverArrived(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { rideId: string },
  ) {
    this.server.to(`ride:${data.rideId}`).emit('ride:driver_arrived', {
      rideId:  data.rideId,
      message: 'Tu conductor ha llegado al punto de recogida',
      arrivedAt: new Date(),
    });
    this.logger.log(`Driver arrived for ride ${data.rideId}`);
  }

  // ─── Conductor inicia el viaje ─────────────────────────────────────────────

  @SubscribeMessage('driver:started')
  handleRideStarted(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { rideId: string },
  ) {
    this.server.to(`ride:${data.rideId}`).emit('ride:started', {
      rideId:    data.rideId,
      startedAt: new Date(),
      message:   '¡El viaje ha comenzado!',
    });
  }

  // ─── Conductor completa el viaje ───────────────────────────────────────────

  @SubscribeMessage('driver:completed')
  handleRideCompleted(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { rideId: string; distanceKm: number; durationSeconds: number },
  ) {
    this.driverPositions.delete(data.rideId);
    this.server.to(`ride:${data.rideId}`).emit('ride:completed', {
      rideId:          data.rideId,
      distanceKm:      data.distanceKm,
      durationSeconds: data.durationSeconds,
      completedAt:     new Date(),
    });
  }

  // ─── Métodos públicos para llamar desde otros servicios ────────────────────

  /** Notifica al pasajero que el conductor aceptó el viaje */
  notifyDriverAccepted(rideId: string, driverInfo: {
    name:     string;
    vehicle:  string;
    plate:    string;
    rating:   number;
    photoUrl?: string;
    eta?:     number;   // minutos hasta llegar
  }) {
    this.server.to(`ride:${rideId}`).emit('ride:driver_accepted', {
      rideId,
      driver:  driverInfo,
      message: driverInfo.eta
        ? `Tu conductor llegará en ${driverInfo.eta} minutos`
        : 'Tu conductor está en camino',
    });
    this.logger.log(`Notified passenger: driver accepted ride ${rideId}`);
  }

  /** Actualiza tarifa en tiempo real (cuando cambia la ruta) */
  notifyFareUpdate(rideId: string, totalFare: number) {
    this.server.to(`ride:${rideId}`).emit('ride:fare_updated', { rideId, totalFare });
  }

  /** Notifica fallo de pago al pasajero */
  notifyPaymentFailed(rideId: string, userId: string, error?: string) {
    this.server.to(`ride:${rideId}`).emit('ride:payment_failed', {
      rideId,
      message: 'El pago fue rechazado. Por favor verifica tu método de pago.',
      error,
    });
  }
}
