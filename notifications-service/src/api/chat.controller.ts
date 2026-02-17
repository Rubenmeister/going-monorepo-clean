import { Controller, Post, Body, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Roles, UUID } from '@going-monorepo-clean/shared-domain';
import {
  SendChatMessageUseCase,
  SendChatMessageDto,
  GetTripChatUseCase,
  MarkChatReadUseCase,
} from '@going-monorepo-clean/domains-notification-application';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly sendChatMessageUseCase: SendChatMessageUseCase,
    private readonly getTripChatUseCase: GetTripChatUseCase,
    private readonly markChatReadUseCase: MarkChatReadUseCase,
  ) {}

  @Post('send')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Send a chat message within a trip' })
  @ApiBody({ type: SendChatMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(@Body() dto: SendChatMessageDto) {
    return this.sendChatMessageUseCase.execute(dto);
  }

  @Get('trip/:tripId')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Get chat history for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max messages (default: 50)' })
  @ApiResponse({ status: 200, description: 'Array of chat messages' })
  async getTripChat(
    @Param('tripId') tripId: UUID,
    @Query('limit') limit?: string,
  ) {
    return this.getTripChatUseCase.execute(tripId, limit ? parseInt(limit, 10) : undefined);
  }

  @Patch('trip/:tripId/read/:recipientId')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Mark all chat messages in a trip as read for a recipient' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'recipientId', description: 'Recipient user ID' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markTripChatRead(
    @Param('tripId') tripId: UUID,
    @Param('recipientId') recipientId: UUID,
  ) {
    await this.markChatReadUseCase.execute(tripId, recipientId);
    return { message: 'Chat messages marked as read' };
  }
}
