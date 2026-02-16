import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Course,
  ICourseRepository,
} from '@going-monorepo-clean/domains-academy-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { CreateCourseDto } from '../dto/create-course.dto';

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepo: ICourseRepository,
  ) {}

  async execute(dto: CreateCourseDto): Promise<{ id: string }> {
    const priceVO = Money.fromPrimitives({ amount: dto.price.amount, currency: dto.price.currency as 'USD' });

    const courseResult = Course.create({
      instructorId: dto.instructorId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      level: dto.level,
      price: priceVO,
      durationMinutes: dto.durationMinutes,
      maxStudents: dto.maxStudents,
      thumbnailUrl: dto.thumbnailUrl,
    });

    if (courseResult.isErr()) {
      throw new InternalServerErrorException(courseResult.error.message);
    }
    const course = courseResult.value;

    const saveResult = await this.courseRepo.save(course);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: course.id };
  }
}
