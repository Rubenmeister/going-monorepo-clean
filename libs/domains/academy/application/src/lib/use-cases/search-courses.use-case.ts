import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICourseRepository, CourseSearchFilters } from '@going-monorepo-clean/domains-academy-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type CourseSearchResultDto = {
  id: UUID;
  title: string;
  category: string;
  level: string;
  price: number;
  currency: string;
  durationMinutes: number;
  maxStudents: number;
};

@Injectable()
export class SearchCoursesUseCase {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepo: ICourseRepository,
  ) {}

  async execute(filters: CourseSearchFilters): Promise<CourseSearchResultDto[]> {
    const result = await this.courseRepo.searchPublished(filters);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((course) => {
      const p = course.toPrimitives();
      return {
        id: p.id,
        title: p.title,
        category: p.category,
        level: p.level,
        price: p.price.amount,
        currency: p.price.currency,
        durationMinutes: p.durationMinutes,
        maxStudents: p.maxStudents,
      };
    });
  }
}
