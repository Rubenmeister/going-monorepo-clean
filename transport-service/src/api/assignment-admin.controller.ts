import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { DriverAssignmentService } from '../application/driver-assignment.service';

interface AuthUser {
  userId?: string;
  role?: string;
  roles?: string[];
}

/**
 * AssignmentAdminController — vista previa READ-ONLY del motor de asignación.
 * Muestra a quién elegiría el scorer para un corredor a una hora dada, con
 * TODOS los candidatos rankeados. No asigna ni persiste nada: sirve para
 * verificar el motor con datos reales (agendas sembradas) ANTES de automatizar.
 * Solo admin.
 */
@Controller('admin/assignment')
@UseGuards(JwtAuthGuard)
export class AssignmentAdminController {
  private readonly logger = new Logger(AssignmentAdminController.name);

  constructor(private readonly assignment: DriverAssignmentService) {}

  private assertAdmin(user: AuthUser): void {
    const roles = user.roles ?? (user.role ? [user.role] : []);
    if (!roles.includes('admin')) {
      throw new ForbiddenException('Solo administradores pueden ver la asignación');
    }
  }

  /**
   * GET /admin/assignment/preview?corridorId=RIO-UIO&at=2026-07-08T08:00
   *
   * Devuelve el mejor conductor y el ranking completo de candidatos
   * comprometidos al corredor cerca de esa hora. `at` en ISO (con o sin zona).
   */
  @Get('preview')
  async preview(
    @CurrentUser() user: AuthUser,
    @Query('corridorId') corridorId?: string,
    @Query('at') at?: string,
  ) {
    this.assertAdmin(user);

    if (!corridorId) {
      throw new BadRequestException('Falta corridorId');
    }
    const when = at ? new Date(at) : new Date();
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException(`Fecha inválida: ${at}`);
    }

    return this.assignment.previewAssignment(corridorId, when);
  }

  /**
   * GET /admin/assignment/confirm-preview?corridorId=RIO-UIO&at=...&currentDriverId=VSCHED_...
   *
   * Muestra la DECISIÓN que tomaría el cron día-anterior para un viaje con ese
   * conductor actual, SIN persistir ni notificar:
   *   - action='keep'     si el conductor sigue comprometido (definitivo = el mismo),
   *   - action='reassign' si se ausentó → chosenDriverId = mejor alterno,
   *   - action='none'     si nadie está comprometido al corredor/hora.
   * Prueba ambos caminos: pasa un VSCHED_ real (→ keep) o uno inventado (→ reassign).
   */
  @Get('confirm-preview')
  async confirmPreview(
    @CurrentUser() user: AuthUser,
    @Query('corridorId') corridorId?: string,
    @Query('at') at?: string,
    @Query('currentDriverId') currentDriverId?: string,
  ) {
    this.assertAdmin(user);

    if (!corridorId) throw new BadRequestException('Falta corridorId');
    if (!currentDriverId) throw new BadRequestException('Falta currentDriverId');
    const when = at ? new Date(at) : new Date();
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException(`Fecha inválida: ${at}`);
    }

    return this.assignment.confirmDecision(corridorId, when, currentDriverId);
  }

  /**
   * GET /admin/assignment/private-preview?pickupLat=&pickupLng=&dropoffLat=&dropoffLng=&at=&currentDriverId=
   *
   * Camino PRIVADO completo: deriva el corredor desde las coordenadas del viaje
   * y muestra la decisión del cron día-anterior. `corridorNull` = ruta urbana o
   * fuera de corredor → ese viaje va por realtime, no por el motor de agendas.
   */
  @Get('private-preview')
  async privatePreview(
    @CurrentUser() user: AuthUser,
    @Query('pickupLat') pickupLat?: string,
    @Query('pickupLng') pickupLng?: string,
    @Query('dropoffLat') dropoffLat?: string,
    @Query('dropoffLng') dropoffLng?: string,
    @Query('at') at?: string,
    @Query('currentDriverId') currentDriverId?: string,
  ) {
    this.assertAdmin(user);

    const nums = [pickupLat, pickupLng, dropoffLat, dropoffLng].map((n) => Number(n));
    if (nums.some((n) => !Number.isFinite(n))) {
      throw new BadRequestException('pickupLat/pickupLng/dropoffLat/dropoffLng son requeridos y numéricos');
    }
    const when = at ? new Date(at) : new Date();
    if (Number.isNaN(when.getTime())) throw new BadRequestException(`Fecha inválida: ${at}`);

    const corridor = this.assignment.resolveCorridorForCoords(nums[0], nums[1], nums[2], nums[3]);
    if (!corridor) {
      return { corridorNull: true, reason: 'urbano o fuera de corredor → va por realtime', decision: null };
    }
    const decision = await this.assignment.confirmDecision(
      corridor.corridorId,
      when,
      currentDriverId ?? '',
    );
    return { corridorNull: false, corridor, decision };
  }
}
