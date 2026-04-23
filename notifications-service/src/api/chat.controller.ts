import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, IMessageRepository } from '../../domain/ports';
import {
  SendMessageDto,
  MessageResponseDto,
  MarkReadDto,
  ConversationDto,
} from './dtos/send-message.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat Controller
 * REST API endpoints for messaging
 */
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @Inject(IMessageRepository)
    private messageRepository: IMessageRepository
  ) {}
  /**
   * Send a message
   * POST /api/chats/rides/:rideId/messages
   */
  @Post('rides/:rideId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: any,
    @Param('rideId') rideId: string,
    @Body() dto: SendMessageDto
  ): Promise<MessageResponseDto> {
    const messageId = uuidv4();
    const message = await this.messageRepository.create({
      id: messageId,
      rideId,
      senderId: user.id,
      receiverId: dto.receiverId,
      content: dto.content,
      attachments: dto.attachments || [],
      createdAt: new Date(),
    });

    return {
      messageId: message.id,
      rideId: message.rideId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: !message.readAt,
      createdAt: message.createdAt,
    };
  }

  /**
   * Get messages for a ride
   * GET /api/chats/rides/:rideId/messages
   */
  @Get('rides/:rideId/messages')
  async getMessages(
    @Param('rideId') rideId: string,
    @Query('limit') limit?: string
  ): Promise<MessageResponseDto[]> {
    const numLimit = limit ? Number(limit) : 50;
    const messages = await this.messageRepository.findByRideId(rideId, numLimit);
    return messages.map(m => ({
      messageId: m.id,
      rideId: m.rideId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      isRead: !!m.readAt,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Get conversation between user and another user
   * GET /api/chats/rides/:rideId/conversation
   */
  @Get('rides/:rideId/conversation')
  async getConversation(
    @CurrentUser() user: any,
    @Param('rideId') rideId: string,
    @Query('otherUserId') otherUserId: string,
    @Query('limit') limit?: string
  ): Promise<ConversationDto> {
    const numLimit = limit ? Number(limit) : 50;
    const messages = await this.messageRepository.findConversation(
      rideId,
      user.id,
      otherUserId,
      numLimit
    );

    const unreadCount = messages.filter(m => !m.readAt && m.receiverId === user.id).length;

    return {
      messages: messages.map(m => ({
        messageId: m.id,
        rideId: m.rideId,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: !!m.readAt,
        createdAt: m.createdAt,
      })),
      unreadCount,
    };
  }

  /**
   * Mark message as read
   * PUT /api/chats/messages/:messageId/read
   */
  @Put('messages/:messageId/read')
  async markAsRead(
    @Param('messageId') messageId: string
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.markAsRead(messageId);
    return {
      messageId: message.id,
      rideId: message.rideId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      isRead: !!message.readAt,
      createdAt: message.createdAt,
    };
  }

  /**
   * Get unread messages
   * GET /api/chats/unread
   */
  @Get('unread')
  async getUnreadMessages(
    @CurrentUser() user: any
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.findUnreadForUser(user.id);
    return messages.map(m => ({
      messageId: m.id,
      rideId: m.rideId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      isRead: !!m.readAt,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Delete a message
   * DELETE /api/chats/messages/:messageId
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@Param('messageId') messageId: string): Promise<void> {
    await this.messageRepository.delete(messageId);
  }
}
