import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * BudgetService — tope de gasto mensual de la IA de soporte (texto + voz).
 *
 * Objetivo: que la factura de IA no se dispare, degradando con gracia en vez de
 * cortar la atención. Decisión de Rubén (30-jun): ~$100/mes.
 *
 *   ok    → gasto < tope            → modelo primario (Claude) con fallback
 *   soft  → gasto ≥ tope            → solo el modelo más barato (OpenAI nano)
 *   hard  → gasto ≥ 1.5× el tope    → derivar a WhatsApp/humano (handoff)
 *
 * NOTA: el contador es EN MEMORIA por instancia (Cloud Run puede tener varias).
 * Es una salvaguarda aproximada, no contabilidad exacta — suficiente para un
 * tope blando. Si se necesita un tope duro global, mover el contador a Mongo
 * (ya conectado) o Redis. Configurable con SUPPORT_MONTHLY_BUDGET_USD.
 */
@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);
  private monthKey = '';
  private spentUsd = 0;
  private readonly monthlyBudgetUsd: number;

  constructor(config: ConfigService) {
    this.monthlyBudgetUsd =
      Number(config.get<string>('SUPPORT_MONTHLY_BUDGET_USD') ?? '100') || 100;
    this.logger.log(`Tope mensual IA soporte: $${this.monthlyBudgetUsd} (degrada blando ≥tope, duro ≥1.5×)`);
  }

  private currentMonth(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private roll(): void {
    const m = this.currentMonth();
    if (m !== this.monthKey) {
      this.monthKey = m;
      this.spentUsd = 0;
    }
  }

  /** Suma gasto estimado (USD) del mes en curso. */
  record(usd: number): void {
    if (!(usd > 0)) return;
    this.roll();
    this.spentUsd += usd;
  }

  spent(): number {
    this.roll();
    return this.spentUsd;
  }

  budget(): number {
    return this.monthlyBudgetUsd;
  }

  /** Estado del presupuesto para decidir el nivel de degradación. */
  status(): 'ok' | 'soft' | 'hard' {
    this.roll();
    if (this.spentUsd >= this.monthlyBudgetUsd * 1.5) return 'hard';
    if (this.spentUsd >= this.monthlyBudgetUsd) return 'soft';
    return 'ok';
  }
}

/** Precios aproximados (USD por token) — solo para estimar gasto, no facturación. */
export const TEXT_PRICING = {
  // Claude Haiku 4.5
  claude: { in: 1.0e-6, out: 5.0e-6 },
  // OpenAI gpt-4.1-nano (≈8× más barato)
  openai: { in: 0.10e-6, out: 0.40e-6 },
};

/** Costo aproximado por minuto de voz (STT+TTS+realtime) — guardrail. */
export const VOICE_USD_PER_MINUTE = 0.12;
