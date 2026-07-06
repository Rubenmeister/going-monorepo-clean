import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from './admin-token.guard';
import { RuleService } from '../application/rule.service';

/**
 * Administración de REGLAS de recargo del motor (F4) — en vivo, sin deploy.
 * /admin/rules, protegido por AdminTokenGuard (header x-admin-token).
 */
@Controller('admin/rules')
@UseGuards(AdminTokenGuard)
export class RuleAdminController {
  constructor(private readonly rules: RuleService) {}

  /** Lista todas las reglas. */
  @Get()
  list() {
    return this.rules.list();
  }

  /** Crea o actualiza una regla (upsert por name). */
  @Post()
  @HttpCode(200)
  upsert(@Body() body: {
    name: string;
    active?: boolean;
    group?: string;
    priority?: number;
    scope?: Record<string, unknown>;
    condition?: Record<string, unknown>;
    effect?: Record<string, unknown>;
    validFrom?: string | null;
    validTo?: string | null;
  }) {
    return this.rules.upsert(body);
  }

  /** Activa/desactiva una regla. */
  @Post(':id/active')
  @HttpCode(200)
  setActive(@Param('id') id: string, @Body() body: { active: boolean }) {
    return this.rules.setActive(id, body?.active !== false);
  }

  /** Elimina una regla. */
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.rules.remove(id);
  }
}
