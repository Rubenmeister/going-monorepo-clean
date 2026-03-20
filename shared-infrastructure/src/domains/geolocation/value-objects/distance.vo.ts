/**
 * Distance Value Object
 * Represents a geographic distance in kilometers
 */
export class Distance {
  readonly kilometers: number;

  constructor(kilometers: number) {
    if (kilometers < 0) {
      throw new Error(`Invalid distance: ${kilometers}. Must be non-negative`);
    }
    this.kilometers = kilometers;
  }

  get meters(): number {
    return this.kilometers * 1000;
  }

  get miles(): number {
    return this.kilometers * 0.621371;
  }

  equals(other: Distance): boolean {
    return Math.abs(this.kilometers - other.kilometers) < 0.0001; // 0.1 meters tolerance
  }

  isWithin(other: Distance): boolean {
    return this.kilometers <= other.kilometers;
  }

  isGreaterThan(other: Distance): boolean {
    return this.kilometers > other.kilometers;
  }

  isLessThan(other: Distance): boolean {
    return this.kilometers < other.kilometers;
  }

  toString(): string {
    return `${this.kilometers.toFixed(2)} km`;
  }

  toJSON() {
    return {
      kilometers: this.kilometers,
      meters: this.meters,
      miles: this.miles,
    };
  }
}
