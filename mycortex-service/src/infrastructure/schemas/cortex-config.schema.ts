import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Single-document collection que guarda la configuración runtime de MyCortex.
 * Editable desde admin-dashboard (no requiere redeploy).
 *
 * El documento tiene un `_id` fijo `'singleton'` — siempre upsertamos a ese id.
 * Eso simplifica la lógica del repo (no hay "qué doc agarrar") y previene
 * que alguien cree múltiples documents por error.
 *
 * Fields editables hoy (Fase 2):
 *   - systemPrompt: texto del system prompt que se envía a Claude
 *
 * Fields agregables (Fase 3):
 *   - model, maxTokens, pollIntervalMin, enabled
 *
 * Hot-reload: CortexConfigService cachea el doc 60s. Cuando admin guarda
 * cambios, el próximo cron (max 60s después) los aplica sin restart.
 */
@Schema({
  collection: 'cortex_config',
  timestamps: { createdAt: false, updatedAt: 'updatedAt' },
})
export class CortexConfig {
  /** Siempre 'singleton' — coincidir en queries para upsertar el mismo doc. */
  @Prop({ type: String, required: true, default: 'singleton' })
  _id!: string;

  /**
   * System prompt completo de MyCortex. Si está vacío o null, el
   * PromptBuilderService cae al default hardcodeado (defensa: el sistema
   * nunca debe romperse porque alguien borró el prompt en la UI).
   */
  @Prop({ type: String, required: false, default: '' })
  systemPrompt!: string;

  /**
   * Modelo de Anthropic. Si vacío, AnthropicClient usa MYCORTEX_MODEL env
   * (default 'claude-sonnet-4-5'). Solo permitidos los 3 modelos soportados
   * por MyCortex hoy — la UI restringe el selector.
   */
  @Prop({ type: String, required: false, default: '' })
  model!: string;

  /** Max tokens del response. Si null, AnthropicClient usa default (2500). */
  @Prop({ type: Number, required: false })
  maxTokens?: number;

  /**
   * Intervalo del razonamiento en minutos. Si null, usa el @Cron hardcoded
   * (30 min). Editar esto NO cambia el cron real — el reasoning loop lee
   * este valor y skippea ciclos si no toca todavía. (Phase 3)
   */
  @Prop({ type: Number, required: false })
  pollIntervalMin?: number;

  /**
   * Toggle para apagar MyCortex sin desactivar la env var. Si false, el
   * cron logea "disabled by config" y skippea. Si null o true, corre normal.
   */
  @Prop({ type: Boolean, required: false, default: true })
  enabled?: boolean;

  /** Cuándo y quién hizo el último cambio (audit trail liviano). */
  @Prop({ type: Date, required: false })
  updatedAt?: Date;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type CortexConfigDocument = HydratedDocument<CortexConfig>;
export const CortexConfigSchema = SchemaFactory.createForClass(CortexConfig);
