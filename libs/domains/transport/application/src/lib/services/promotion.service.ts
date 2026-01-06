import { Injectable } from '@nestjs/common';
import { DemandFactorService } from './demand-factor.service';

@Injectable()
export class PromotionService {
  constructor(private readonly demandFactorService: DemandFactorService) {}

  applyPromotions(price: number, date: Date, couponCode?: string): number {
    let finalPrice = price;

    // Auto-promotion on low demand days
    if (this.demandFactorService.isLowDemandDay(date)) {
      finalPrice *= 0.85; // 15% discount
    }

    // Coupon application (simplified)
    if (couponCode === 'GOING-WAVE') {
      finalPrice *= 0.90; // 10% discount
    }

    return finalPrice;
  }
}
