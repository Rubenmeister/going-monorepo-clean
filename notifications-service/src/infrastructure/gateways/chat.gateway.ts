import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Chat Gateway
 * WebSocket server for real-time messaging
 */
@WebSocketGateway({
  namespace: 'chat',
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
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userConnections = new Map<string, string>(); // userId -> socketId
  private rideRooms = new Map<string, Set<string>>(); // rideId -> Set<socketId>

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.findUserIdBySocketId(client.id);
    if (userId) {
      this.userConnections.delete(userId);
      this.logger.log(`User disconnected: ${userId}`);
    }
  }

  /**
   * User joins chat for a ride
   */
  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; userId: string }
  ) {
    this.userConnections.set(data.userId, client.id);
    const room = `ride:${data.rideId}`;
    client.join(room);

    if (!this.rideRooms.has(data.rideId)) {
      this.rideRooms.set(data.rideId, new Set());
    }
    this.rideRooms.get(data.rideId)!.add(client.id);

    this.logger.log(`User ${data.userId} joined chat for ride ${data.rideId}`);
    client.emit('chat:joined', { success: true });
  }

  /**
   * Send a chat message
   */
  @SubscribeMessage('chat:message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      rideId: string;
      messageId: string;
      senderId: string;
      receiverId: string;
      content: string;
    }
  ) {
    const room = `ride:${data.rideId}`;

    this.server.to(room).emit('chat:message:received', {
      messageId: data.messageId,
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Message from ${data.senderId} in ride ${data.rideId}`);
  }

  /**
   * Mark message as read
   */
  @SubscribeMessage('chat:message:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { rideId: string; messageId: string; userId: string }
  ) {
    const room = `ride:${data.rideId}`;

    this.server.to(room).emit('chat:message:read', {
      messageId: data.messageId,
      readBy: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * User is typing indicator
   */
  @SubscribeMessage('chat:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; userId: string }
  ) {
    const room = `ride:${data.rideId}`;

    this.server.to(room).emit('chat:user:typing', {
      userId: data.userId,
    });
  }

  /**
   * User left chat
   */
  @SubscribeMessage('chat:leave')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; userId: string }
  ) {
    const room = `ride:${data.rideId}`;
    client.leave(room);

    if (this.rideRooms.has(data.rideId)) {
      this.rideRooms.get(data.rideId)!.delete(client.id);
    }

    this.logger.log(`User ${data.userId} left chat for ride ${data.rideId}`);
  }

  /**
   * Find user by socket ID
   */
  private findUserIdBySocketId(socketId: string): string | null {
    for (const [userId, connectedSocketId] of this.userConnections) {
      if (connectedSocketId === socketId) {
        return userId;
      }
    }
    return null;
  }

  /**
   * Broadcast message to ride room
   */
  broadcastToRide(rideId: string, event: string, data: any): void {
    const room = `ride:${rideId}`;
    this.server.to(room).emit(event, data);
  }

  /**
   * Get connected users count for ride
   */
  getConnectedUsersForRide(rideId: string): number {
    return this.rideRooms.get(rideId)?.size || 0;
  }
}
