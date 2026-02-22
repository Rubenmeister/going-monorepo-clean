/**
 * WebSocket JWT Authentication Guard
 * Validates JWT tokens for WebSocket connections
 *
 * Usage in gateways:
 * @WebSocketGateway({ ... })
 * export class MyGateway implements OnGatewayConnection {
 *   constructor(private wsJwtGuard: WebSocketJwtGuard) {}
 *
 *   handleConnection(client: Socket) {
 *     const authResult = this.wsJwtGuard.validateConnection(client);
 *     if (!authResult.isValid) {
 *       client.disconnect();
 *       return;
 *     }
 *     // Connection authorized
 *   }
 * }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { WebSocketJwtService } from '../services/websocket-jwt.service';

@Injectable()
export class WebSocketJwtGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketJwtGuard.name);

  constructor(private readonly wsJwtService: WebSocketJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();

      if (!client || !client.handshake) {
        this.logger.warn('Invalid WebSocket connection context');
        return false;
      }

      const authResult = await this.wsJwtService.authenticateConnection(client);

      if (!authResult.isValid) {
        this.logger.warn(
          `WebSocket authentication failed: ${authResult.error}`
        );
        client.disconnect(true);
        return false;
      }

      // Attach authentication data to socket for later use
      (client as any).user = {
        userId: authResult.userId,
        driverId: authResult.driverId,
        payload: authResult.payload,
      };

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in WebSocket JWT guard: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Validate connection without guard (for manual validation)
   * Useful for custom validation logic in gateway handlers
   */
  async validateConnection(client: Socket) {
    return this.wsJwtService.authenticateConnection(client);
  }
}
