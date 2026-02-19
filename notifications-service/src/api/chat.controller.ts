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
} from '@nestjs/common';
import { JwtAuthGuard } from '@going/shared-infrastructure';
import { CurrentUser } from '@going/shared-infrastructure';
import {
  SendMessageDto,
  MessageResponseDto,
  MarkReadDto,
  ConversationDto,
} from './dtos/send-message.dto';

/**
 * Chat Controller
 * REST API endpoints for messaging
 */
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
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
    // TODO: Save message and broadcast via WebSocket
    return {
      messageId: 'msg_123',
      rideId,
      senderId: user.id,
      receiverId: 'other_user_id',
      content: dto.content,
      isRead: false,
      createdAt: new Date(),
    };
  }

  /**
   * Get messages for a ride
   * GET /api/chats/rides/:rideId/messages
   */
  @Get('rides/:rideId/messages')
  async getMessages(
    @Param('rideId') rideId: string,
    @Query('limit') limit?: number
  ): Promise<MessageResponseDto[]> {
    // TODO: Fetch from repository
    return [];
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
    @Query('limit') limit?: number
  ): Promise<ConversationDto> {
    // TODO: Fetch conversation
    return {
      messages: [],
      unreadCount: 0,
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
    // TODO: Mark as read
    return {} as any;
  }

  /**
   * Get unread messages
   * GET /api/chats/unread
   */
  @Get('unread')
  async getUnreadMessages(
    @CurrentUser() user: any
  ): Promise<MessageResponseDto[]> {
    // TODO: Fetch unread messages
    return [];
  }

  /**
   * Delete a message
   * DELETE /api/chats/messages/:messageId
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@Param('messageId') messageId: string): Promise<void> {
    // TODO: Delete message
  }
}
