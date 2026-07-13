import { Injectable, Logger } from '@nestjs/common';
import { BusinessContextRepository } from '../infrastructure/persistence/business-context.repository';
import { BusinessContextDocument } from '../infrastructure/schemas/business-context.schema';

/**
 * Cache in-memory de la constitución singleton. Mismo diseño que
 * CortexConfigService: TTL 60s, invalidate() manual tras PUT, y fallback al
 * último valor cacheado (o doc vacío) si Mongo falla — el reasoning loop nunca
 * debe romperse por un fallo de lectura de la constitución.
 */
@Injectable()
export class BusinessContextService {
  private readonly logger = new Logger(BusinessContextService.name);
  private readonly TTL_MS = 60_000;

  private cache: { doc: BusinessContextDocument; loadedAt: number } | null = null;

  constructor(private readonly repo: BusinessContextRepository) {}

  async get(): Promise<BusinessContextDocument> {
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
        `Failed to load business context from Mongo: ${(e as Error).message}. ` +
        `${this.cache ? 'Usando cache stale.' : 'Sin cache previo — usando fallback vacío.'}`,
      );
      if (this.cache) return this.cache.doc;
      return { _id: 'singleton', body: '' } as BusinessContextDocument;
    }
  }

  invalidate(): void {
    this.cache = null;
  }
}
