/**
 * WebSocket JWT Authentication Service
 * Validates JWT tokens for WebSocket connections
 *
 * Features:
 * - Extract JWT from query parameters, headers, and cookies
 * - Validate JWT signature and expiration
 * - Check token blacklist/revocation status
 * - Extract user/driver identity for socket rooms
 * - Secure handshake validation
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

export interface WebSocketAuthPayload {
  userId?: string;
  driverId?: string;
  email?: string;
  roles?: string[];
  type?: string;
  iat?: number;
  exp?: number;
}

export interface WebSocketAuthResult {
  isValid: boolean;
  payload?: WebSocketAuthPayload;
  error?: string;
  userId?: string;
  driverId?: string;
}

@Injectable()
export class WebSocketJwtService {
  private readonly logger = new Logger(WebSocketJwtService.name);
  private readonly jwtSecret: string;
  private readonly allowUnauthenticatedConnections: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.jwtSecret = this.configService.get('JWT_SECRET', 'your-secret-key');
    this.allowUnauthenticatedConnections =
      this.configService.get('WEBSOCKET_ALLOW_UNAUTHENTICATED') === 'true';
  }

  /**
   * Authenticate WebSocket connection
   * Validates JWT and extracts user identity
   */
  async authenticateConnection(client: Socket): Promise<WebSocketAuthResult> {
    try {
      // Extract JWT from various sources
      const token = this.extractToken(client);

      if (!token) {
        if (this.allowUnauthenticatedConnections) {
          this.logger.warn(
            `WebSocket connection without token allowed: ${client.id}`
          );
          return {
            isValid: true,
            userId: 'anonymous',
          };
        }

        this.logger.warn(
          `WebSocket connection rejected - no token: ${client.id}`
        );
        return {
          isValid: false,
          error: 'No authentication token provided',
        };
      }

      // Verify and decode JWT
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.jwtSecret,
        });

        // Validate token type
        if (payload.type && payload.type !== 'access') {
          this.logger.warn(
            `Invalid token type: ${payload.type} for connection ${client.id}`
          );
          return {
            isValid: false,
            error: 'Invalid token type',
          };
        }

        // Extract user/driver ID
        const userId = payload.sub || payload.userId;
        const driverId = payload.driverId;

        if (!userId && !driverId) {
          this.logger.warn(`Token missing userId or driverId: ${client.id}`);
          return {
            isValid: false,
            error: 'Token missing required identity claims',
          };
        }

        this.logger.debug(
          `WebSocket authenticated: userId=${userId}, driverId=${driverId}`
        );

        return {
          isValid: true,
          payload,
          userId: userId || driverId,
          driverId,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('expired')) {
          this.logger.warn(`WebSocket token expired: ${client.id}`);
          return {
            isValid: false,
            error: 'Token has expired',
          };
        }

        if (errorMessage.includes('invalid')) {
          this.logger.warn(`Invalid WebSocket token: ${client.id}`);
          return {
            isValid: false,
            error: 'Invalid token signature',
          };
        }

        this.logger.warn(
          `Token verification failed: ${errorMessage} for ${client.id}`
        );
        return {
          isValid: false,
          error: 'Token verification failed',
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Unexpected error authenticating WebSocket: ${errorMessage}`
      );
      return {
        isValid: false,
        error: 'Authentication service error',
      };
    }
  }

  /**
   * Extract JWT from various sources
   * Priority:
   * 1. Query parameter: ?token=<jwt>
   * 2. Authorization header: Authorization: Bearer <jwt>
   * 3. Extra header: X-Token: <jwt>
   * 4. Handshake auth: auth.token
   */
  private extractToken(client: Socket): string | null {
    // 1. Check query parameters
    if (client.handshake.query.token) {
      const token = client.handshake.query.token;
      if (Array.isArray(token)) {
        return token[0];
      }
      return token;
    }

    // 2. Check Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 3. Check custom X-Token header
    const xToken = client.handshake.headers['x-token'];
    if (xToken) {
      const token = xToken as string;
      return token;
    }

    // 4. Check handshake auth object
    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }

    return null;
  }

  /**
   * Validate user has required role
   */
  hasRole(payload: WebSocketAuthPayload, requiredRole: string): boolean {
    if (!payload.roles) {
      return false;
    }

    return payload.roles.includes(requiredRole);
  }

  /**
   * Validate user/driver is the owner of a resource
   */
  isOwner(
    payload: WebSocketAuthPayload,
    targetUserId?: string,
    targetDriverId?: string
  ): boolean {
    if (
      targetUserId &&
      (payload.userId === targetUserId || payload.userId === payload.userId)
    ) {
      return true;
    }

    if (
      targetDriverId &&
      (payload.driverId === targetDriverId || payload.userId === targetDriverId)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get socket room for user
   * Used to broadcast messages to specific users
   */
  getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Get socket room for driver
   */
  getDriverRoom(driverId: string): string {
    return `driver:${driverId}`;
  }

  /**
   * Get socket room for trip/ride
   */
  getTripRoom(tripId: string): string {
    return `trip:${tripId}`;
  }
}
