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
import { Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RideModelSchema, RideDocument } from '../persistence/schemas/ride.schema';
import { DriverRatingModel, DriverRatingDocument } from '../../api/driver.controller';

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

  // rideId → ya se envió la notificación de 10 min (evitar duplicados)
  private readonly tenMinNotified = new Set<string>();

  // rideId → posición actual del conductor
  private readonly driverPositions = new Map<string, {
    driverId: string;
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt: Date;
  }>();

  // rideId → coordenadas de origen/destino para calcular progreso
  private readonly rideRoutes = new Map<string, {
    originLat: number; originLng: number;
    destLat: number;   destLng: number;
    totalKm: number;
  }>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(RideModelSchema.name)
    private readonly rideModel: Model<RideDocument>,
    @InjectModel(DriverRatingModel.name)
    private readonly ratingModel: Model<DriverRatingDocument>,
  ) {}

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

    // Notificación de 10 minutos — emitir solo una vez por viaje
    if (etaSeconds && etaSeconds <= 600 && !this.tenMinNotified.has(rideId)) {
      this.tenMinNotified.add(rideId);
      this.server.to(`ride:${rideId}`).emit('ride:driver_10min', {
        rideId,
        message: '🚗 Tu conductor llega en ~10 minutos. ¡Prepárate!',
        etaSeconds,
      });
      this.logger.log(`10-min notification sent for ride ${rideId}`);
    }

    // Calcular % de progreso si tenemos la ruta
    const progressPercent = this.calcProgress(rideId, lat, lng);

    // Broadcast a todos en la sala del viaje
    this.server.to(`ride:${rideId}`).emit('ride:driver_location', {
      rideId, lat, lng, heading, speed,
      eta: etaSeconds,
      etaText,
      progressPercent,
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
  async handleRideCompleted(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: {
      rideId: string;
      distanceKm: number;
      durationSeconds: number;
      cashConfirmed?: boolean;
    },
  ) {
    this.driverPositions.delete(data.rideId);
    this.rideRoutes.delete(data.rideId);

    const completedAt = new Date();

    // Persist completion data + cashConfirmed flag on the Ride document
    try {
      await this.rideModel.findOneAndUpdate(
        { _id: data.rideId },
        {
          $set: {
            status:          'completed',
            completedAt,
            distanceKm:      data.distanceKm,
            durationSeconds: data.durationSeconds,
            ...(data.cashConfirmed != null && { cashConfirmed: data.cashConfirmed }),
          },
        },
      ).exec();
    } catch (err) {
      this.logger.warn(`Could not persist ride:completed for ${data.rideId}: ${err}`);
    }

    this.server.to(`ride:${data.rideId}`).emit('ride:completed', {
      rideId:          data.rideId,
      distanceKm:      data.distanceKm,
      durationSeconds: data.durationSeconds,
      cashConfirmed:   data.cashConfirmed ?? false,
      completedAt,
    });
  }

  // ─── Pasajero califica al conductor ───────────────────────────────────────

  /**
   * Evento: passenger:rate_driver
   * Payload: { rideId, driverId, rating, comment?, tags?, passengerName? }
   * El pasajero lo emite desde la pantalla de calificación post-viaje.
   */
  @SubscribeMessage('passenger:rate_driver')
  async handleRateDriver(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      rideId:        string;
      driverId:      string;
      rating:        number;
      comment?:      string;
      tags?:         string[];
      passengerName?: string;
    },
  ) {
    const passengerId = client.data.userId;
    if (!passengerId) {
      client.emit('error', { message: 'No autorizado' });
      return;
    }

    const rating = Math.max(1, Math.min(5, Math.round(data.rating)));

    try {
      // Upsert — un pasajero solo puede calificar una vez por viaje
      await this.ratingModel.findOneAndUpdate(
        { driverId: data.driverId, passengerId, rideId: data.rideId },
        {
          driverId:      data.driverId,
          passengerId,
          rideId:        data.rideId,
          rating,
          comment:       data.comment ?? null,
          tags:          data.tags ?? [],
          passengerName: data.passengerName ?? null,
        },
        { upsert: true },
      );

      client.emit('rating:saved', { rideId: data.rideId, rating });
      this.logger.log(`Passenger ${passengerId} rated driver ${data.driverId}: ${rating}★`);
    } catch (err) {
      this.logger.warn(`Could not save rating for ride ${data.rideId}: ${err}`);
      client.emit('error', { message: 'No se pudo guardar la calificación' });
    }
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

  /** Registra la ruta del viaje para calcular progreso */
  registerRoute(rideId: string, originLat: number, originLng: number, destLat: number, destLng: number) {
    const totalKm = this.haversineKm(originLat, originLng, destLat, destLng);
    this.rideRoutes.set(rideId, { originLat, originLng, destLat, destLng, totalKm });
  }

  /** Calcula % de progreso basado en proyección del conductor sobre la línea origen→destino */
  private calcProgress(rideId: string, driverLat: number, driverLng: number): number | null {
    const route = this.rideRoutes.get(rideId);
    if (!route || route.totalKm === 0) return null;

    // Distancia del conductor al origen y al destino
    const fromOrigin = this.haversineKm(route.originLat, route.originLng, driverLat, driverLng);
    const fromDest   = this.haversineKm(driverLat, driverLng, route.destLat, route.destLng);

    // Progreso = distancia recorrida / distancia total (clamped 0–100)
    const traveled = Math.max(0, route.totalKm - fromDest);
    const pct = Math.min(100, Math.round((traveled / route.totalKm) * 100));

    // Sanity check: si el conductor está lejos del origen, asumir 0%
    if (fromOrigin > route.totalKm * 1.5) return null;

    return pct;
  }

  /** Fórmula Haversine — distancia en km entre dos puntos */
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R  = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
