/**
 * Rating service - handles driver ratings and reviews
 */

import type { RatingSubmission, RatingResponse } from '@/types';
import { authFetch } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class RatingService {
  /**
   * Envía la calificación del pasajero al conductor al backend real.
   * POST /rides/:rideId/rate (JWT del pasajero → @CurrentUser).
   * ANTES era un MOCK: devolvía success sin llamar a ningún endpoint, así que
   * la calificación se perdía en silencio aunque el endpoint ya existía.
   */
  async submitRating(submission: RatingSubmission): Promise<RatingResponse> {
    // Las 3 categorías (limpieza/comunicación/conducción) se codifican como tags
    // para no perderlas — el endpoint guarda tags[] además del rating global.
    const c = submission.categories;
    const tags = [
      c.cleanliness ? `limpieza:${c.cleanliness}` : null,
      c.communication ? `comunicacion:${c.communication}` : null,
      c.driving ? `conduccion:${c.driving}` : null,
    ].filter(Boolean) as string[];

    try {
      const res = await authFetch(`${API_URL}/rides/${submission.rideId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: submission.driverId,
          rating: submission.overallRating,
          thumbsUp: submission.overallRating >= 4,
          comment: submission.review || undefined,
          tags,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        return { success: false, message: msg || `Error ${res.status} al enviar la calificación` };
      }
      const data = await res.json().catch(() => ({}) as any);
      return { success: true, message: 'Calificación enviada', ratingId: data?.rideId ?? submission.rideId };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'No se pudo enviar la calificación',
      };
    }
  }

  /**
   * Get average rating for a driver
   * TODO: Implement API call
   */
  async getDriverRating(driverId: string): Promise<number> {
    // TODO: Implement API call
    throw new Error('Not implemented');
  }

  /**
   * Get rating history for a user
   * TODO: Implement API call
   */
  async getRatingHistory(userId: string): Promise<RatingSubmission[]> {
    // TODO: Implement API call
    throw new Error('Not implemented');
  }

  /**
   * Update an existing rating
   * TODO: Implement API call
   */
  async updateRating(
    ratingId: string,
    submission: Partial<RatingSubmission>
  ): Promise<RatingResponse> {
    // TODO: Implement API call
    throw new Error('Not implemented');
  }

  /**
   * Delete a rating
   * TODO: Implement API call
   */
  async deleteRating(ratingId: string): Promise<boolean> {
    // TODO: Implement API call
    throw new Error('Not implemented');
  }

  /**
   * Get statistics for a driver (average, count, etc.)
   * TODO: Implement API call
   */
  async getDriverStatistics(driverId: string) {
    // TODO: Implement API call
    throw new Error('Not implemented');
  }
}

export const ratingService = new RatingService();
