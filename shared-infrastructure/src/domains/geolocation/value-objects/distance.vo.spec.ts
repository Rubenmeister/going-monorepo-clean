import { Distance } from './distance.vo';

describe('Distance Value Object', () => {
  describe('constructor', () => {
    it('should create distance with valid kilometers', () => {
      const distance = new Distance(10);

      expect(distance.kilometers).toBe(10);
    });

    it('should reject negative distance', () => {
      expect(() => new Distance(-5)).toThrow('Invalid distance');
    });

    it('should allow zero distance', () => {
      const distance = new Distance(0);

      expect(distance.kilometers).toBe(0);
    });
  });

  describe('unit conversions', () => {
    it('should convert kilometers to meters', () => {
      const distance = new Distance(1);

      expect(distance.meters).toBe(1000);
    });

    it('should convert kilometers to miles', () => {
      const distance = new Distance(1);
      const expectedMiles = 0.621371;

      expect(distance.miles).toBeCloseTo(expectedMiles, 5);
    });

    it('should convert multiple kilometers correctly', () => {
      const distance = new Distance(5);

      expect(distance.meters).toBe(5000);
      expect(distance.miles).toBeCloseTo(3.106855, 5);
    });
  });

  describe('equals', () => {
    it('should return true for equal distances', () => {
      const distance1 = new Distance(10);
      const distance2 = new Distance(10);

      expect(distance1.equals(distance2)).toBe(true);
    });

    it('should return true for distances within tolerance', () => {
      const distance1 = new Distance(10);
      const distance2 = new Distance(10.00009); // 0.09 meters difference

      expect(distance1.equals(distance2)).toBe(true);
    });

    it('should return false for different distances', () => {
      const distance1 = new Distance(10);
      const distance2 = new Distance(15);

      expect(distance1.equals(distance2)).toBe(false);
    });
  });

  describe('comparison methods', () => {
    it('should determine if distance is within another distance', () => {
      const small = new Distance(5);
      const large = new Distance(10);

      expect(small.isWithin(large)).toBe(true);
      expect(large.isWithin(small)).toBe(false);
      expect(small.isWithin(small)).toBe(true);
    });

    it('should determine if distance is greater than another', () => {
      const small = new Distance(5);
      const large = new Distance(10);

      expect(large.isGreaterThan(small)).toBe(true);
      expect(small.isGreaterThan(large)).toBe(false);
      expect(large.isGreaterThan(large)).toBe(false);
    });

    it('should determine if distance is less than another', () => {
      const small = new Distance(5);
      const large = new Distance(10);

      expect(small.isLessThan(large)).toBe(true);
      expect(large.isLessThan(small)).toBe(false);
      expect(large.isLessThan(large)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const distance = new Distance(10.5);

      expect(distance.toString()).toBe('10.50 km');
    });

    it('should format small distances', () => {
      const distance = new Distance(0.5);

      expect(distance.toString()).toBe('0.50 km');
    });
  });

  describe('toJSON', () => {
    it('should return all unit conversions', () => {
      const distance = new Distance(10);
      const json = distance.toJSON();

      expect(json).toEqual({
        kilometers: 10,
        meters: 10000,
        miles: expect.any(Number),
      });
    });
  });
});
