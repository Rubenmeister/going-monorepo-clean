import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

/**
 * Parsea el output de Claude. Defensa en profundidad porque el modelo
 * puede:
 *   - Devolver el JSON dentro de ```json``` o sin fences.
 *   - Mezclar el bloque con texto de razonamiento (es esperable: el system
 *     prompt se lo permite).
 *   - Inventar campos extra (los ignoramos).
 *   - Devolver urgency como string ("0.85") — la coerción se hace acá.
 */

export const IntentionInputSchema = z.object({
  type:    z.string().min(1).max(80),
  urgency: z.coerce.number().min(0).max(1),
  target:  z.string().optional(),
  reason:  z.string().min(1),
  suggestedAction: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  data:    z.record(z.unknown()).optional(),
});
export type IntentionInput = z.infer<typeof IntentionInputSchema>;

@Injectable()
export class IntentionsParserService {
  private readonly logger = new Logger(IntentionsParserService.name);

  /**
   * Devuelve la lista de intenciones parseadas + el razonamiento (texto
   * antes del bloque JSON) para auditoría.
   */
  parse(modelOutput: string): { reasoning: string; intentions: IntentionInput[] } {
    const { reasoning, jsonText } = this.splitReasoningAndJson(modelOutput);

    if (!jsonText) {
      this.logger.warn('Output del modelo no contiene bloque JSON parseable');
      return { reasoning, intentions: [] };
    }

    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch (e) {
      this.logger.warn(`JSON inválido del modelo: ${(e as Error).message}`);
      return { reasoning, intentions: [] };
    }

    if (!Array.isArray(raw)) {
      this.logger.warn(`El modelo devolvió ${typeof raw} en vez de array`);
      return { reasoning, intentions: [] };
    }

    const intentions: IntentionInput[] = [];
    for (const [idx, item] of raw.entries()) {
      const parsed = IntentionInputSchema.safeParse(item);
      if (parsed.success) {
        intentions.push(parsed.data);
      } else {
        this.logger.warn(
          `Intención #${idx} inválida — descartada: ` +
            `${JSON.stringify(parsed.error.issues).slice(0, 200)}`,
        );
      }
    }

    // Cap a 10 propuestas por ciclo, ordenadas por urgency desc.
    const top = intentions
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 10);

    return { reasoning: reasoning.trim(), intentions: top };
  }

  /**
   * Extrae el bloque ```json …``` del output. Si no hay fences pero el
   * texto comienza con `[`, lo trata como JSON puro. Caso contrario,
   * devuelve jsonText vacío y todo el texto como reasoning.
   */
  private splitReasoningAndJson(output: string): { reasoning: string; jsonText: string } {
    const fenceMatch = /```json\s*([\s\S]*?)\s*```/i.exec(output);
    if (fenceMatch) {
      const jsonText = fenceMatch[1].trim();
      const reasoning = output.replace(fenceMatch[0], '').trim();
      return { reasoning, jsonText };
    }

    // Sin fences: si el output empieza con `[`, asumir JSON puro.
    const trimmed = output.trim();
    if (trimmed.startsWith('[')) {
      return { reasoning: '', jsonText: trimmed };
    }

    return { reasoning: trimmed, jsonText: '' };
  }
}
