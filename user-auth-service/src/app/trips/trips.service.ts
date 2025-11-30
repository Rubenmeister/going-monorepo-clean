import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { ServiceType, PassengerType } from './types';

@Injectable()
export class TripsService {
  private trips = [];

  async create(createTripDto: CreateTripDto) {
    this.validatePackageRules(createTripDto);
    const finalPrice = this.calculateTripPrice(createTripDto);
    
    const newTrip = {
      id: Date.now().toString(),
      ...createTripDto,
      totalPrice: finalPrice,
      status: 'SCHEDULED',
      createdAt: new Date(),
    };
    
    this.trips.push(newTrip);
    return newTrip;
  }

  private validatePackageRules(dto: CreateTripDto) {
    if (dto.serviceType === ServiceType.SHARED_SUV) {
      const packageCount = dto.manifest.filter(item => item.type === PassengerType.PACKAGE).length;
      if (packageCount > 3) {
        throw new BadRequestException(`Límite excedido: Máximo 3 paquetes en SUV.`);
      }
    }
  }

  private calculateTripPrice(dto: CreateTripDto): number {
    return dto.manifest.reduce((total, item) => total + item.price, 0);
  }
}