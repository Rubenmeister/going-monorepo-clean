import { Result } from 'neverthrow';
import { Course, CourseCategory, CourseLevel } from '../entities/course.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const ICourseRepository = Symbol('ICourseRepository');

export interface CourseSearchFilters {
  category?: CourseCategory;
  level?: CourseLevel;
  maxPrice?: number;
  title?: string;
}

export interface ICourseRepository {
  save(course: Course): Promise<Result<void, Error>>;
  update(course: Course): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Course | null, Error>>;
  findByInstructorId(instructorId: UUID): Promise<Result<Course[], Error>>;
  searchPublished(filters: CourseSearchFilters): Promise<Result<Course[], Error>>;
}
