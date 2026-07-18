import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Logger,
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModelSchema } from '../infrastructure/user.schema';
import { Model } from 'mongoose';
import { timingSafeEqual } from 'crypto';

/**
 * Guard servicio-a-servicio por token compartido (X-Internal-Token).
 *
 * Se define aquí y NO se usa el prefijo `/auth/internal/*` a propósito: ese
 * prefijo está cubierto por RequestSignatureMiddleware (HMAC), que obligaría a
 * cada llamante a firmar. Para una consulta de contacto basta el token
 * compartido, el mismo patrón que ya usan billing y notifications.
 *
 * Fail-closed: sin INTERNAL_SERVICE_TOKEN configurado, rechaza todo.
 */
@Injectable()
class InternalTokenGuard implements CanActivate {
  private readonly logger = new Logger(InternalTokenGuard.name);
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const provided = req.headers?.['x-internal-token'];
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      this.logger.error('INTERNAL_SERVICE_TOKEN no configurado — auth fail-closed');
      throw new UnauthorizedException('Internal auth misconfigured');
    }
    if (typeof provided !== 'string') throw new UnauthorizedException('Falta X-Internal-Token');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('X-Internal-Token inválido');
    }
    return true;
  }
}

/**
 * Contacto de un usuario para ENVIARLE avisos (service-to-service).
 *
 * Existe porque corporate-service necesita el teléfono del aprobador para
 * avisarle por WhatsApp, y no hay usuario logueado detrás del aviso. El
 * `lookup-user` existente resuelve al revés (email/teléfono → userId) y va con
 * HMAC.
 *
 * Devuelve SOLO lo necesario para notificar (teléfono, email, nombre): nada más
 * de PII.
 */
@Controller('auth/svc')
@UseGuards(InternalTokenGuard)
export class UserContactController {
  constructor(@InjectModel(UserModelSchema.name) private readonly userModel: Model<any>) {}

  /** GET /auth/svc/contact?userId=... */
  @Get('contact')
  async contact(@Query('userId') userId?: string) {
    const id = String(userId ?? '').trim();
    if (!id) throw new BadRequestException('userId requerido');

    const u = await this.userModel
      .findOne({ id })
      .select('id firstName lastName email phone')
      .lean();

    if (!u) return { found: false };
    return {
      found: true,
      userId: (u as any).id,
      firstName: (u as any).firstName ?? '',
      lastName: (u as any).lastName ?? '',
      email: (u as any).email ?? null,
      phone: (u as any).phone ?? null,
    };
  }
}
