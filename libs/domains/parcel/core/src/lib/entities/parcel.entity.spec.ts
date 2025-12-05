import { Parcel, ParcelStatus } from './parcel.entity';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

describe('Parcel Entity', () => {
  const validUserId = 'user-123-uuid';
  
  const createValidLocation = (city: string) => 
    Location.create({ city, country: 'Ecuador', address: '123 Street' })._unsafeUnwrap();
  
  const createValidMoney = (amount: number) => 
    Money.create(amount, 'USD')._unsafeUnwrap();

  describe('create', () => {
    it('should create a parcel with valid data', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);

      // Act
      const result = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Documents package',
        price,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const parcel = result.value;
        expect(parcel.userId).toBe(validUserId);
        expect(parcel.status).toBe('pending');
        expect(parcel.id).toBeDefined();
        expect(parcel.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should fail when description is too short', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);

      // Act
      const result = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'AB', // Too short
        price,
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('at least 3 characters');
      }
    });

    it('should fail when price is not positive', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = Money.create(0, 'USD')._unsafeUnwrap();

      // Act
      const result = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Valid description',
        price,
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('positive');
      }
    });
  });

  describe('assignDriver', () => {
    it('should assign driver when parcel is pending', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Package',
        price,
      })._unsafeUnwrap();

      // Act
      const result = parcel.assignDriver('driver-123');

      // Assert
      expect(result.isOk()).toBe(true);
      expect(parcel.status).toBe('pickup_assigned');
      expect(parcel.driverId).toBe('driver-123');
    });

    it('should fail when parcel is not pending', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Package',
        price,
      })._unsafeUnwrap();
      
      parcel.assignDriver('driver-1');

      // Act - try to assign again
      const result = parcel.assignDriver('driver-2');

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('not pending');
      }
    });
  });

  describe('markAsInTransit', () => {
    it('should mark as in transit when driver is assigned', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Package',
        price,
      })._unsafeUnwrap();
      parcel.assignDriver('driver-123');

      // Act
      const result = parcel.markAsInTransit();

      // Assert
      expect(result.isOk()).toBe(true);
      expect(parcel.status).toBe('in_transit');
    });

    it('should fail when parcel has no driver assigned', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Package',
        price,
      })._unsafeUnwrap();

      // Act
      const result = parcel.markAsInTransit();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('assigned to a driver');
      }
    });
  });

  describe('deliver', () => {
    it('should deliver when parcel is in transit', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Package',
        price,
      })._unsafeUnwrap();
      parcel.assignDriver('driver-123');
      parcel.markAsInTransit();

      // Act
      const result = parcel.deliver();

      // Assert
      expect(result.isOk()).toBe(true);
      expect(parcel.status).toBe('delivered');
    });

    it('should fail when parcel is not in transit', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Package',
        price,
      })._unsafeUnwrap();

      // Act
      const result = parcel.deliver();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('not in transit');
      }
    });
  });

  describe('toPrimitives / fromPrimitives', () => {
    it('should serialize and deserialize correctly', () => {
      // Arrange
      const origin = createValidLocation('Quito');
      const destination = createValidLocation('Guayaquil');
      const price = createValidMoney(25);
      const parcel = Parcel.create({
        userId: validUserId,
        origin,
        destination,
        description: 'Important docs',
        price,
      })._unsafeUnwrap();

      // Act
      const primitives = parcel.toPrimitives();
      const restored = Parcel.fromPrimitives(primitives);

      // Assert
      expect(restored.id).toBe(parcel.id);
      expect(restored.userId).toBe(parcel.userId);
      expect(restored.status).toBe(parcel.status);
    });
  });
});
