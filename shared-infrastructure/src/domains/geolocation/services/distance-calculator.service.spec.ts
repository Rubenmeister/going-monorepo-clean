import { DistanceCalculatorService } from './distance-calculator.service';
import { Coordinates, Distance } from '../value-objects';

describe('DistanceCalculatorService', () => {
  let service: DistanceCalculatorService;

  beforeEach(() => {
    service = new DistanceCalculatorService();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points using Haversine formula', () => {
      const berlin = new Coordinates(52.52, 13.405);
      const paris = new Coordinates(48.8566, 2.3522);

      const distance = service.calculateDistance(berlin, paris);

      // Distance between Berlin and Paris is approximately 877 km
      expect(distance.kilometers).toBeGreaterThan(870);
      expect(distance.kilometers).toBeLessThan(885);
    });

    it('should return 0 distance for same point', () => {
      const point = new Coordinates(40.7128, -74.006);
      const distance = service.calculateDistance(point, point);

      expect(distance.kilometers).toBeLessThan(0.001);
    });

    it('should calculate distance to itself accurately', () => {
      const location = new Coordinates(37.7749, -122.4194); // San Francisco
      const distance = service.calculateDistance(location, location);

      expect(distance.kilometers).toBe(0);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing between two points', () => {
      const start = new Coordinates(0, 0);
      const north = new Coordinates(1, 0);
      const east = new Coordinates(0, 1);
      const south = new Coordinates(-1, 0);
      const west = new Coordinates(0, -1);

      expect(service.calculateBearing(start, north)).toBeLessThan(30);
      expect(service.calculateBearing(start, east)).toBeGreaterThan(60);
      expect(service.calculateBearing(start, west)).toBeGreaterThan(250);
    });
  });

  describe('estimateEta', () => {
    it('should estimate ETA correctly', () => {
      const distance = new Distance(10); // 10 km
      const speed = 60; // 60 km/h

      const etaSeconds = service.estimateEta(distance, speed);

      // 10 km at 60 km/h = 10 minutes = 600 seconds
      expect(etaSeconds).toBe(600);
    });

    it('should estimate ETA with different speeds', () => {
      const distance = new Distance(20); // 20 km
      const speedSlow = 40; // 40 km/h
      const speedFast = 80; // 80 km/h

      const etaSlow = service.estimateEta(distance, speedSlow);
      const etaFast = service.estimateEta(distance, speedFast);

      // 20 km at 40 km/h = 30 minutes = 1800 seconds
      expect(etaSlow).toBe(1800);
      // 20 km at 80 km/h = 15 minutes = 900 seconds
      expect(etaFast).toBe(900);
    });

    it('should throw error for invalid speed', () => {
      const distance = new Distance(10);
      expect(() => service.estimateEta(distance, 0)).toThrow();
      expect(() => service.estimateEta(distance, -10)).toThrow();
    });
  });

  describe('isWithinRadius', () => {
    it('should correctly determine if point is within radius', () => {
      const center = new Coordinates(0, 0);
      const nearPoint = new Coordinates(0.01, 0.01); // ~1.5 km away
      const farPoint = new Coordinates(1, 1); // ~157 km away

      const radius10km = new Distance(10);
      const radius100km = new Distance(100);

      expect(service.isWithinRadius(center, nearPoint, radius10km)).toBe(true);
      expect(
        service.isWithinRadius(center, farPoint, radius10km)
      ).toBe(false);
      expect(service.isWithinRadius(center, farPoint, radius100km)).toBe(true);
    });
  });

  describe('calculateCircleArea', () => {
    it('should calculate area of circle correctly', () => {
      const radius = new Distance(1);
      const area = service.calculateCircleArea(radius);

      // Area = π * r²
      const expectedArea = Math.PI * 1 * 1;
      expect(area).toBeCloseTo(expectedArea, 5);
    });

    it('should calculate area for larger radius', () => {
      const radius = new Distance(10);
      const area = service.calculateCircleArea(radius);

      const expectedArea = Math.PI * 10 * 10;
      expect(area).toBeCloseTo(expectedArea, 5);
    });
  });
});
