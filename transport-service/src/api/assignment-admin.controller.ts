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
}
