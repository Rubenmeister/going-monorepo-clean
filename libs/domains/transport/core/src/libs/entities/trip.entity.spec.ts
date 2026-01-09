import { Trip } from './trip.entity';

describe('Trip Entity', () => {
  const defaultProps = {
    driverId: 'driver-1',
    vehicleType: 'SUV' as const,
    mode: 'DOOR_TO_DOOR' as const,
    originCity: 'Quito',
    originAddress: 'Av. Amazonas',
    destCity: 'Guayaquil',
    destAddress: 'Malecon',
    departureTime: new Date(),
    basePrice: 100,
    currency: 'USD',
  };

  it('should create a trip with default values', () => {
    const trip = Trip.create(defaultProps);
    expect(trip.id).toBeDefined();
    expect(trip.status).toBe('SCHEDULED');
    expect(trip.passengers).toHaveLength(0);
    expect(trip.pricePerPassenger).toBe(100);
  });

  describe('Capacity and Seating', () => {
    it('should have correct max capacity for SUV (3)', () => {
      const trip = Trip.create({ ...defaultProps, vehicleType: 'SUV' });
      expect(trip.getMaxCapacity()).toBe(3);
    });

    it('should have correct max capacity for VAN (7)', () => {
      const trip = Trip.create({ ...defaultProps, vehicleType: 'VAN' });
      expect(trip.getMaxCapacity()).toBe(7);
    });

    it('should prevent adding more passengers than capacity', () => {
      const trip = Trip.create({ ...defaultProps, vehicleType: 'SUV' });
      trip.addPassenger({ userId: 'p1', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      trip.addPassenger({ userId: 'p2', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      trip.addPassenger({ userId: 'p3', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      
      expect(() => trip.addPassenger({ userId: 'p4', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false }))
        .toThrow('No seats available.');
    });

    it('should prevent more than one front seat passenger in SUV', () => {
      const trip = Trip.create({ ...defaultProps, vehicleType: 'SUV' });
      trip.addPassenger({ userId: 'p1', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: true });
      
      expect(() => trip.addPassenger({ userId: 'p2', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: true }))
        .toThrow('Only one passenger can have the front seat in SUV.');
    });
  });

  describe('Pricing Recalculation', () => {
    it('should apply 60% of base price when 2 passengers are added', () => {
      const trip = Trip.create({ ...defaultProps, basePrice: 100 });
      trip.addPassenger({ userId: 'p1', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      expect(trip.pricePerPassenger).toBe(100);
      
      trip.addPassenger({ userId: 'p2', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      expect(trip.pricePerPassenger).toBe(60); // 100 * 0.6
      expect(trip.passengers[0].pricePaid).toBe(60);
      expect(trip.passengers[1].pricePaid).toBe(60);
    });

    it('should apply 45% of base price when 3 passengers are added', () => {
      const trip = Trip.create({ ...defaultProps, basePrice: 100 });
      trip.addPassenger({ userId: 'p1', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      trip.addPassenger({ userId: 'p2', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      trip.addPassenger({ userId: 'p3', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      
      expect(trip.pricePerPassenger).toBe(45); // 100 * 0.45
      expect(trip.passengers[0].pricePaid).toBe(45);
      expect(trip.passengers[2].pricePaid).toBe(45);
    });
  });

  describe('Status Transitions', () => {
    it('should transition to WAITING_PASSENGERS when capacity is full', () => {
      const trip = Trip.create({ ...defaultProps, vehicleType: 'SUV' });
      trip.addPassenger({ userId: 'p1', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      trip.addPassenger({ userId: 'p2', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      trip.addPassenger({ userId: 'p3', originCity: 'Q', originAddress: 'A', destCity: 'G', destAddress: 'M', frontSeat: false });
      
      expect(trip.status).toBe('WAITING_PASSENGERS');
    });

    it('should transition to IN_TRANSIT when started', () => {
      const trip = Trip.create(defaultProps);
      trip.start();
      expect(trip.status).toBe('IN_TRANSIT');
    });

    it('should transition to COMPLETED when finished', () => {
      const trip = Trip.create(defaultProps);
      trip.start();
      trip.complete();
      expect(trip.status).toBe('COMPLETED');
    });

    it('should allow cancellation for scheduled trips', () => {
      const trip = Trip.create(defaultProps);
      trip.cancel();
      expect(trip.status).toBe('CANCELLED');
    });

    it('should throw error when completing a non-in-transit trip', () => {
      const trip = Trip.create(defaultProps);
      expect(() => trip.complete()).toThrow('Only in-transit trips can be completed.');
    });
  });
});
