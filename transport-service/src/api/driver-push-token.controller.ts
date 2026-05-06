import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import {
  DriverPushTokenModelSchema,
  DriverPushTokenDocument,
} from '../infrastructure/persistence/schemas/driver-push-token.schema';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
}

interface RegisterTokenDto {
  expoPushToken: string;
  platform?: 'ios' | 'android' | 'web';
}

/**
 * Endpoint para que el mobile-driver-app registre/actualice su Expo push token.
 *
 * Idempotente: upsert por driverId. Cada login refresca el token (los tokens
 * de Expo pueden rotar — registrar en cada login asegura que tengamos el más
 * reciente).
 *
 * Path: POST /transport/drivers/me/push-token
 * (api-gateway proxea /transport/* a transport-service)
 */
@Controller('transport/drivers/me')
@UseGuards(JwtAuthGuard)
export class DriverPushTokenController {
  constructor(
    @InjectModel(DriverPushTokenModelSchema.name)
    private readonly tokenModel: Model<DriverPushTokenDocument>,
  ) {}

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  async registerToken(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterTokenDto,
  ): Promise<{ ok: true }> {
    if (!body?.expoPushToken) {
      return { ok: true }; // silencioso — no failable, push es best-effort
    }
    await this.tokenModel.updateOne(
      { driverId: user.id },
      {
        $set: {
          driverId: user.id,
          expoPushToken: body.expoPushToken,
          platform: body.platform ?? 'unknown',
        },
      },
      { upsert: true },
    );
    return { ok: true };
  }
}
