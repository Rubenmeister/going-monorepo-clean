import { Coordinates } from './coordinates.vo';

describe('Coordinates Value Object', () => {
  describe('constructor', () => {
    it('should create coordinates with valid values', () => {
      const coords = new Coordinates(40.7128, -74.006);

      expect(coords.latitude).toBe(40.7128);
      expect(coords.longitude).toBe(-74.006);
    });

    it('should reject invalid latitude', () => {
      expect(() => new Coordinates(91, 0)).toThrow('Invalid latitude');
      expect(() => new Coordinates(-91, 0)).toThrow('Invalid latitude');
    });

    it('should reject invalid longitude', () => {
      expect(() => new Coordinates(0, 181)).toThrow('Invalid longitude');
      expect(() => new Coordinates(0, -181)).toThrow('Invalid longitude');
    });

    it('should accept boundary values', () => {
      const northPole = new Coordinates(90, 0);
      const southPole = new Coordinates(-90, 0);
      const dateline = new Coordinates(0, 180);

      expect(northPole.latitude).toBe(90);
      expect(southPole.latitude).toBe(-90);
      expect(dateline.longitude).toBe(180);
    });
  });

  describe('equals', () => {
    it('should return true for equal coordinates', () => {
      const coords1 = new Coordinates(40.7128, -74.006);
      const coords2 = new Coordinates(40.7128, -74.006);

      expect(coords1.equals(coords2)).toBe(true);
    });

    it('should return false for different coordinates', () => {
      const coords1 = new Coordinates(40.7128, -74.006);
      const coords2 = new Coordinates(51.5074, -0.1278);

      expect(coords1.equals(coords2)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const coords = new Coordinates(40.7128, -74.006);
      const obj = coords.toObject();

      expect(obj).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
      });
    });
  });

  describe('toArray', () => {
    it('should convert to GeoJSON format [lon, lat]', () => {
      const coords = new Coordinates(40.7128, -74.006);
      const arr = coords.toArray();

      expect(arr).toEqual([-74.006, 40.7128]);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const coords = new Coordinates(40.7128, -74.006);

      expect(coords.toString()).toBe('40.7128,-74.006');
    });
  });
});
