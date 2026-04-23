import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PoiRepository } from '../infrastructure/persistence/poi.repository';

@Injectable()
export class ArService implements OnModuleInit {
  private readonly logger = new Logger(ArService.name);

  constructor(private readonly poiRepository: PoiRepository) {}

  async onModuleInit() {
    await this.poiRepository.seedDefaults();
  }

  async getPois(lat: number, lng: number, radiusKm = 1, category?: string): Promise<any> {
    const pois = await this.poiRepository.findNearby(lat, lng, radiusKm, category);
    return {
      center: { lat, lng },
      radiusKm,
      count: pois.length,
      pois: pois.map(p => ({
        id: String(p._id),
        name: p.name,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        distanceKm: Math.round(p.distanceKm * 100) / 100,
        distanceText: p.distanceKm < 0.1 ? 'A menos de 100m' : p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)}m` : `${p.distanceKm.toFixed(1)}km`,
        address: p.address,
        rating: p.rating,
        icon: this.categoryIcon(p.category),
      })),
    };
  }

  getNavigation(rideId: string): any {
    return {
      rideId,
      arEnabled: true,
      overlays: [
        { type: 'arrow', color: '#ff4c41', size: 'large', opacity: 0.9 },
        { type: 'distance_label', color: '#ffffff', size: 'medium' },
        { type: 'turn_indicator', color: '#f59e0b', size: 'medium' },
      ],
      settings: {
        maxPoiRadius: 0.5,
        showSpeedLimit: true,
        showTrafficAlerts: true,
        showNearbyHospitals: true,
        showNearbyPolice: true,
      },
    };
  }

  async addPoi(data: any): Promise<any> {
    return this.poiRepository.create(data);
  }

  private categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      restaurant: '🍽️', gas_station: '⛽', hospital: '🏥',
      police: '🚔', atm: '🏧', pharmacy: '💊',
      hotel: '🏨', parking: '🅿️', landmark: '📍',
    };
    return icons[category] ?? '📍';
  }
}
