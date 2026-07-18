import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Logger,
  HttpCode,
} from '@nestjs/common';
import {
  CreateNotificationDto,
  SendNotificationUseCase,
} from '@going-monorepo-clean/domains-notification-application';
import { InternalServiceGuard } from '../infrastructure/auth/internal-service.guard';

/**
 * Notificaciones emitidas por OTROS SERVICIOS (no por un usuario).
 *
 * Prefijo aparte para NO heredar el JwtAuthGuard del NotificationController:
 * corporate-service emite avisos (aprobación pendiente, factura vencida) sin
 * que haya un usuario logueado detrás. Antes llamaba a /notifications/send sin
 * token y ese endpoint exige rol admin|system → ninguna notificación corporativa
 * salió jamás, en silencio.
 *
 * Protegido con X-Internal-Token (INTERNAL_SERVICE_TOKEN), igual que los
 * endpoints internos de billing-service.
 */
@Controller('notifications/internal')
@UseGuards(InternalServiceGuard)
export class NotificationInternalController {
  private readonly logger = new Logger(NotificationInternalController.name);

  constructor(private readonly sendNotificationUseCase: SendNotificationUseCase) {}

  /**
   * POST /notifications/internal/send
   *
   * Body: { userId, channel, title, body, data? }
   *   - channel: EMAIL | SMS | PUSH | WHATSAPP
   *   - data.phone: destino obligatorio cuando channel = WHATSAPP
   */
  @Post('send')
  @HttpCode(201)
  async send(@Body() dto: CreateNotificationDto) {
    if (!dto?.userId || !dto?.channel || !dto?.title || !dto?.body) {
      throw new BadRequestException('userId, channel, title y body son requeridos');
    }
    if (dto.channel === ('WHATSAPP' as any) && !(dto as any).data?.phone) {
      // Fallar aquí es mejor que crear la notificación y que el gateway la
      // descarte: el emisor se entera de que su aviso no va a llegar.
      throw new BadRequestException('WHATSAPP requiere data.phone');
    }

    const result = await this.sendNotificationUseCase.execute(dto);
    if (result.isErr()) {
      this.logger.warn(`Aviso interno falló: ${result.error.message}`);
      throw new BadRequestException(result.error.message);
    }
    return result.value;
  }
}
