import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * Send Message DTO
 */
export class SendMessageDto {
  @IsString()
  rideId: string;

  @IsString()
  content: string;

  @IsOptional()
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    size: number;
  }>;
}

/**
 * Message Response DTO
 */
export class MessageResponseDto {
  messageId: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    size: number;
  }>;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Mark Message Read DTO
 */
export class MarkReadDto {
  @IsString()
  messageId: string;
}

/**
 * Conversation DTO
 */
export class ConversationDto {
  messages: MessageResponseDto[];
  unreadCount: number;
  lastMessage?: MessageResponseDto;
}
