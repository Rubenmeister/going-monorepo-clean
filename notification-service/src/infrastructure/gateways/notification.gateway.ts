/**
 * Notification WebSocket Gateway
 * Real-time notification delivery via Socket.io
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Notification } from '../../domain/models/notification.model';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:4200',
      'http://localhost:5173',
    ],
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userConnections = new Map<string, Set<string>>();
  private socketToUserMap = new Map<
    string,
    { userId: string; companyId: string }
  >();

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send connection acknowledgement
    client.emit('connection:success', {
      message: 'Connected to notification gateway',
      socketId: client.id,
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userInfo = this.socketToUserMap.get(client.id);

    if (userInfo) {
      const userConnections = this.userConnections.get(userInfo.userId);
      if (userConnections) {
        userConnections.delete(client.id);

        if (userConnections.size === 0) {
          this.userConnections.delete(userInfo.userId);
        }
      }

      this.socketToUserMap.delete(client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to notifications
   * @param data Subscription data with userId and companyId
   * @param client Socket client
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { userId: string; companyId: string },
    @ConnectedSocket() client: Socket
  ): void {
    try {
      const { userId, companyId } = data;

      if (!userId || !companyId) {
        client.emit('subscribe:error', {
          message: 'userId and companyId are required',
        });
        return;
      }

      // Store user connection
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId).add(client.id);
      this.socketToUserMap.set(client.id, { userId, companyId });

      // Join company and user-specific rooms
      client.join(`company:${companyId}`);
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} subscribed from company ${companyId}`);

      client.emit('subscribe:success', {
        message: 'Subscribed to notifications',
        userId,
        companyId,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Subscribe error: ${error}`);
      client.emit('subscribe:error', {
        message: 'Failed to subscribe',
        error: error.message,
      });
    }
  }

  /**
   * Unsubscribe from notifications
   * @param data Unsubscribe data
   * @param client Socket client
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { userId: string; companyId: string },
    @ConnectedSocket() client: Socket
  ): void {
    try {
      const { userId, companyId } = data;

      // Leave rooms
      client.leave(`company:${companyId}`);
      client.leave(`user:${userId}`);

      // Remove from tracking
      const userConnections = this.userConnections.get(userId);
      if (userConnections) {
        userConnections.delete(client.id);
      }
      this.socketToUserMap.delete(client.id);

      this.logger.log(`User ${userId} unsubscribed`);

      client.emit('unsubscribe:success', {
        message: 'Unsubscribed from notifications',
      });
    } catch (error) {
      this.logger.error(`Unsubscribe error: ${error}`);
      client.emit('unsubscribe:error', {
        message: 'Failed to unsubscribe',
        error: error.message,
      });
    }
  }

  /**
   * Request all unread notifications
   * @param data Request data
   * @param client Socket client
   */
  @SubscribeMessage('notifications:request-unread')
  handleRequestUnread(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ): void {
    try {
      const { userId } = data;
      const userInfo = this.socketToUserMap.get(client.id);

      if (!userInfo || userInfo.userId !== userId) {
        client.emit('notifications:error', {
          message: 'Unauthorized',
        });
        return;
      }

      // This is handled by the notification service
      client.emit('notifications:request-ack', {
        message: 'Unread notifications request received',
        userId,
      });
    } catch (error) {
      this.logger.error(`Request error: ${error}`);
      client.emit('notifications:error', {
        message: 'Failed to request notifications',
        error: error.message,
      });
    }
  }

  /**
   * Mark notification as read
   * @param data Mark read data
   * @param client Socket client
   */
  @SubscribeMessage('notification:mark-read')
  handleMarkAsRead(
    @MessageBody() data: { notificationId: string; userId: string },
    @ConnectedSocket() client: Socket
  ): void {
    try {
      const { notificationId, userId } = data;
      const userInfo = this.socketToUserMap.get(client.id);

      if (!userInfo || userInfo.userId !== userId) {
        client.emit('notification:error', {
          message: 'Unauthorized',
        });
        return;
      }

      // Emit to user's room that notification was read
      this.server.to(`user:${userId}`).emit('notification:read', {
        notificationId,
        timestamp: new Date(),
      });

      client.emit('notification:mark-read-ack', {
        message: 'Notification marked as read',
        notificationId,
      });
    } catch (error) {
      this.logger.error(`Mark read error: ${error}`);
      client.emit('notification:error', {
        message: 'Failed to mark as read',
        error: error.message,
      });
    }
  }

  /**
   * Broadcast notification to user
   * @param notification Notification to broadcast
   */
  broadcastToUser(notification: Notification): void {
    try {
      this.server.to(`user:${notification.userId}`).emit('notification:new', {
        notification,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Notification broadcast to user ${notification.userId}: ${notification.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to broadcast to user: ${error}`);
    }
  }

  /**
   * Broadcast notification to company
   * @param companyId Company ID
   * @param notification Notification to broadcast
   */
  broadcastToCompany(companyId: string, notification: Notification): void {
    try {
      this.server.to(`company:${companyId}`).emit('notification:new', {
        notification,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Notification broadcast to company ${companyId}: ${notification.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to broadcast to company: ${error}`);
    }
  }

  /**
   * Send notification to specific socket
   * @param socketId Socket ID
   * @param notification Notification to send
   */
  sendToSocket(socketId: string, notification: Notification): void {
    try {
      this.server.to(socketId).emit('notification:new', {
        notification,
        timestamp: new Date(),
      });

      this.logger.debug(`Notification sent to socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Failed to send to socket: ${error}`);
    }
  }

  /**
   * Broadcast notification status update
   * @param userId User ID
   * @param notificationId Notification ID
   * @param status New status
   */
  broadcastStatusUpdate(
    userId: string,
    notificationId: string,
    status: string
  ): void {
    try {
      this.server.to(`user:${userId}`).emit('notification:status-update', {
        notificationId,
        status,
        timestamp: new Date(),
      });

      this.logger.debug(
        `Status update broadcast for notification ${notificationId}: ${status}`
      );
    } catch (error) {
      this.logger.error(`Failed to broadcast status update: ${error}`);
    }
  }

  /**
   * Get connected users count
   * @returns User count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get user connections
   * @param userId User ID
   * @returns Count of connections
   */
  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }
}
