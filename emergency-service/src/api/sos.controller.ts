import { Body, Controller, HttpCode, HttpException, HttpStatus, Logger, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import * as jwt from 'jsonwebtoken';
import { SosService } from '../sos/sos.service';

class LocationDto {
  // @IsDefined explícito porque @IsLatitude() solo valida si lat existe —
  // undefined pasaría silenciosamente y explotaría más adelante con TypeError.
  //
  // Mensajes SIN el prefijo "location." — class-validator lo agrega solo
  // cuando reporta nested errors via @ValidateNested(). Si lo escribiéramos
  // explícito el path saldría duplicado: "location.location.lat is required".
  @IsDefined({ message: 'lat is required' })
  @IsLatitude()
  lat: number;

  @IsDefined({ message: 'lng is required' })
  @IsLongitude()
  lng: number;
}

class SosDto {
  @IsDefined({ message: 'userId is required' })
  @IsString()
  @MaxLength(128)
  userId: string;

  @IsDefined({ message: 'channel is required' })
  @IsIn(['mobile', 'web', 'whatsapp', 'telegram', 'voice', 'api'])
  channel: 'mobile' | 'web' | 'whatsapp' | 'telegram' | 'voice' | 'api';

  @IsOptional()
  @IsIn(['medical', 'accident', 'robbery', 'harassment', 'vehicle_breakdown', 'other'])
  emergencyType?: 'medical' | 'accident' | 'robbery' | 'harassment' | 'vehicle_breakdown' | 'other';

  // @IsDefined necesario aquí: @ValidateNested solo valida la estructura
  // INTERNA cuando el campo existe; undefined pasa el pipe sin error y luego
  // explota con TypeError al hacer body.location.lat en el handler.
  // Esto pasaba con clientes que mandaban {currentLat, currentLng} flat
  // (shape del transport-service /rides/:id/sos legacy) en vez del nested.
  @IsDefined({ message: 'location is required (shape: { lat, lng })' })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracyM?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  rideId?: string;

  /** El cliente ya disparó el dialer al 911 desde su app. */
  @IsOptional()
  @IsBoolean()
  emergencyDialerTriggered?: boolean;
}

/**
 * POST /sos — endpoint crítico. Autenticado vía JWT (header Authorization
 * Bearer). El userId del body DEBE coincidir con el `sub` del JWT — evita
 * que un cliente authenticated dispare SOS en nombre de otro.
 *
 * Excepción: si SOS_ALLOW_UNAUTH=true (solo dev/testing local), salta auth.
 * En producción NUNCA habilitar — un atacante podría spammear alertas al
 * equipo ops si descubre la URL.
 *
 * Response: 201 con incident { id, status, createdAt }.
 *
 * SLA objetivo: <300ms. Para cumplir, la notificación a ops queda
 * fire-and-forget. La persistencia en Mongo SÍ es síncrona.
 */
@Controller('sos')
export class SosController {
  private readonly logger = new Logger(SosController.name);
  private readonly jwtSecret: string;
  private readonly allowUnauth: boolean;

  constructor(
    private readonly sos: SosService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret    = this.config.get<string>('JWT_SECRET') || '';
    this.allowUnauth  = this.config.get<string>('SOS_ALLOW_UNAUTH') === 'true';

    if (this.allowUnauth) {
      this.logger.warn('[sos] SOS_ALLOW_UNAUTH=true — modo dev/testing. NO usar en producción.');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSos(@Body() body: SosDto, @Req() req: any) {
    // Auth — verifica JWT y matchea sub con body.userId
    if (!this.allowUnauth) {
      const auth = req.headers?.authorization || '';
      const m = auth.match(/^Bearer\s+(.+)$/);
      if (!m) throw new HttpException('missing Authorization Bearer token', HttpStatus.UNAUTHORIZED);
      if (!this.jwtSecret) throw new HttpException('JWT_SECRET not configured on server', HttpStatus.INTERNAL_SERVER_ERROR);
      let decoded: any;
      try {
        decoded = jwt.verify(m[1], this.jwtSecret);
      } catch (err) {
        throw new HttpException(`invalid JWT: ${(err as Error).message}`, HttpStatus.UNAUTHORIZED);
      }
      const jwtUserId = decoded?.userId || decoded?.sub || '';
      if (!jwtUserId) throw new HttpException('JWT sin userId/sub', HttpStatus.UNAUTHORIZED);
      if (jwtUserId !== body.userId) {
        throw new HttpException(
          `userId mismatch: jwt=${jwtUserId} body=${body.userId}`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const incident = await this.sos.createSos({
      userId:        body.userId,
      channel:       body.channel,
      emergencyType: body.emergencyType ?? 'other',
      description:   body.description,
      location:      { lat: body.location.lat, lng: body.location.lng },
      accuracyM:     body.accuracyM,
      rideId:        body.rideId,
      emergencyDialerTriggered: body.emergencyDialerTriggered,
    });

    return {
      id:        incident._id,
      status:    incident.status,
      priority:  incident.priority,
      createdAt: incident.createdAt,
      // Hint para el cliente: si está en mobile y aún no disparó el 911,
      // ahora es buen momento (el server ya tiene el ack persistido).
      shouldDial911: body.channel === 'mobile' && !body.emergencyDialerTriggered,
    };
  }
}
