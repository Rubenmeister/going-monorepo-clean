import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { CortexConfigService } from './cortex-config.service';

/**
 * Wrapper de Anthropic SDK con retry-on-rate-limit y métricas de costo.
 *
 * Modelos soportados (override desde admin-dashboard o env MYCORTEX_MODEL):
 *   - claude-sonnet-4-5 (default)  — calidad/precio sweet spot para razonamiento corto
 *   - claude-opus-4-5             — mejor para world models complejos / decisiones de alto costo
 *   - claude-haiku-4-5            — más barato, suficiente cuando el contexto es chico
 *
 * Resolución del modelo (precedencia, primero gana):
 *   1. CortexConfig.model en Mongo (editable desde admin-dashboard)
 *   2. env MYCORTEX_MODEL
 *   3. 'claude-sonnet-4-5'
 *
 * Resolución de maxTokens:
 *   1. arg explícito al método reason()
 *   2. CortexConfig.maxTokens en Mongo
 *   3. 2500 (default razonable para razonamiento de 5 intenciones)
 */
@Injectable()
export class AnthropicClient {
  private readonly logger = new Logger(AnthropicClient.name);
  private client?: Anthropic;

  constructor(
    private readonly config:        ConfigService,
    private readonly cortexConfig:  CortexConfigService,
  ) {}

  private get sdk(): Anthropic {
    if (!this.client) {
      const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY no configurado — MyCortex no puede razonar');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Resuelve el modelo: config Mongo → env → default.
   * Si Mongo está vacío o falla, cae a env. Si env también vacío, default.
   */
  private async resolveModel(): Promise<string> {
    try {
      const cfg = await this.cortexConfig.get();
      const fromDb = (cfg.model ?? '').trim();
      if (fromDb.length > 0) return fromDb;
    } catch {
      // pasar al env fallback
    }
    return this.config.get<string>('MYCORTEX_MODEL') || 'claude-sonnet-4-5';
  }

  /** Resuelve maxTokens: arg → config → default. */
  private async resolveMaxTokens(explicit?: number): Promise<number> {
    if (explicit !== undefined && explicit > 0) return explicit;
    try {
      const cfg = await this.cortexConfig.get();
      if (cfg.maxTokens !== undefined && cfg.maxTokens !== null && cfg.maxTokens > 0) {
        return cfg.maxTokens;
      }
    } catch {
      // ignore
    }
    return 2500;
  }

  /**
   * Llamada con retry exponencial frente a 429 (rate limit). El cron corre
   * cada 30 min — si tenemos rate limit por minuto, esperar 60s+ es OK.
   */
  async reason(args: {
    systemPrompt: string;
    userPrompt:   string;
    maxTokens?:   number;
  }): Promise<{ text: string; tokensIn: number; tokensOut: number; model: string }> {
    const model     = await this.resolveModel();
    const maxTokens = await this.resolveMaxTokens(args.maxTokens);
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const t0 = Date.now();
        const response = await this.sdk.messages.create({
          model,
          max_tokens: maxTokens,
          system:    args.systemPrompt,
          messages:  [{ role: 'user', content: args.userPrompt }],
        });

        const block = response.content?.[0];
        const text  = block && 'text' in block ? (block as { text: string }).text : '';

        const tokensIn  = response.usage?.input_tokens  ?? 0;
        const tokensOut = response.usage?.output_tokens ?? 0;
        const ms = Date.now() - t0;

        this.logger.log(
          `Claude ${model} responded in ${ms}ms — in=${tokensIn} out=${tokensOut}`,
        );

        return { text, tokensIn, tokensOut, model };
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        const isRateLimit = e?.status === 429 || (e?.message ?? '').toLowerCase().includes('rate limit');
        if (isRateLimit && attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt) * 30000; // 30s, 60s, 120s
          this.logger.warn(
            `Rate limit (intento ${attempt + 1}/${maxRetries}) — esperando ${waitMs / 1000}s`,
          );
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Anthropic call failed after ${maxRetries} retries`);
  }
}
