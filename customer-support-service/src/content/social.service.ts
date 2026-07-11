import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

/**
 * SocialService — lado de revisión de las propuestas de REDES SOCIALES.
 *
 * El marketing-agent (Sumak) genera posts multi-plataforma y los deja en
 * Firestore `social_posts` con status='review'. Este servicio los sirve al
 * panel admin y aplica la decisión: 'approved' (Sumak los publica en su
 * próxima corrida) o 'rejected'. NO publica a las plataformas — eso lo hace
 * el agente, que es quien tiene los tokens.
 */
@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);
  private readonly db = new Firestore({
    projectId: process.env.GCP_PROJECT || 'going-5d1ae',
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
  });

  /** Propuestas sociales pendientes de revisión. */
  async listReview(limit = 50): Promise<any[]> {
    try {
      const snap = await this.db
        .collection('social_posts')
        .where('status', '==', 'review')
        .limit(200)
        .get();
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      items.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      );
      return items.slice(0, Math.min(Math.max(limit, 1), 200)).map((it) => this.toPublic(it));
    } catch (e) {
      this.logger.error(`social listReview fallo: ${(e as Error).message}`);
      return [];
    }
  }

  /** Aprueba (→'approved', Sumak lo publica) o descarta (→'rejected'). */
  async setStatus(
    id: string,
    status: 'approved' | 'rejected',
    reviewer?: string,
    isoNow?: string,
  ): Promise<any | null> {
    try {
      const ref = this.db.collection('social_posts').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      const data = doc.data() as any;
      if (data.status !== 'review') return null; // idempotente: solo se decide una vez
      const patch: any = { status, reviewedAt: isoNow ?? null, reviewedBy: reviewer ?? null };
      await ref.update(patch);
      return this.toPublic({ id, ...data, ...patch });
    } catch (e) {
      this.logger.error(`social setStatus(${id},${status}) fallo: ${(e as Error).message}`);
      return null;
    }
  }

  private toPublic(it: any) {
    return {
      id: it.id,
      status: it.status,
      platform: it.platform,
      contentType: it.contentType,
      topic: it.topic,
      caption: it.caption,
      hashtags: it.hashtags ?? [],
      needsMedia: !!it.needsMedia,
      imagePrompt: it.imagePrompt ?? null,
      contextData: it.contextData ?? null,
      createdAt: it.createdAt ?? null,
    };
  }
}
