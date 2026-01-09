import { Experience } from './experience.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

describe('Experience Entity', () => {
  const defaultProps = {
    hostId: 'host-1' as UUID,
    title: 'Test Experience',
    description: 'A wonderful test experience',
    pricePerPerson: 50,
    currency: 'USD',
    durationHours: 2,
    maxCapacity: 10,
    location: 'Test Location',
  };

  it('should create an experience in draft status', () => {
    const experienceResult = Experience.create(defaultProps);
    expect(experienceResult.isOk()).toBe(true);
    const experience = experienceResult._unsafeUnwrap();
    expect(experience.toPrimitives().status).toBe('draft');
    expect(experience.id).toBeDefined();
  });

  it('should return error if title is missing', () => {
    const experienceResult = Experience.create({ ...defaultProps, title: '' });
    expect(experienceResult.isErr()).toBe(true);
    expect(experienceResult._unsafeUnwrapErr().message).toBe('Title is required');
  });

  it('should return error if capacity is zero or negative', () => {
    const experienceResult = Experience.create({ ...defaultProps, maxCapacity: 0 });
    expect(experienceResult.isErr()).toBe(true);
    expect(experienceResult._unsafeUnwrapErr().message).toBe('Capacity must be > 0');
  });

  it('should publish a draft experience', () => {
    const experience = Experience.create(defaultProps)._unsafeUnwrap();
    const publishedResult = experience.publish();
    expect(publishedResult.isOk()).toBe(true);
    expect(publishedResult._unsafeUnwrap().toPrimitives().status).toBe('published');
  });

  it('should error when publishing a non-draft experience', () => {
    const experience = Experience.create(defaultProps)._unsafeUnwrap();
    const published = experience.publish()._unsafeUnwrap();
    const doublePublish = published.publish();
    expect(doublePublish.isErr()).toBe(true);
    expect(doublePublish._unsafeUnwrapErr().message).toBe('Only draft experiences can be published');
  });

  it('should archive an experience', () => {
    const experience = Experience.create(defaultProps)._unsafeUnwrap();
    const archivedResult = experience.archive();
    expect(archivedResult.isOk()).toBe(true);
    expect(archivedResult._unsafeUnwrap().toPrimitives().status).toBe('archived');
  });
});
