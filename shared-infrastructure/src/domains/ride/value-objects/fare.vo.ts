import { Money } from './money.vo';

/**
 * Fare Value Object
 * Represents the fare calculation for a ride
 */
export class Fare {
  readonly baseFare: Money;
  readonly perKmFare: Money;
  readonly perMinuteFare: Money;
  readonly surgeMultiplier: number;
  readonly estimatedTotal: Money;

  constructor(props: {
    baseFare: number;
    perKmFare: number;
    perMinuteFare: number;
    surgeMultiplier?: number;
    estimatedTotal: number;
  }) {
    if (props.baseFare < 0 || props.perKmFare < 0 || props.perMinuteFare < 0) {
      throw new Error('Fare components cannot be negative');
    }

    if (props.surgeMultiplier && props.surgeMultiplier < 1) {
      throw new Error('Surge multiplier must be >= 1');
    }

    this.baseFare = new Money(props.baseFare);
    this.perKmFare = new Money(props.perKmFare);
    this.perMinuteFare = new Money(props.perMinuteFare);
    this.surgeMultiplier = props.surgeMultiplier || 1.0;
    this.estimatedTotal = new Money(props.estimatedTotal);
  }

  /**
   * Calculate fare for a ride
   */
  static calculate(
    distanceKm: number,
    durationMinutes: number,
    surgeMultiplier: number = 1.0,
    baseFare: number = 2.5,
    perKmRate: number = 0.5,
    perMinuteRate: number = 0.1
  ): Fare {
    const distanceCost = distanceKm * perKmRate;
    const timeCost = durationMinutes * perMinuteRate;
    const subtotal = baseFare + distanceCost + timeCost;
    const total = subtotal * surgeMultiplier;

    return new Fare({
      baseFare,
      perKmFare: perKmRate,
      perMinuteFare: perMinuteRate,
      surgeMultiplier,
      estimatedTotal: total,
    });
  }

  /**
   * Get final fare (may differ from estimate if distance/time changes)
   */
  calculateFinal(
    actualDistanceKm: number,
    actualDurationMinutes: number
  ): Money {
    const distanceCost = actualDistanceKm * this.perKmFare.amount;
    const timeCost = actualDurationMinutes * this.perMinuteFare.amount;
    const subtotal = this.baseFare.amount + distanceCost + timeCost;
    const total = subtotal * this.surgeMultiplier;

    return new Money(total);
  }

  /**
   * Get platform cut (20% of final fare)
   */
  getPlatformCut(): Money {
    return new Money(this.estimatedTotal.amount * 0.2);
  }

  /**
   * Get driver earnings (80% of final fare)
   */
  getDriverEarnings(): Money {
    return new Money(this.estimatedTotal.amount * 0.8);
  }

  toObject() {
    return {
      baseFare: this.baseFare.amount,
      perKmFare: this.perKmFare.amount,
      perMinuteFare: this.perMinuteFare.amount,
      surgeMultiplier: this.surgeMultiplier,
      estimatedTotal: this.estimatedTotal.amount,
      platformCut: this.getPlatformCut().amount,
      driverEarnings: this.getDriverEarnings().amount,
    };
  }
}
