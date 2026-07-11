import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

/**
 * ContentService — lectura de la sección de Comunicación de Going
 * (Noticias / Blog / Revista) desde Firestore `content_items`.
 *
 * Fuente: el content-agent (Killa) guarda propuestas (status='review') y, tras
 * aprobación editorial, quedan como status='published'. Este servicio sirve los
 * PUBLICADOS a la webapp (/blog, /revista, /noticias) vía el gateway.
 *
 * Vive acá (customer-support-service) porque ya tiene acceso a Firestore del
 * mismo proyecto; es un módulo aislado y extraíble a un content-service futuro.
 */
const CHANNEL_TO_TYPE: Record<string, string[]> = {
  blog:     ['blog_post'],
  revista:  ['article'],
  noticias: ['news'],
};

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly db = new Firestore({
    projectId: process.env.GCP_PROJECT || 'going-5d1ae',
    // Fijar la base '(default)' explícitamente: el proyecto tiene también una
    // base nombrada (ai-studio-*) y el runtime podría resolver la equivocada.
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
  });

  /** Publicados por canal (o todos). Filtra/ordena en memoria (sin índice compuesto). */
  async listPublished(channel?: string, limit = 20): Promise<any[]> {
    try {
      const snap = await this.db
        .collection('content_items')
        .where('status', '==', 'published')
        .limit(200)
        .get();

      this.logger.log(`[content] listPublished snap.size=${snap.size} (channel=${channel ?? 'all'})`);
      let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      if (channel) {
        const types = CHANNEL_TO_TYPE[channel];
        items = items.filter(
          (it) => it.channel === channel || (types && types.includes(it.type)),
        );
      }

      items.sort((a, b) => {
        const ta = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      });

      return items.slice(0, Math.min(Math.max(limit, 1), 100)).map((it) => this.toPublic(it));
    } catch (e) {
      this.logger.error(`listPublished fallo: ${(e as Error).message}`);
      return [];
    }
  }

  /** Un item publicado por id. */
  async getById(id: string): Promise<any | null> {
    try {
      const doc = await this.db.collection('content_items').doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data() as any;
      if (data.status !== 'published') return null;
      return this.toPublic({ id: doc.id, ...data });
    } catch (e) {
      this.logger.error(`getById fallo: ${(e as Error).message}`);
      return null;
    }
  }

  // ---- Panel de revisión del admin (status='review' → published|rejected) ----

  /** Propuestas pendientes de revisión (Killa las deja en status='review'). */
  async listReview(limit = 50): Promise<any[]> {
    try {
      const snap = await this.db
        .collection('content_items')
        .where('status', '==', 'review')
        .limit(200)
        .get();
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      items.sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      return items.slice(0, Math.min(Math.max(limit, 1), 200)).map((it) => this.toReview(it));
    } catch (e) {
      this.logger.error(`listReview fallo: ${(e as Error).message}`);
      return [];
    }
  }

  /**
   * Cambia el estado de una propuesta. 'published' sella publishedAt.
   * Devuelve el item actualizado o null si no existe / no estaba en revisión.
   */
  async setStatus(
    id: string,
    status: 'published' | 'rejected',
    reviewer?: string,
    isoNow?: string,
  ): Promise<any | null> {
    try {
      const ref = this.db.collection('content_items').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      const data = doc.data() as any;
      // Solo se decide sobre propuestas en revisión (idempotente/seguro).
      if (data.status !== 'review') return null;

      const patch: any = { status, reviewedAt: isoNow ?? null, reviewedBy: reviewer ?? null };
      if (status === 'published') patch.publishedAt = data.publishedAt ?? isoNow ?? null;
      await ref.update(patch);
      return this.toReview({ id, ...data, ...patch });
    } catch (e) {
      this.logger.error(`setStatus(${id},${status}) fallo: ${(e as Error).message}`);
      return null;
    }
  }

  /** Proyección para el panel de revisión (incluye cuerpo y fuentes para decidir). */
  private toReview(it: any) {
    return {
      id: it.id,
      status: it.status,
      channel: it.channel ?? this.channelForType(it.type),
      title: it.title ?? it.titulo ?? '(sin título)',
      summary: it.summary ?? it.lead ?? '',
      body: it.body ?? '',
      outline: it.outline ?? [],
      category: it.category ?? it.pilar ?? '',
      sources: it.fuentes ?? it.sources ?? [],
      cta: it.cta ?? '',
      author: it.author ?? 'Going Ecuador',
      createdAt: it.createdAt ?? null,
    };
  }

  /** Proyección pública (no exponemos campos internos de revisión). */
  private toPublic(it: any) {
    return {
      id: it.id,
      channel: it.channel ?? this.channelForType(it.type),
      title: it.title,
      summary: it.summary ?? it.lead ?? '',
      body: it.body ?? '',
      outline: it.outline ?? [],
      category: it.category ?? it.pilar ?? '',
      author: it.author ?? 'Going Ecuador',
      coverUrl: it.coverUrl ?? null,
      publishedAt: it.publishedAt ?? it.createdAt ?? null,
    };
  }

  private channelForType(type?: string): string {
    if (type === 'blog_post') return 'blog';
    if (type === 'article') return 'revista';
    if (type === 'news') return 'noticias';
    return 'blog';
  }
}
