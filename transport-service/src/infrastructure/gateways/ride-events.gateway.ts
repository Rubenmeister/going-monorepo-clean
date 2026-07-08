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
import { IRideRepository } from '../../domain/ports';

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
  private readonly tenMinNotified   = new Set<string>();
  private readonly threeMinNotified = new Set<string>();
  private readonly arrivedNotified  = new Set<string>();

  // driverId → timer de "offline" tras desconexión. Se cancela si reconecta
  // dentro de la ventana (evita falso 'conductor offline', #19).
  private readonly disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

  // Cota dura de estado en memoria: sin evento de cancelación, un viaje que no
  // termina por 'driver:completed' dejaba basura para siempre (fuga → OOM, #18).
  private static readonly MAX_TRACKED_RIDES = 5000;

  /** Libera TODO el estado en memoria de un viaje (fin, cancelación o evicción). */
  private clearRideState(rideId: string): void {
    this.driverPositions.delete(rideId);
    this.rideRoutes.delete(rideId);
    this.tenMinNotified.delete(rideId);
    this.threeMinNotified.delete(rideId);
    this.arrivedNotified.delete(rideId);
  }

  /** Si el tracking excede la cota, desaloja el viaje más antiguo (insertion order). */
  private evictOldestIfNeeded(): void {
    if (this.driverPositions.size <= RideEventsGateway.MAX_TRACKED_RIDES) return;
    const oldest = this.driverPositions.keys().next().value;
    if (oldest) this.clearRideState(oldest);
  }

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(RideModelSchema.name)
    private readonly rideModel: Model<RideDocument>,
    @InjectModel(DriverRatingModel.name)
    private readonly ratingModel: Model<DriverRatingDocument>,
    // Inyección por string token — evita el problema de class-identity
    // cuando @Global() InfrastructureModule exporta la clase pero AppModule
    // no resuelve la referencia (visto en NestJS con compilación ts-loader
    // + barrels). El token 'IRideRepository' está siempre registrado en
    // InfrastructureModule con useClass: MongooseRideRepository.
    @Inject('IRideRepository')
    private readonly rideRepository: IRideRepository,
  ) {}

  // ─── Push Notification Helper ──────────────────────────────────────────────

  private sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>): void {
    // Ruta REAL /notifications/send (sin /api) + token S2S + timeout. Antes
    // /api/notifications/send SIN token → 404/401 siempre.
    const notifUrl = (process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3008').replace(/\/$/, '');
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) {
      this.logger.warn('INTERNAL_SERVICE_TOKEN ausente — push omitido');
      return;
    }
    fetch(`${notifUrl}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, title, body, data: data ?? {} }),
      signal: AbortSignal.timeout(5000),
    }).catch(e => this.logger.warn(`Push notification failed for ${userId}: ${e.message}`));
  }

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
        // Reconexión dentro de la ventana → cancela el timer de "offline" (#19).
        const pending = this.disconnectTimers.get(payload.sub);
        if (pending) {
          clearTimeout(pending);
          this.disconnectTimers.delete(payload.sub);
          this.logger.log(`Driver ${payload.sub} reconectó — timer offline cancelado`);
        }
      }
      this.logger.log(`Client connected: ${client.id} user=${client.data.userId ?? 'anonymous'}`);
    } catch {
      // Token inválido — se permite conexión anónima para observadores (link compartido)
      this.logger.debug(`Anonymous connection: ${client.id}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const driverId = client.data.userId;

    if (driverId) {
      try {
        // Find active rides for this driver
        const activeRides = await this.rideRepository.findActiveByDriverId(driverId);

        if (activeRides && activeRides.length > 0) {
          const activeRide = activeRides[0]; // Typically one active ride per driver

          // Notify passenger immediately about driver disconnect
          this.server.to(`ride:${activeRide.id}`).emit('ride:driver_disconnected', {
            rideId: activeRide.id,
            message: 'Tu conductor perdió la conexión. Estamos buscando una solución.',
            timestamp: new Date().toISOString(),
          });

          this.logger.log(
            `Driver ${driverId} disconnected with active ride ${activeRide.id}. Passenger notified.`
          );

          // Set 30-second timeout to check if driver reconnects. Se guarda por
          // driverId para poder cancelarlo si el conductor reconecta (#19).
          const timer = setTimeout(async () => {
            this.disconnectTimers.delete(driverId);
            try {
              const ride = await this.rideRepository.findById(activeRide.id);
              // Solo emitir offline si el viaje sigue activo Y el conductor NO
              // reconectó (si reconectó, el timer ya se habría cancelado).
              if (
                ride &&
                ride.status !== 'completed' &&
                ride.status !== 'cancelled'
              ) {
                this.server.to(`ride:${activeRide.id}`).emit('ride:driver_offline', {
                  rideId: activeRide.id,
                  message: 'El conductor no pudo reconectarse. Por favor contacta soporte.',
                  timestamp: new Date().toISOString(),
                });

                this.logger.warn(
                  `Driver ${driverId} did not reconnect within 30s. Ride ${activeRide.id} marked as offline.`
                );
              }
            } catch (err) {
              this.logger.error(
                `Error checking ride status after driver timeout: ${err.message}`
              );
            }
          }, 30000);
          this.disconnectTimers.set(driverId, timer);
        }
      } catch (err) {
        this.logger.error(
          `Error handling driver disconnect for ${driverId}: ${err.message}`
        );
      }
    }

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

    // Guardar última posición en memoria (con cota dura anti-fuga)
    this.driverPositions.set(rideId, {
      driverId:  client.data.userId ?? 'unknown',
      lat, lng, heading, speed,
      updatedAt: new Date(),
    });
    this.evictOldestIfNeeded();

    // Calcular ETA REAL al punto de recogida.
    // Antes: hardcoded 500m / speed (mal — daba ETA fijo independiente de la
    // distancia real). Ahora: distancia haversine del conductor al pickup,
    // dividida por velocidad efectiva (la reportada si >5 km/h, sino fallback
    // a 30 km/h promedio ciudad).
    const route = this.rideRoutes.get(rideId);
    const effectiveSpeedKmh = (speed && speed > 5) ? speed : 30;
    const distanceToPickupKm = route
      ? this.haversineKm(lat, lng, route.originLat, route.originLng)
      : null;
    const etaSeconds = distanceToPickupKm != null
      ? Math.max(0, Math.round((distanceToPickupKm / effectiveSpeedKmh) * 3600))
      : null;

    const etaText = etaSeconds
      ? etaSeconds < 60
        ? 'Menos de 1 minuto'
        : `${Math.round(etaSeconds / 60)} min`
      : null;

    // Persistir la última posición + ETA en el doc del viaje (fire-and-forget)
    // para que otros servicios lo consulten por REST — ej. el asistente de
    // soporte respondiendo "¿dónde está mi conductor?" / "¿cuánto falta?".
    this.rideModel
      .updateOne(
        { _id: rideId },
        {
          $set: {
            lastDriverLat: lat,
            lastDriverLng: lng,
            lastDriverEtaSeconds: etaSeconds ?? null,
            lastDriverDistanceKm: distanceToPickupKm ?? null,
            lastLocationAt: new Date(),
          },
        },
      )
      .catch((e) => this.logger.warn(`persist driver pos ride=${rideId}: ${e.message}`));

    // Notificaciones de proximidad — cada umbral se emite solo una vez por viaje.
    const distanceMeters = distanceToPickupKm != null ? distanceToPickupKm * 1000 : null;

    if (etaSeconds != null && etaSeconds <= 600 && !this.tenMinNotified.has(rideId)) {
      this.tenMinNotified.add(rideId);
      this.server.to(`ride:${rideId}`).emit('ride:driver_proximity', {
        rideId,
        threshold: '10min',
        message:   '🚗 Tu conductora o conductor llega en ~10 minutos. ¡Prepárate!',
        etaSeconds,
        distanceMeters,
      });
      // Compat con clientes viejos que escuchan ride:driver_10min:
      this.server.to(`ride:${rideId}`).emit('ride:driver_10min', { rideId, message: '🚗 Tu conductora o conductor llega en ~10 minutos. ¡Prepárate!', etaSeconds });
      this.logger.log(`[proximity] 10min ride=${rideId}`);
    }

    if (etaSeconds != null && etaSeconds <= 180 && !this.threeMinNotified.has(rideId)) {
      this.threeMinNotified.add(rideId);
      this.server.to(`ride:${rideId}`).emit('ride:driver_proximity', {
        rideId,
        threshold: '3min',
        message:   '⏱️ Tu conductora o conductor llega en ~3 minutos. Sal al punto de encuentro.',
        etaSeconds,
        distanceMeters,
      });
      this.logger.log(`[proximity] 3min ride=${rideId}`);
    }

    // "Llegó" = a menos de 50 metros del punto de pickup
    if (distanceMeters != null && distanceMeters <= 50 && !this.arrivedNotified.has(rideId)) {
      this.arrivedNotified.add(rideId);
      this.server.to(`ride:${rideId}`).emit('ride:driver_proximity', {
        rideId,
        threshold: 'arrived',
        message:   '✅ Tu conductora o conductor ya llegó. Búscale en el punto de encuentro.',
        etaSeconds: 0,
        distanceMeters,
      });
      this.logger.log(`[proximity] arrived ride=${rideId}`);
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
  async handleDriverArrived(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { rideId: string },
  ) {
    // Persist status change (driver may call via WebSocket only, not REST)
    try {
      await this.rideModel.findOneAndUpdate(
        { _id: data.rideId, status: 'accepted' },
        { $set: { status: 'arriving', arrivedAt: new Date() } },
      ).exec();
    } catch (err) {
      this.logger.warn(`Could not persist ride:arriving for ${data.rideId}: ${err}`);
    }

    this.server.to(`ride:${data.rideId}`).emit('ride:driver_arrived', {
      rideId:  data.rideId,
      message: 'Tu conductor ha llegado al punto de recogida',
      arrivedAt: new Date(),
    });

    // Push notification for offline users
    try {
      const ride = await this.rideModel.findById(data.rideId).select('userId').lean().exec();
      if (ride?.userId) {
        this.sendPushNotification(
          String(ride.userId),
          '🚗 Tu conductor ha llegado',
          'El conductor está esperándote en el punto de recogida',
          { rideId: data.rideId, actionUrl: '/transport' }
        );
      }
    } catch {}

    this.logger.log(`Driver arrived for ride ${data.rideId}`);
  }

  // ─── Conductor inicia el viaje ─────────────────────────────────────────────

  @SubscribeMessage('driver:started')
  async handleRideStarted(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { rideId: string },
  ) {
    this.server.to(`ride:${data.rideId}`).emit('ride:started', {
      rideId:    data.rideId,
      startedAt: new Date(),
      message:   '¡El viaje ha comenzado!',
    });

    // Push notification for offline users
    try {
      const ride = await this.rideModel.findById(data.rideId).select('userId').lean().exec();
      if (ride?.userId) {
        this.sendPushNotification(
          String(ride.userId),
          '✅ ¡Tu viaje ha comenzado!',
          'Estás en camino. Disfruta el viaje.',
          { rideId: data.rideId, actionUrl: '/transport' }
        );
      }
    } catch {}
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
    this.clearRideState(data.rideId);

    const completedAt = new Date();

    // NOTE: Do NOT persist status here — the REST endpoint PUT /rides/:rideId/complete
    // handles persistence + payment capture via CompleteRideUseCase.
    // This handler only emits real-time events and push notifications.

    this.server.to(`ride:${data.rideId}`).emit('ride:completed', {
      rideId:          data.rideId,
      distanceKm:      data.distanceKm,
      durationSeconds: data.durationSeconds,
      cashConfirmed:   data.cashConfirmed ?? false,
      completedAt,
    });

    // Push notification for offline users
    try {
      const ride = await this.rideModel.findById(data.rideId).select('userId driverId').lean().exec();
      if (ride?.userId) {
        this.sendPushNotification(
          String(ride.userId),
          '🏁 ¡Viaje completado!',
          `Llegaste a tu destino. Recorrido: ${data.distanceKm?.toFixed(1) ?? '?'} km`,
          { rideId: data.rideId, actionUrl: '/bookings' }
        );
      }
    } catch {}
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

  /**
   * Notifica al pasajero que el conductor asignado no se presentó al pickup
   * dentro de la ventana esperada (driver no-show). Usado por
   * RideNoShowCronService. La app del pasajero debería mostrar un banner
   * "El conductor no llegó" + CTA "Pedir otro viaje".
   */
  notifyNoShow(rideId: string, payload: {
    rideId: string;
    driverId: string;
    reason: string;
    timestamp: string;
  }) {
    this.server.to(`ride:${rideId}`).emit('ride:driver_no_show', payload);
  }
}
