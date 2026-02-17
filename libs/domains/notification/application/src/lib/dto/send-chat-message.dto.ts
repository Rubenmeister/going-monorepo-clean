import { IsNotEmpty, IsUUID, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendChatMessageDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  tripId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  senderId: string;

  @ApiProperty({ example: 'user', enum: ['user', 'driver', 'admin'] })
  @IsNotEmpty()
  @IsIn(['user', 'driver', 'admin'])
  senderRole: string;

  @ApiProperty({ example: '770e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  recipientId: string;

  @ApiProperty({ example: 'Estoy llegando en 5 minutos' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
