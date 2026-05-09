import { Injectable, Logger } from '@nestjs/common';
import { CortexConfigRepository } from '../infrastructure/persistence/cortex-config.repository';
import { CortexConfigDocument } from '../infrastructure/schemas/cortex-config.schema';

/**
 * Cache in-memory de la config singleton de MyCortex.
 *
 * Diseño:
 *   - TTL 60s — los cambios desde admin-dashboard tardan max 60s en
 *     aplicar. Nadie espera que sea instantáneo.
 *   - invalidate() expone la posibilidad de purga manual cuando el
 *     controller PUT termina (próxima llamada relee).
 *   - Si Mongo falla, devolvemos el último valor cacheado o un fallback
 *     vacío — el reasoning loop nunca debe romperse por un fallo de config.
 *
 * No es sincronizado entre instancias (cada Cloud Run instance tiene su
 * propio cache). Eso está bien para nosotros: MyCortex corre con
 * min-instances=1 max-instances=1 (cron único), así que solo hay una
 * instancia leyendo. Si en el futuro escalamos, agregar Pub/Sub
 * 'cerebro.config.updated' para invalidar todas las réplicas.
 */
@Injectable()
export class CortexConfigService {
  private readonly logger = new Logger(CortexConfigService.name);
  private readonly TTL_MS = 60_000;

  private cache: { doc: CortexConfigDocument; loadedAt: number } | null = null;

  constructor(private readonly repo: CortexConfigRepository) {}

  /**
   * Devuelve el doc cacheado. Si TTL expiró o nunca se cargó, refetcha.
   * En caso de error, devuelve el cacheado anterior (si existe) o un
   * objeto fallback con valores vacíos — el caller siempre recibe algo.
   */
  async get(): Promise<CortexConfigDocument> {
    const now = Date.now();
    if (this.cache && now - this.cache.loadedAt < this.TTL_MS) {
      return this.cache.doc;
    }

    try {
      const doc = await this.repo.findOrCreate();
      this.cache = { doc, loadedAt: now };
      return doc;
    } catch (e) {
      this.logger.warn(
        `Failed to load cortex config from Mongo: ${(e as Error).message}. ` +
        `${this.cache ? 'Usando cache stale.' : 'Sin cache previo — usando fallback vacío.'}`,
      );
      if (this.cache) return this.cache.doc;
      // Fallback: doc en blanco. El PromptBuilder/AnthropicClient verá
      // strings vacíos y caerá a sus defaults hardcoded.
      return {
        _id:          'singleton',
        systemPrompt: '',
        model:        '',
        enabled:      true,
      } as CortexConfigDocument;
    }
  }

  /**
   * Forzar refetch en la próxima llamada a get(). Lo invoca el controller
   * después de un PUT exitoso para que el cambio se vea inmediato (sin
   * esperar el TTL).
   */
  invalidate(): void {
    this.cache = null;
  }
}
