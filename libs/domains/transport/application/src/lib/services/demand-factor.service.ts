import { Injectable } from '@nestjs/common';

@Injectable()
export class DemandFactorService {
  calculate(date: Date): number {
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const hour = date.getHours();

    let factor = 1.0;

    // Peak Hours: 7-9 AM, 5-7 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      factor += 0.3;
    }

    // Weekends
    if (day === 0 || day === 6) {
      factor += 0.2;
    }

    // Late Night: 11 PM - 5 AM
    if (hour >= 23 || hour <= 5) {
      factor += 0.4;
    }

    return factor;
  }

  isLowDemandDay(date: Date): boolean {
    const day = date.getDay();
    // Assuming Tuesday and Wednesday are low demand
    return day === 2 || day === 3;
  }
}
