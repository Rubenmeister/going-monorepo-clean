import { Experience, ExperienceStatus } from './experience.entity';

describe('Experience Entity', () => {
  const validHostId = 'host-123-uuid';

  const validExperienceProps = {
    hostId: validHostId,
    title: 'Galapagos Snorkeling Tour',
    description: 'Amazing underwater experience with sea lions and turtles',
    pricePerPerson: 150,
    maxCapacity: 12,
    location: 'Galapagos Islands',
  };

  describe('create', () => {
    it('should create an experience with valid data', () => {
      // Act
      const result = Experience.create(validExperienceProps);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const experience = result.value;
        expect(experience.hostId).toBe(validHostId);
        expect(experience.title).toBe('Galapagos Snorkeling Tour');
        expect(experience.status).toBe('draft');
        expect(experience.id).toBeDefined();
        expect(experience.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should fail when price is zero or negative', () => {
      // Arrange
      const invalidProps = { ...validExperienceProps, pricePerPerson: 0 };

      // Act
      const result = Experience.create(invalidProps);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('greater than zero');
      }
    });

    it('should fail when price is negative', () => {
      // Arrange
      const invalidProps = { ...validExperienceProps, pricePerPerson: -50 };

      // Act
      const result = Experience.create(invalidProps);

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  describe('publish', () => {
    it('should publish a draft experience', () => {
      // Arrange
      const experience = Experience.create(validExperienceProps)._unsafeUnwrap();

      // Act
      const result = experience.publish();

      // Assert
      expect(result.isOk()).toBe(true);
      expect(experience.status).toBe('published');
    });

    it('should fail when experience is already published', () => {
      // Arrange
      const experience = Experience.create(validExperienceProps)._unsafeUnwrap();
      experience.publish();

      // Act
      const result = experience.publish();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('already published');
      }
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total price for valid number of people', () => {
      // Arrange
      const experience = Experience.create(validExperienceProps)._unsafeUnwrap();

      // Act
      const result = experience.calculateTotalPrice(5);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(750); // 5 * 150
      }
    });

    it('should fail when capacity is exceeded', () => {
      // Arrange
      const experience = Experience.create(validExperienceProps)._unsafeUnwrap();

      // Act
      const result = experience.calculateTotalPrice(15); // Max is 12

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Capacity exceeded');
      }
    });

    it('should calculate for exactly max capacity', () => {
      // Arrange
      const experience = Experience.create(validExperienceProps)._unsafeUnwrap();

      // Act
      const result = experience.calculateTotalPrice(12); // Exactly max

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(1800); // 12 * 150
      }
    });
  });

  describe('toPrimitives / fromPrimitives', () => {
    it('should serialize and deserialize correctly', () => {
      // Arrange
      const experience = Experience.create(validExperienceProps)._unsafeUnwrap();

      // Act
      const primitives = experience.toPrimitives();
      const restored = Experience.fromPrimitives(primitives);

      // Assert
      expect(restored.id).toBe(experience.id);
      expect(restored.hostId).toBe(experience.hostId);
      expect(restored.title).toBe(experience.title);
      expect(restored.status).toBe(experience.status);
      expect(restored.pricePerPerson).toBe(experience.pricePerPerson);
    });
  });
});
