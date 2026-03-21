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
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuditLogService } from '@going-monorepo-clean/features-corporate-auth';

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

  /** Map<socketId, { companyId, role, userId, email, ipAddress }> */
  private readonly connectedClients = new Map<
    string,
    {
      companyId: string;
      role: 'portal' | 'employee';
      userId: string;
      email: string;
      ipAddress: string;
    }
  >();

  constructor(private readonly auditLogService: AuditLogService) {}

  afterInit() {
    this.logger.log('Corporate Tracking Gateway initialised');
  }

  handleConnection(client: Socket) {
    const ipAddress =
      (client.handshake.headers['x-forwarded-for'] as string) ||
      client.handshake.address ||
      'unknown';
    this.logger.log(`Client connected: ${client.id} from ${ipAddress}`);
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.logger.log(
        `Client disconnected: ${client.id} (${clientInfo.role} for company ${clientInfo.companyId})`
      );
    }
    this.connectedClients.delete(client.id);
  }

  // ─────────────────────────────────────────────
  //  Portal (manager dashboard) events
  // ─────────────────────────────────────────────

  /**
   * Portal (manager dashboard) subscribes to company's active trips
   * Manager can now see all live location updates for their company
   */
  @SubscribeMessage('portal:subscribe')
  async handlePortalSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { companyId: string; userId?: string; email?: string }
  ) {
    try {
      // Extract IP for audit trail
      const ipAddress =
        (client.handshake.headers['x-forwarded-for'] as string) ||
        client.handshake.address ||
        'unknown';

      // TODO: In production, validate JWT token here and verify user role is Manager/Admin
      const userId = payload.userId || 'manager-unknown';
      const email = payload.email || 'manager@company.com';

      // Register client connection
      this.connectedClients.set(client.id, {
        companyId: payload.companyId,
        role: 'portal',
        userId,
        email,
        ipAddress,
      });

      // Join company's active trips room
      const room = `corporate:${payload.companyId}:active-trips`;
      await client.join(room);

      // Send current state of all active trips for this company
      const trips = this.getActiveTripsForCompany(payload.companyId);
      client.emit('portal:initial-state', { trips });

      this.logger.log(
        `Manager ${email} (${userId}) joined room ${room} (${trips.length} active trips)`
      );

      // Audit log: manager connected to portal tracking
      await this.auditLogService.log({
        action: 'portal_subscribed',
        actorId: userId,
        actorEmail: email,
        companyId: payload.companyId,
        service: 'corporate-tracking-gateway',
        ipAddress,
        metadata: { socketId: client.id, tripsCount: trips.length },
      });
    } catch (error) {
      this.logger.error(
        `Error in portal subscribe: ${error.message}`,
        error.stack
      );
      client.emit('error', {
        message: 'Failed to subscribe to tracking',
        error: error.message,
      });
    }
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
   * Employee starts sharing location (after giving consent)
   * Location will be broadcast to all managers in the company
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
      email?: string;
      serviceType: string;
      consentGranted: boolean;
      lat: number;
      lng: number;
    }
  ) {
    try {
      const ipAddress =
        (client.handshake.headers['x-forwarded-for'] as string) ||
        client.handshake.address ||
        'unknown';

      if (!payload.consentGranted) {
        // Employee declined tracking
        this.logger.warn(
          `Employee ${payload.userId} declined tracking for booking ${payload.bookingId}`
        );

        // Audit log: consent revoked
        await this.auditLogService.log({
          action: 'consent_revoked',
          actorId: payload.userId,
          actorEmail: payload.email || 'employee@company.com',
          companyId: payload.companyId,
          bookingId: payload.bookingId,
          service: 'corporate-tracking-gateway',
          ipAddress,
          metadata: { reason: 'declined_at_start' },
        });

        client.emit('employee:tracking-status', {
          bookingId: payload.bookingId,
          tracking: false,
          reason: 'consent_not_granted',
        });
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

      // Register client
      this.connectedClients.set(client.id, {
        companyId: payload.companyId,
        role: 'employee',
        userId: payload.userId,
        email: payload.email || 'employee@company.com',
        ipAddress,
      });

      // Employee joins their own trip room for revocation
      await client.join(`booking:${payload.bookingId}`);

      // Notify all portal managers in this company
      const room = `corporate:${payload.companyId}:active-trips`;
      this.server.to(room).emit('trip:started', tripInfo);

      // Confirm to employee
      client.emit('employee:tracking-status', {
        bookingId: payload.bookingId,
        tracking: true,
      });

      this.logger.log(
        `Trip started: booking ${payload.bookingId} by ${payload.employeeName} (${payload.userId})`
      );

      // Audit log: trip tracking started
      await this.auditLogService.log({
        action: 'trip_tracking_started',
        actorId: payload.userId,
        actorEmail: payload.email || 'employee@company.com',
        companyId: payload.companyId,
        bookingId: payload.bookingId,
        service: 'corporate-tracking-gateway',
        ipAddress,
        metadata: { serviceType: payload.serviceType },
      });
    } catch (error) {
      this.logger.error(`Error starting trip: ${error.message}`, error.stack);
      client.emit('error', {
        message: 'Failed to start tracking',
        error: error.message,
      });
    }
  }

  /**
   * Employee sends periodic location update
   * This is broadcast to all managers viewing this company's trips
   */
  @SubscribeMessage('employee:location-update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LocationUpdatePayload
  ) {
    const companyTrips = this.activeTrips.get(payload.companyId);
    const trip = companyTrips?.get(payload.bookingId);

    if (!trip) {
      // Trip not registered or already ended
      this.logger.debug(
        `Received location update for unknown trip: ${payload.bookingId}`
      );
      return;
    }

    // Update stored trip location
    trip.lat = payload.lat;
    trip.lng = payload.lng;
    trip.speed = payload.speed;
    trip.lastSeen = new Date().toISOString();

    // Broadcast location to all managers viewing this company
    const room = `corporate:${payload.companyId}:active-trips`;
    this.server.to(room).emit('trip:location-updated', {
      bookingId: payload.bookingId,
      userId: payload.userId,
      lat: payload.lat,
      lng: payload.lng,
      speed: payload.speed,
      heading: payload.heading,
      accuracy: payload.accuracy,
      timestamp: payload.timestamp,
    });

    // Log each manager who receives this location update
    // Get all portals in the room and log their access
    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) {
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo && clientInfo.role === 'portal') {
        // Audit: manager viewed employee location
        await this.auditLogService.log({
          action: 'location_viewed',
          actorId: clientInfo.userId,
          actorEmail: clientInfo.email,
          targetUserId: payload.userId,
          companyId: payload.companyId,
          bookingId: payload.bookingId,
          service: 'corporate-tracking-gateway',
          ipAddress: clientInfo.ipAddress,
          metadata: {
            lat: payload.lat,
            lng: payload.lng,
            speed: payload.speed,
          },
        });
      }
    }
  }

  /**
   * Employee ends trip (location sharing stops)
   * All managers lose access to this employee's location
   */
  @SubscribeMessage('employee:trip-end')
  async handleTripEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TripStatusPayload
  ) {
    try {
      const ipAddress =
        (client.handshake.headers['x-forwarded-for'] as string) ||
        client.handshake.address ||
        'unknown';
      const clientInfo = this.connectedClients.get(client.id);

      // Remove from active trips
      const companyTrips = this.activeTrips.get(payload.companyId);
      if (companyTrips) {
        companyTrips.delete(payload.bookingId);
      }

      // Notify all managers that this trip has ended
      const room = `corporate:${payload.companyId}:active-trips`;
      this.server.to(room).emit('trip:ended', {
        bookingId: payload.bookingId,
        userId: payload.userId,
        timestamp: payload.timestamp,
        status: payload.status,
      });

      this.logger.log(
        `Trip ended: booking ${payload.bookingId} by ${payload.userId} (status: ${payload.status})`
      );

      // Audit log: trip tracking ended
      await this.auditLogService.log({
        action: 'trip_tracking_ended',
        actorId: payload.userId,
        actorEmail: clientInfo?.email || 'employee@company.com',
        companyId: payload.companyId,
        bookingId: payload.bookingId,
        service: 'corporate-tracking-gateway',
        ipAddress,
        metadata: { status: payload.status },
      });
    } catch (error) {
      this.logger.error(`Error ending trip: ${error.message}`, error.stack);
      client.emit('error', {
        message: 'Failed to end trip',
        error: error.message,
      });
    }
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
   * Manager views a specific employee's location
   * Called when manager clicks on an employee in the tracking dashboard
   */
  async logManagerViewedLocation(
    managerId: string,
    managerEmail: string,
    employeeId: string,
    companyId: string,
    bookingId: string,
    ipAddress: string
  ) {
    try {
      await this.auditLogService.log({
        action: 'location_viewed',
        actorId: managerId,
        actorEmail: managerEmail,
        targetUserId: employeeId,
        companyId: companyId,
        bookingId: bookingId,
        service: 'corporate-tracking-gateway',
        ipAddress,
      });
    } catch (error) {
      this.logger.error(
        `Failed to log location view: ${error.message}`,
        error.stack
      );
      // Don't throw — failure to log shouldn't break the user experience
    }
  }

  /**
   * Public method to allow external services to broadcast location updates
   * (e.g., from REST API or scheduled jobs)
   */
  broadcastLocationUpdatePublic(
    companyId: string,
    update: LocationUpdatePayload
  ) {
    const room = `corporate:${companyId}:active-trips`;
    this.server.to(room).emit('trip:location-updated', update);
  }
}
