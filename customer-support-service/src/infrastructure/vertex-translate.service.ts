import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BudgetService, TEXT_PRICING } from './budget.service';

/**
 * VertexTranslateService — traducción de alta calidad vía Gemini en Vertex AI.
 *
 * Para los idiomas "cola larga" (fr/de/kichwa) el agente razona en ESPAÑOL
 * (donde tiene todo el dominio Going) y este servicio traduce la respuesta
 * final al idioma del usuario. Gemini traduce mucho mejor que el truco previo
 * de "prompt en español + sufijo de idioma", sobre todo en kichwa.
 *
 * Por qué Vertex (y no la key de AI Studio): la key GEMINI_API_KEY de AI Studio
 * está SIN crédito; Vertex factura al proyecto GCP (que sí tiene pago). Auth en
 * Cloud Run vía el metadata server (token de la service account del servicio),
 * sin dependencias nuevas. Requiere que la SA tenga roles/aiplatform.user.
 *
 * Seguro por defecto: gated por SUPPORT_VERTEX_TRANSLATE=true. Si está apagado
 * o falla (token/permiso/red), translate() devuelve null y el caller mantiene
 * el comportamiento previo. NUNCA rompe la respuesta.
 */
@Injectable()
export class VertexTranslateService {
  private readonly logger = new Logger(VertexTranslateService.name);
  private readonly enabledFlag: boolean;
  private readonly project: string;
  private readonly region: string;
  private readonly model = 'gemini-2.5-flash';

  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService, private readonly budget: BudgetService) {
    this.enabledFlag = this.config.get<string>('SUPPORT_VERTEX_TRANSLATE') === 'true';
    this.project = this.config.get<string>('GCP_PROJECT') || 'going-5d1ae';
    this.region = this.config.get<string>('VERTEX_REGION') || 'us-central1';
    this.logger.log(`Vertex translate ${this.enabledFlag ? 'ON' : 'OFF'} (proyecto ${this.project}/${this.region})`);
  }

  get enabled(): boolean {
    return this.enabledFlag;
  }

  /** Etiqueta de idioma destino para el prompt de traducción. */
  private static LABEL: Record<string, string> = {
    fr: 'French',
    de: 'German',
    qu: 'Kichwa (Ecuadorian Quichua)',
    en: 'English',
    es: 'Spanish',
  };

  /** Token de la SA vía metadata server (solo funciona en Cloud Run/GCE). */
  private async getToken(): Promise<string | null> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt - 60_000) return this.token;
    try {
      const res = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        { headers: { 'Metadata-Flavor': 'Google' } },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token: string; expires_in: number };
      this.token = data.access_token;
      this.tokenExpiresAt = now + (data.expires_in || 3600) * 1000;
      return this.token;
    } catch (e) {
      this.logger.warn(`No se pudo obtener token de metadata: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Traduce `text` (en español) al idioma `targetLang` (código es/en/fr/de/qu).
   * Devuelve null si está deshabilitado o si algo falla — el caller hace fallback.
   */
  async translate(text: string, targetLang: string): Promise<string | null> {
    if (!this.enabledFlag || !text?.trim()) return null;
    const label = VertexTranslateService.LABEL[targetLang];
    if (!label || targetLang === 'es') return null; // nada que traducir

    const token = await this.getToken();
    if (!token) return null;

    const url = `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.project}/locations/${this.region}/publishers/google/models/${this.model}:generateContent`;
    const body = {
      contents: [{
        role: 'user',
        parts: [{
          text:
            `Translate the following Going customer-support message to ${label}. ` +
            `Keep it natural, warm and inclusive. Preserve names, numbers, prices and emojis as-is. ` +
            `Return ONLY the translation, no notes:\n\n${text}`,
        }],
      }],
      generationConfig: { temperature: 0.2 },
    };

    try {
      const t0 = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12_000),
      });
      const json: any = await res.json();
      if (!res.ok) {
        this.logger.warn(`Vertex translate HTTP ${res.status}: ${JSON.stringify(json?.error?.message || json).slice(0, 160)}`);
        return null;
      }
      const out: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      const u = json?.usageMetadata;
      const cost = ((u?.promptTokenCount || 0) + (u?.candidatesTokenCount || 0)) * TEXT_PRICING.openai.out; // estimado conservador
      this.budget.record(cost);
      this.logger.log(`[vertex-translate→${targetLang}] ${out?.length ?? 0} chars en ${Date.now() - t0}ms (~$${cost.toFixed(4)})`);
      return out || null;
    } catch (e) {
      this.logger.warn(`Vertex translate falló: ${(e as Error).message}`);
      return null;
    }
  }
}
