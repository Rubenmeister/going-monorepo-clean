import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoiSchema } from '../schemas/poi.schema';

@Injectable()
export class PoiRepository {
  private readonly logger = new Logger(PoiRepository.name);

  constructor(
    @InjectModel(PoiSchema.name)
    private readonly model: Model<PoiSchema>,
  ) {}

  async findNearby(lat: number, lng: number, radiusKm = 1, category?: string): Promise<any[]> {
    try {
      const all = await this.model.find({ active: true, ...(category && { category }) }).lean().exec();
      return all
        .map(poi => ({ ...poi, distanceKm: this.haversine(lat, lng, poi.lat, poi.lng) }))
        .filter(poi => poi.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 20);
    } catch (e) {
      this.logger.error(`findNearby error: ${e}`);
      return [];
    }
  }

  async create(data: Partial<any>): Promise<any> {
    const poi = new this.model(data);
    return poi.save();
  }

  async findById(id: string): Promise<any | null> {
    return this.model.findById(id).lean().exec();
  }

  async seedDefaults(): Promise<void> {
    const count = await this.model.countDocuments();
    if (count > 0) return;
    const defaults = [
      { name: 'Hospital Metropolitano', category: 'hospital', lat: -0.1935, lng: -78.4821, address: 'Av. Mariana de Jesús, Quito', rating: 4.5 },
      { name: 'Hospital Vozandes', category: 'hospital', lat: -0.2062, lng: -78.4913, address: 'Villalengua 267, Quito', rating: 4.3 },
      { name: 'Policía Nacional - UPC La Mariscal', category: 'police', lat: -0.2112, lng: -78.4870, address: 'Calama y Juan León Mera, Quito' },
      { name: 'Mall El Jardín', category: 'landmark', lat: -0.1934, lng: -78.4897, address: 'Av. Amazonas 4430, Quito', rating: 4.4 },
      { name: 'Plaza Grande', category: 'landmark', lat: -0.2197, lng: -78.5123, address: 'García Moreno y Chile, Quito', rating: 4.7 },
    ];
    await this.model.insertMany(defaults);
    this.logger.log(`Seeded ${defaults.length} default POIs`);
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
