import { Course, CourseCategory, CourseLevel } from '@going-monorepo-clean/domains-academy-core';
import { Money } from '@going-monorepo-clean/shared-domain';

describe('Course Entity', () => {
  const validProps = {
    instructorId: 'instructor-1',
    title: 'Curso de TypeScript Avanzado',
    description: 'Aprende TypeScript desde cero',
    category: CourseCategory.TECHNOLOGY,
    level: CourseLevel.INTERMEDIATE,
    price: Money.fromPrimitives({ amount: 5000, currency: 'USD' }),
    durationMinutes: 120,
    maxStudents: 30,
  };

  it('should create a course in draft status', () => {
    const result = Course.create(validProps);
    expect(result.isOk()).toBe(true);
    const course = result._unsafeUnwrap();
    expect(course.status).toBe('draft');
    expect(course.title).toBe('Curso de TypeScript Avanzado');
    expect(course.category).toBe(CourseCategory.TECHNOLOGY);
    expect(course.level).toBe(CourseLevel.INTERMEDIATE);
  });

  it('should reject title shorter than 5 chars', () => {
    const result = Course.create({ ...validProps, title: 'AB' });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('at least 5');
  });

  it('should reject non-positive duration', () => {
    const result = Course.create({ ...validProps, durationMinutes: 0 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('positive');
  });

  it('should reject maxStudents less than 1', () => {
    const result = Course.create({ ...validProps, maxStudents: 0 });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('at least 1');
  });

  it('should publish a draft course', () => {
    const course = Course.create(validProps)._unsafeUnwrap();
    const result = course.publish();
    expect(result.isOk()).toBe(true);
    expect(course.status).toBe('published');
  });

  it('should not publish an already published course', () => {
    const course = Course.create(validProps)._unsafeUnwrap();
    course.publish();
    const result = course.publish();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('already published');
  });

  it('should archive a published course', () => {
    const course = Course.create(validProps)._unsafeUnwrap();
    course.publish();
    const result = course.archive();
    expect(result.isOk()).toBe(true);
    expect(course.status).toBe('archived');
  });

  it('should not archive a draft course', () => {
    const course = Course.create(validProps)._unsafeUnwrap();
    const result = course.archive();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('draft');
  });

  it('should serialize to primitives and back', () => {
    const course = Course.create(validProps)._unsafeUnwrap();
    const primitives = course.toPrimitives();
    const restored = Course.fromPrimitives(primitives);
    expect(restored.id).toBe(course.id);
    expect(restored.title).toBe(course.title);
    expect(restored.status).toBe('draft');
  });
});
