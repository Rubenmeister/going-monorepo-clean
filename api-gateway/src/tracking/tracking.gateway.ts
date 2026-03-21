import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { HttpService } from '@nestjs/axios';
import { Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { ITokenManager } from '@going-monorepo-clean/shared-domain';

@WebSocketGateway({
  cors: {
    origin: (
      process.env.WEBSOCKET_CORS_ORIGINS ||
      process.env.CORS_ORIGINS ||
      'http://localhost:3000,http://localhost:3001'
    ).split(','),
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private trackingServiceHttpUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject('ITokenManager')
    private readonly tokenManager: ITokenManager
  ) {
    // URL del endpoint HTTP del tracking-service
    this.trackingServiceHttpUrl = `${this.configService.get(
      'TRACKING_SERVICE_URL'
    )}/tracking`;
  }

  /**
   * WebSocket Connection Handler with JWT Validation
   * Validates JWT token from:
   * 1. Query parameter: ?token=<jwt>
   * 2. Handshake auth header: Authorization: Bearer <jwt>
   *
   * Disconnects client if:
   * - No token provided
   * - Token is invalid or expired
   * - Token is revoked/blacklisted
   */
  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake query or auth header
      const token =
        client.handshake.query.token ||
        (client.handshake.headers.authorization?.split(' ')[1] ?? null);

      if (!token) {
        this.logger.warn(
          `WebSocket connection rejected: No JWT token provided (${client.id})`
        );
        client.disconnect(true);
        return;
      }

      // Verify JWT signature and expiration
      let payload: any;
      try {
        payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
      } catch (error) {
        this.logger.warn(
          `WebSocket connection rejected: Invalid JWT token (${client.id}): ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        client.disconnect(true);
        return;
      }

      // Check if token is revoked (blacklisted)
      const isBlacklistedResult = await this.tokenManager.isAccessTokenRevoked(
        token
      );

      if (isBlacklistedResult.isErr()) {
        this.logger.error(
          `WebSocket connection error checking token blacklist (${client.id}): ${isBlacklistedResult.error.message}`
        );
        client.disconnect(true);
        return;
      }

      if (isBlacklistedResult.value) {
        this.logger.warn(
          `WebSocket connection rejected: Token revoked for user ${
            payload.sub || payload.userId
          } (${client.id})`
        );
        client.disconnect(true);
        return;
      }

      // Attach authenticated user to socket
      (client as any).userId = payload.sub || payload.userId;
      (client as any).email = payload.email;
      (client as any).roles = payload.roles || [];
      (client as any).token = token;

      // Join a room for the user (for targeted updates)
      const userId = payload.sub || payload.userId;
      client.join(`user:${userId}`);

      this.logger.log(
        `WebSocket connection authenticated: User ${userId} (${client.id})`
      );
    } catch (error) {
      this.logger.error(
        `Unexpected error during WebSocket connection: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Handle location updates from authenticated WebSocket clients
   * Requires JWT authentication (enforced by handleConnection)
   *
   * Validates:
   * - Client is authenticated
   * - Payload has required fields (latitude, longitude)
   * - User ID matches the authenticated user
   */
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<void> {
    try {
      // Verify client is authenticated
      const userId = (client as any).userId;
      if (!userId) {
        this.logger.warn(
          `Unauthorized location update attempt from socket ${client.id}`
        );
        client.emit('error', {
          message: 'Unauthorized: JWT authentication required',
        });
        return;
      }

      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        this.logger.warn(
          `Invalid location update payload from user ${userId}: not an object`
        );
        client.emit('error', {
          message: 'Invalid payload: must be an object',
        });
        return;
      }

      const { latitude, longitude } = payload;

      // Validate required coordinates
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude)
      ) {
        this.logger.warn(
          `Invalid coordinates from user ${userId}: lat=${latitude}, lon=${longitude}`
        );
        client.emit('error', {
          message:
            'Invalid coordinates: latitude and longitude must be valid numbers',
        });
        return;
      }

      // Validate coordinate ranges
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        this.logger.warn(
          `Out-of-range coordinates from user ${userId}: lat=${latitude}, lon=${longitude}`
        );
        client.emit('error', {
          message:
            'Invalid coordinates: latitude [-90, 90] and longitude [-180, 180]',
        });
        return;
      }

      // Forward to tracking-service with authenticated user info
      const requestPayload = {
        ...payload,
        userId, // Ensure userId is included from authenticated session
        timestamp: new Date().toISOString(),
      };

      await firstValueFrom(
        this.httpService.post(
          `${this.trackingServiceHttpUrl}/update-location-internal`,
          requestPayload
        )
      );

      this.logger.debug(
        `Location update processed for user ${userId}: lat=${latitude}, lon=${longitude}`
      );

      // Acknowledge to client
      client.emit('locationUpdateAcknowledged', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error processing location update from socket ${client.id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      client.emit('error', {
        message: 'Failed to process location update',
      });
    }
  }
}
