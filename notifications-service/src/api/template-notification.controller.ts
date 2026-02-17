import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Roles } from '@going-monorepo-clean/shared-domain';
import {
  SendTemplateNotificationUseCase,
  SendTemplateNotificationDto,
} from '@going-monorepo-clean/domains-notification-application';

@ApiTags('notifications')
@Controller('notifications')
export class TemplateNotificationController {
  constructor(
    private readonly sendTemplateNotificationUseCase: SendTemplateNotificationUseCase,
  ) {}

  @Post('send-template')
  @Roles('admin')
  @ApiOperation({ summary: 'Send a template-based notification (with optional WhatsApp)' })
  @ApiBody({ type: SendTemplateNotificationDto })
  @ApiResponse({ status: 201, description: 'Template notification sent' })
  @ApiResponse({ status: 400, description: 'Invalid template name or variables' })
  async sendTemplateNotification(@Body() dto: SendTemplateNotificationDto) {
    await this.sendTemplateNotificationUseCase.execute(dto);
    return { message: 'Template notification sent' };
  }
}
