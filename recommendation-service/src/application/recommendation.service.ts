import { Injectable, Logger } from '@nestjs/common';
import { TripHistoryRepository } from '../infrastructure/persistence/trip-history.repository';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  // Popular destinations in Quito — fallback when no history
  private readonly popularDestinations = [
    { address: 'Aeropuerto Mariscal Sucre, Quito', lat: -0.1292, lng: -78.3576, category: 'airport', label: 'Aeropuerto' },
    { address: 'Centro Histórico, Quito', lat: -0.2201, lng: -78.5123, category: 'tourism', label: 'Centro Histórico' },
    { address: 'Mall El Jardín, Quito', lat: -0.1934, lng: -78.4897, category: 'shopping', label: 'El Jardín' },
    { address: 'La Mariscal, Quito', lat: -0.2101, lng: -78.4872, category: 'entertainment', label: 'La Mariscal' },
    { address: 'Cumbayá, Quito', lat: -0.2038, lng: -78.4387, category: 'residential', label: 'Cumbayá' },
  ];

  constructor(private readonly tripHistoryRepository: TripHistoryRepository) {}

  async getDestinations(userId: string): Promise<any[]> {
    const history = await this.tripHistoryRepository.getFrequentDestinations(userId, 5);
    if (history.length >= 3) {
      return history.map(h => ({
        address: h.toAddress,
        lat: h.toLat,
        lng: h.toLng,
        count: h.count,
        lastVisited: h.lastTripAt,
        source: 'history',
      }));
    }
    // Pad with popular destinations
    const combined = [
      ...history.map(h => ({ address: h.toAddress, lat: h.toLat, lng: h.toLng, count: h.count, source: 'history' })),
      ...this.popularDestinations.slice(0, 5 - history.length).map(p => ({ ...p, count: 0, source: 'popular' })),
    ];
    return combined;
  }

  async getRoutes(userId: string): Promise<any[]> {
    const routes = await this.tripHistoryRepository.getFrequentRoutes(userId, 3);
    return routes.map(r => ({
      from: { address: r.fromAddress, lat: r.fromLat, lng: r.fromLng },
      to: { address: r.toAddress, lat: r.toLat, lng: r.toLng },
      count: r.count,
      lastUsed: r.lastTripAt,
    }));
  }

  async recordTrip(userId: string, body: any): Promise<{ success: boolean }> {
    await this.tripHistoryRepository.recordTrip(
      userId,
      body.from || body.fromAddress,
      body.to || body.toAddress,
      body.fromLat,
      body.fromLng,
      body.toLat,
      body.toLng,
      body.rideId,
    );
    return { success: true };
  }
}
