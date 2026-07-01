import { Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppCallingService } from './whatsapp-calling.service';

/**
 * WhatsAppCallingController — endpoint INTERNO que recibe los eventos de llamada
 * de WhatsApp reenviados por customer-support-service (que hospeda el webhook
 * único del WABA). Protegido por INTERNAL_SERVICE_TOKEN.
 */
@Controller('whatsapp')
export class WhatsAppCallingController {
  private readonly logger = new Logger(WhatsAppCallingController.name);
  private readonly internalToken: string;

  constructor(
    config: ConfigService,
    private readonly calling: WhatsAppCallingService,
  ) {
    this.internalToken = config.get<string>('INTERNAL_SERVICE_TOKEN') || '';
  }

  @Post('calling')
  @HttpCode(HttpStatus.OK)
  async calling_event(
    @Body() value: any,
    @Headers('x-internal-token') token?: string,
  ): Promise<{ ok: boolean }> {
    // Si hay token configurado, exigir match (en dev sin token, se permite).
    if (this.internalToken && token !== this.internalToken) {
      this.logger.warn('[wa-call] token interno inválido — rechazado');
      return { ok: false };
    }
    await this.calling.handleEvent(value).catch((e) =>
      this.logger.error(`[wa-call] handleEvent falló: ${(e as Error).message}`),
    );
    return { ok: true };
  }
}
