import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { IncidentRepository } from '../infrastructure/persistence/incident.repository';
import { IncidentStatus } from '../infrastructure/schemas/incident.schema';

/**
 * Verifica un JWT aceptando HS256 (actual) y RS256 (futuro) — auditoría #13.
 * Servicio standalone: lógica dual replicada sin importar la lib del monorepo.
 */
function dualVerifyJwt(token: string, hsSecret: string): jwt.JwtPayload | string {
  const header = JSON.parse(
    Buffer.from(String(token).split('.')[0] ?? '', 'base64url').toString('utf8'),
  );
  if (header?.alg === 'RS256') {
    const pub = process.env.RS256_PUBLIC_KEY;
    if (!pub) throw new Error('Token RS256 pero RS256_PUBLIC_KEY no configurada');
    return jwt.verify(token, pub.replace(/\\n/g, '\n'), { algorithms: ['RS256'] });
  }
  return jwt.verify(token, hsSecret, { algorithms: ['HS256'] });
}

class UpdateIncidentDto {
  @IsOptional()
  @IsIn(['in_progress', 'resolved', 'false_alarm'])
  status?: 'in_progress' | 'resolved' | 'false_alarm';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  /**
   * operatorId opcional — si viene en JWT del operador, se ignora este field.
   * Si llamamos desde un script o sin JWT (dev), se acepta del body.
   */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  operatorId?: string;
}

/**
 * Endpoints para ops: listar incidentes activos y actualizarlos.
 *
 *   GET   /incidents?status=open&limit=50
 *   GET   /incidents/:id
 *   PATCH /incidents/:id   body: { status?, note?, operatorId? }
 *
 * Auth: JWT con role=admin u operator (chequeado en el controller — más
 * simple que un guard NestJS dado que es un solo servicio sin AuthModule
 * completo). En dev, SOS_ALLOW_UNAUTH=true salta también acá.
 *
 * No expuesto en api-gateway todavía — el admin-dashboard llama directo
 * (o vía proxy) hasta que armemos las rutas en api-gateway.
 */
@Controller('incidents')
export class IncidentsController {
  private readonly logger = new Logger(IncidentsController.name);
  private readonly jwtSecret: string;
  private readonly allowUnauth: boolean;

  constructor(
    private readonly repo: IncidentRepository,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret    = this.config.get<string>('JWT_SECRET') || '';
    this.allowUnauth  = this.config.get<string>('SOS_ALLOW_UNAUTH') === 'true';
  }

  @Get()
  async list(@Query('status') status?: string, @Query('limit') limitStr?: string, @Query('skip') skipStr?: string, @Req() req?: any) {
    this.requireOperator(req);
    const limit = Math.min(parseInt(limitStr ?? '50', 10) || 50, 200);
    const skip  = Math.max(parseInt(skipStr ?? '0', 10) || 0, 0);
    const validStatus = ['open', 'in_progress', 'resolved', 'false_alarm'].includes(status ?? '')
      ? (status as IncidentStatus)
      : undefined;
    const items = await this.repo.listByStatus(validStatus, limit, skip);
    return {
      items: items.map(i => ({
        id:                       i._id,
        userId:                   i.userId,
        channel:                  i.channel,
        emergencyType:            i.emergencyType,
        priority:                 i.priority,
        status:                   i.status,
        description:              i.description,
        location:                 { lat: i.location.coordinates[1], lng: i.location.coordinates[0] },
        accuracyM:                i.accuracyM,
        rideId:                   i.rideId,
        operatorId:               i.operatorId,
        emergencyDialerTriggered: i.emergencyDialerTriggered,
        notesCount:               i.notes?.length ?? 0,
        createdAt:                i.createdAt,
        updatedAt:                i.updatedAt,
        resolvedAt:               i.resolvedAt,
      })),
      limit,
      skip,
    };
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req?: any) {
    this.requireOperator(req);
    const inc = await this.repo.findById(id);
    if (!inc) throw new HttpException('incident not found', HttpStatus.NOT_FOUND);
    return {
      id:                       inc._id,
      userId:                   inc.userId,
      channel:                  inc.channel,
      emergencyType:            inc.emergencyType,
      priority:                 inc.priority,
      status:                   inc.status,
      description:              inc.description,
      location:                 { lat: inc.location.coordinates[1], lng: inc.location.coordinates[0] },
      accuracyM:                inc.accuracyM,
      rideId:                   inc.rideId,
      operatorId:               inc.operatorId,
      emergencyDialerTriggered: inc.emergencyDialerTriggered,
      notes:                    inc.notes,
      createdAt:                inc.createdAt,
      updatedAt:                inc.updatedAt,
      resolvedAt:               inc.resolvedAt,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateIncidentDto, @Req() req?: any) {
    const operatorId = this.requireOperator(req) ?? body.operatorId ?? 'unknown';

    let inc = await this.repo.findById(id);
    if (!inc) throw new HttpException('incident not found', HttpStatus.NOT_FOUND);

    if (body.note) {
      inc = await this.repo.addNote(id, operatorId, body.note);
    }
    if (body.status) {
      inc = await this.repo.updateStatus(id, body.status, operatorId);
    }

    return {
      id:         inc!._id,
      status:     inc!.status,
      operatorId: inc!.operatorId,
      updatedAt:  inc!.updatedAt,
      resolvedAt: inc!.resolvedAt,
    };
  }

  /**
   * Valida JWT y devuelve el operatorId (sub/userId) si role incluye 'admin'
   * u 'operator'. Devuelve null si allowUnauth está activo (modo dev).
   * Throw 401/403 si el token es inválido o sin role correcto.
   */
  private requireOperator(req: any): string | null {
    if (this.allowUnauth) return null;
    const auth = req?.headers?.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/);
    if (!m) throw new HttpException('missing Authorization Bearer token', HttpStatus.UNAUTHORIZED);
    if (!this.jwtSecret) throw new HttpException('JWT_SECRET not configured', HttpStatus.INTERNAL_SERVER_ERROR);

    let decoded: any;
    try {
      decoded = dualVerifyJwt(m[1], this.jwtSecret);
    } catch (err) {
      throw new HttpException(`invalid JWT: ${(err as Error).message}`, HttpStatus.UNAUTHORIZED);
    }
    const role  = decoded?.role || '';
    const roles: string[] = Array.isArray(decoded?.roles) ? decoded.roles : (role ? [role] : []);
    const isOps = roles.some(r => r === 'admin' || r === 'operator' || r === 'super_admin');
    if (!isOps) {
      throw new HttpException(`role insuficiente: ${roles.join(',') || '(none)'}`, HttpStatus.FORBIDDEN);
    }
    return decoded?.userId || decoded?.sub || null;
  }
}
