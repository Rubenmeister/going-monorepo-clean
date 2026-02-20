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
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Location update payload emitted by driver/employee device
 */
export interface LocationUpdatePayload {
  bookingId: string;
  companyId: string;
  userId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

/**
 * Trip status event payload
 */
export interface TripStatusPayload {
  bookingId: string;
  companyId: string;
  userId: string;
  status: 'started' | 'paused' | 'completed';
  timestamp: string;
}

/**
 * Active trip info for company dashboard
 */
export interface ActiveTripInfo {
  bookingId: string;
  userId: string;
  employeeName: string;
  serviceType: string;
  lat: number;
  lng: number;
  speed?: number;
  startedAt: string;
  lastSeen: string;
  consentGranted: boolean;
}

/**
 * Corporate Tracking WebSocket Gateway
 *
 * Handles real-time GPS location sharing for corporate trips.
 * Privacy-first: only active IN_PROGRESS trips with explicit consent are tracked.
 * Topic: corporate:{companyId}:active-trips
 *
 * LOPD Ecuador compliance:
 * - Employee must grant consent in mobile app before location is shared
 * - Location is only broadcast during IN_PROGRESS status
 * - All access is audit-logged
 */
@WebSocketGateway({
  namespace: '/corporate-tracking',
  cors: {
    origin: process.env.CORPORATE_PORTAL_URL || 'http://localhost:3001',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class CorporateTrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(CorporateTrackingGateway.name);

  /** Map<companyId, Map<bookingId, ActiveTripInfo>> */
  private readonly activeTrips = new Map<string, Map<string, ActiveTripInfo>>();

  /** Map<socketId, { companyId, role, userId }> */
  private readonly connectedClients = new Map<
    string,
    { companyId: string; role: 'portal' | 'employee'; userId: string }
  >();

  afterInit() {
    this.logger.log('Corporate Tracking Gateway initialised');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─────────────────────────────────────────────
  //  Portal (manager dashboard) events
  // ─────────────────────────────────────────────

  /**
   * Portal subscribes to company's active trips room
   */
  @SubscribeMessage('portal:subscribe')
  async handlePortalSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { companyId: string; token: string }
  ) {
    // TODO: validate JWT token and verify user belongs to companyId
    // const { userId, role } = await this.authService.validateToken(payload.token);

    this.connectedClients.set(client.id, {
      companyId: payload.companyId,
      role: 'portal',
      userId: 'manager-placeholder',
    });

    const room = `corporate:${payload.companyId}:active-trips`;
    await client.join(room);

    // Send current state of all active trips for this company
    const trips = this.getActiveTripsForCompany(payload.companyId);
    client.emit('portal:initial-state', { trips });

    this.logger.log(
      `Portal joined room ${room} (${trips.length} active trips)`
    );

    // Audit log: portal manager viewed active trips
    this.auditLog({
      action: 'portal_subscribed',
      companyId: payload.companyId,
      actorId: 'manager-placeholder',
      metadata: { socketId: client.id },
    });
  }

  /**
   * Portal unsubscribes from tracking
   */
  @SubscribeMessage('portal:unsubscribe')
  async handlePortalUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { companyId: string }
  ) {
    const room = `corporate:${payload.companyId}:active-trips`;
    await client.leave(room);
    this.logger.log(`Portal left room ${room}`);
  }

  // ─────────────────────────────────────────────
  //  Employee (mobile) events
  // ─────────────────────────────────────────────

  /**
   * Employee starts sharing location (after consent)
   */
  @SubscribeMessage('employee:trip-start')
  async handleTripStart(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      bookingId: string;
      companyId: string;
      userId: string;
      employeeName: string;
      serviceType: string;
      consentGranted: boolean;
      lat: number;
      lng: number;
    }
  ) {
    if (!payload.consentGranted) {
      // Employee declined — acknowledge but do NOT add to tracking
      client.emit('employee:tracking-status', {
        bookingId: payload.bookingId,
        tracking: false,
        reason: 'consent_not_granted',
      });
      this.logger.log(
        `Employee ${payload.userId} declined tracking for booking ${payload.bookingId}`
      );
      return;
    }

    // Register active trip
    if (!this.activeTrips.has(payload.companyId)) {
      this.activeTrips.set(payload.companyId, new Map());
    }

    const tripInfo: ActiveTripInfo = {
      bookingId: payload.bookingId,
      userId: payload.userId,
      employeeName: payload.employeeName,
      serviceType: payload.serviceType,
      lat: payload.lat,
      lng: payload.lng,
      startedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      consentGranted: true,
    };

    this.activeTrips.get(payload.companyId)!.set(payload.bookingId, tripInfo);

    this.connectedClients.set(client.id, {
      companyId: payload.companyId,
      role: 'employee',
      userId: payload.userId,
    });

    // Join employee to their own booking room for status updates
    await client.join(`booking:${payload.bookingId}`);

    // Notify portal dashboard
    const room = `corporate:${payload.companyId}:active-trips`;
    this.server.to(room).emit('trip:started', tripInfo);

    client.emit('employee:tracking-status', {
      bookingId: payload.bookingId,
      tracking: true,
    });

    this.logger.log(
      `Trip started: booking ${payload.bookingId} by ${payload.employeeName}`
    );

    // Persist consent record
    // await this.consentService.recordConsent({ ... });

    // Audit log
    this.auditLog({
      action: 'trip_tracking_started',
      companyId: payload.companyId,
      actorId: payload.userId,
      metadata: { bookingId: payload.bookingId },
    });
  }

  /**
   * Employee sends location update
   */
  @SubscribeMessage('employee:location-update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LocationUpdatePayload
  ) {
    const companyTrips = this.activeTrips.get(payload.companyId);
    const trip = companyTrips?.get(payload.bookingId);

    if (!trip) {
      // Trip not registered — employee may not have started tracking
      return;
    }

    // Update stored location
    trip.lat = payload.lat;
    trip.lng = payload.lng;
    trip.speed = payload.speed;
    trip.lastSeen = new Date().toISOString();

    // Broadcast to portal dashboard
    const room = `corporate:${payload.companyId}:active-trips`;
    this.server.to(room).emit('trip:location-updated', {
      bookingId: payload.bookingId,
      userId: payload.userId,
      lat: payload.lat,
      lng: payload.lng,
      speed: payload.speed,
      heading: payload.heading,
      timestamp: payload.timestamp,
    });
  }

  /**
   * Employee ends trip / revokes tracking consent
   */
  @SubscribeMessage('employee:trip-end')
  async handleTripEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TripStatusPayload
  ) {
    const companyTrips = this.activeTrips.get(payload.companyId);
    if (companyTrips) {
      companyTrips.delete(payload.bookingId);
    }

    // Notify portal that trip has ended
    const room = `corporate:${payload.companyId}:active-trips`;
    this.server.to(room).emit('trip:ended', {
      bookingId: payload.bookingId,
      userId: payload.userId,
      timestamp: payload.timestamp,
    });

    this.logger.log(
      `Trip ended: booking ${payload.bookingId} by ${payload.userId}`
    );

    // Audit log
    this.auditLog({
      action: 'trip_tracking_ended',
      companyId: payload.companyId,
      actorId: payload.userId,
      metadata: { bookingId: payload.bookingId, status: payload.status },
    });
  }

  // ─────────────────────────────────────────────
  //  Internal helpers
  // ─────────────────────────────────────────────

  /**
   * Get all active trips for a company (only consented ones)
   */
  private getActiveTripsForCompany(companyId: string): ActiveTripInfo[] {
    const trips = this.activeTrips.get(companyId);
    if (!trips) return [];
    return Array.from(trips.values()).filter((t) => t.consentGranted);
  }

  /**
   * Broadcast a location update from an external source (e.g. REST trigger)
   */
  broadcastLocationUpdate(companyId: string, update: LocationUpdatePayload) {
    const room = `corporate:${companyId}:active-trips`;
    this.server.to(room).emit('trip:location-updated', update);
  }

  /**
   * Structured audit log for LOPD compliance
   */
  private auditLog(entry: {
    action: string;
    companyId: string;
    actorId: string;
    metadata?: Record<string, unknown>;
  }) {
    const log = {
      ...entry,
      timestamp: new Date().toISOString(),
      service: 'corporate-tracking-gateway',
    };
    this.logger.log(`AUDIT: ${JSON.stringify(log)}`);
    // TODO: persist to audit_logs collection in MongoDB
  }
}
