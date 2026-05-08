import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Wrapper de Anthropic SDK con retry-on-rate-limit y métricas de costo.
 *
 * Modelos soportados (override por env MYCORTEX_MODEL):
 *   - claude-sonnet-4-5 (default)  — calidad/precio sweet spot para razonamiento corto
 *   - claude-opus-4-5             — mejor para world models complejos / decisiones de alto costo
 *   - claude-haiku-4-5            — más barato, suficiente cuando el contexto es chico
 */
@Injectable()
export class AnthropicClient {
  private readonly logger = new Logger(AnthropicClient.name);
  private client?: Anthropic;

  constructor(private readonly config: ConfigService) {}

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

  private get model(): string {
    return this.config.get<string>('MYCORTEX_MODEL') || 'claude-sonnet-4-5';
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
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const t0 = Date.now();
        const response = await this.sdk.messages.create({
          model:     this.model,
          max_tokens: args.maxTokens ?? 2000,
          system:    args.systemPrompt,
          messages:  [{ role: 'user', content: args.userPrompt }],
        });

        const block = response.content?.[0];
        const text  = block && 'text' in block ? (block as { text: string }).text : '';

        const tokensIn  = response.usage?.input_tokens  ?? 0;
        const tokensOut = response.usage?.output_tokens ?? 0;
        const ms = Date.now() - t0;

        this.logger.log(
          `Claude ${this.model} responded in ${ms}ms — in=${tokensIn} out=${tokensOut}`,
        );

        return { text, tokensIn, tokensOut, model: this.model };
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
