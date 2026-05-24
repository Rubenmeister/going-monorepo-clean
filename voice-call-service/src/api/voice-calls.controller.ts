import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { VoiceCallRepository } from '../infrastructure/persistence/voice-call.repository';
import type { VoiceCallStatus } from '../infrastructure/schemas/voice-call.schema';

/**
 * VoiceCallsController — endpoints de auditoría / dashboard.
 *
 *  GET /voice-calls            — histórico paginado (filter por status)
 *  GET /voice-calls/active     — solo las en progreso (operador real-time)
 *  GET /voice-calls/stats      — agregados por outcome últimas N horas
 *  GET /voice-calls/:id        — detalle de 1 llamada (transcript incluido)
 *
 * NOTA: estos endpoints exponen TRANSCRIPTS (PII). El api-gateway los
 * protege con JWT + verificará role admin/operator antes de routear.
 * Si el usuario es regular, debería rechazarlo en el gateway (no en este
 * service — keep el service simple).
 */
@Controller('voice-calls')
export class VoiceCallsController {
  constructor(private readonly repo: VoiceCallRepository) {}

  @Get()
  async list(
    @Query('limit')  limit?: string,
    @Query('status') status?: VoiceCallStatus,
  ) {
    const n = parseInt(limit ?? '50', 10);
    const safe = Number.isFinite(n) && n > 0 && n <= 200 ? n : 50;
    const list = await this.repo.recent(safe, status);
    return { count: list.length, calls: list };
  }

  @Get('active')
  async active() {
    const list = await this.repo.listActive(100);
    return { count: list.length, calls: list };
  }

  @Get('stats')
  async stats(@Query('hours') hoursStr?: string) {
    const hours = parseInt(hoursStr ?? '24', 10);
    const safeHours = Number.isFinite(hours) && hours > 0 && hours <= 720 ? hours : 24;
    const byOutcome = await this.repo.statsByOutcome(safeHours);
    const total = Object.values(byOutcome).reduce((s, n) => s + n, 0);
    return {
      windowHours: safeHours,
      total,
      byOutcome,
      // Tasas derivadas — útil para el dashboard sin recalcular en el frontend.
      abandonRate:    total > 0 ? (byOutcome['abandoned_by_caller'] ?? 0) / total : 0,
      escalationRate: total > 0 ? (byOutcome['escalated']           ?? 0) / total : 0,
      resolvedRate:   total > 0 ? (byOutcome['resolved_by_ai']      ?? 0) / total : 0,
    };
  }

  @Get(':callId')
  async getById(@Param('callId') callId: string) {
    const call = await this.repo.findById(callId);
    if (!call) throw new NotFoundException(`Call ${callId} not found`);
    return call;
  }
}
