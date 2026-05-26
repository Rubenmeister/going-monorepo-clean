/**
 * RecurringTripController — endpoints corporativos para viajes recurrentes.
 *
 * Todas las rutas requieren JWT con `companyId` (usuario corporativo).
 * El usuario B2C no puede crear recurrentes — el guard rechaza con 403.
 *
 *   GET    /recurring-trips        → list de la empresa del caller
 *   POST   /recurring-trips        → crear (id se genera server-side)
 *   PATCH  /recurring-trips/:id    → editar campos (no userId/companyId)
 *   DELETE /recurring-trips/:id    → borrar (hard delete + bookings futuros NO se cancelan)
 *   POST   /recurring-trips/:id/pause   → active=false
 *   POST   /recurring-trips/:id/resume  → active=true
 *
 * Los bookings ya generados por el cron NO se cancelan al borrar/pausar —
 * el usuario los gestiona desde /empresas/panel/viajes. Esto es intencional:
 * cancelar bookings que ya empezaron a moverse en logística sería destructivo.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import {
  RecurringTripRepository,
  RecurringTripCreateInput,
} from '../infrastructure/recurring-trip.repository';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
  companyId?: string;
}

interface CreateRecurringTripDto {
  name: string;
  serviceType: 'transport' | 'parcel';
  frequency: 'daily' | 'weekly' | 'monthly';
  weekDays?: number[];
  dayOfMonth?: number;
  time: string;
  origin: { address: string; latitude?: number; longitude?: number };
  destination: { address: string; latitude?: number; longitude?: number };
  vehicleType?: string;
  notes?: string;
}

type UpdateRecurringTripDto = Partial<CreateRecurringTripDto> & {
  active?: boolean;
};

function requireCompany(user: AuthUser): string {
  if (!user.companyId) {
    throw new ForbiddenException(
      'Solo usuarios corporativos pueden gestionar viajes recurrentes',
    );
  }
  return user.companyId;
}

function validateBody(body: CreateRecurringTripDto | UpdateRecurringTripDto): void {
  if (body.frequency === 'weekly') {
    if (!body.weekDays || body.weekDays.length === 0) {
      throw new BadRequestException(
        'frequency=weekly requiere weekDays (0=domingo .. 6=sábado)',
      );
    }
    for (const d of body.weekDays) {
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        throw new BadRequestException(`weekDay inválido: ${d} (0..6)`);
      }
    }
  }
  if (body.frequency === 'monthly') {
    if (!body.dayOfMonth || body.dayOfMonth < 1 || body.dayOfMonth > 28) {
      throw new BadRequestException(
        'frequency=monthly requiere dayOfMonth en rango 1..28',
      );
    }
  }
  if (body.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)) {
    throw new BadRequestException('time inválido (formato HH:MM, 24h)');
  }
}

@Controller('recurring-trips')
@UseGuards(JwtAuthGuard)
export class RecurringTripController {
  constructor(private readonly repo: RecurringTripRepository) {}

  /** GET /recurring-trips — todos los de la empresa del usuario. */
  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const companyId = requireCompany(user);
    return this.repo.findByCompany(companyId);
  }

  /** POST /recurring-trips */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateRecurringTripDto,
  ) {
    const companyId = requireCompany(user);
    if (!body.name?.trim()) throw new BadRequestException('name requerido');
    if (!body.origin?.address?.trim()) {
      throw new BadRequestException('origin.address requerido');
    }
    if (!body.destination?.address?.trim()) {
      throw new BadRequestException('destination.address requerido');
    }
    validateBody(body);

    const input: RecurringTripCreateInput = {
      id: randomUUID(),
      userId: user.id,
      companyId,
      name: body.name.trim(),
      serviceType: body.serviceType,
      frequency: body.frequency,
      weekDays: body.frequency === 'weekly' ? body.weekDays : undefined,
      dayOfMonth: body.frequency === 'monthly' ? body.dayOfMonth : undefined,
      time: body.time,
      origin: body.origin,
      destination: body.destination,
      vehicleType: body.vehicleType,
      notes: body.notes,
      active: true,
    };
    return this.repo.create(input);
  }

  /** PATCH /recurring-trips/:id */
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateRecurringTripDto,
  ) {
    const companyId = requireCompany(user);
    if (body.frequency || body.weekDays || body.dayOfMonth || body.time) {
      validateBody(body);
    }

    const updated = await this.repo.update(id, companyId, body);
    if (!updated) throw new NotFoundException('Recurrente no encontrado');
    return updated;
  }

  /** DELETE /recurring-trips/:id */
  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const companyId = requireCompany(user);
    const ok = await this.repo.delete(id, companyId);
    if (!ok) throw new NotFoundException('Recurrente no encontrado');
    return { deleted: true };
  }

  /** POST /recurring-trips/:id/pause */
  @Post(':id/pause')
  async pause(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const companyId = requireCompany(user);
    const updated = await this.repo.update(id, companyId, { active: false });
    if (!updated) throw new NotFoundException('Recurrente no encontrado');
    return updated;
  }

  /** POST /recurring-trips/:id/resume */
  @Post(':id/resume')
  async resume(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const companyId = requireCompany(user);
    const updated = await this.repo.update(id, companyId, { active: true });
    if (!updated) throw new NotFoundException('Recurrente no encontrado');
    return updated;
  }
}
