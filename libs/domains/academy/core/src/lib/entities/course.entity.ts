import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';

export enum CourseCategory {
  BUSINESS = 'BUSINESS',
  TECHNOLOGY = 'TECHNOLOGY',
  HOSPITALITY = 'HOSPITALITY',
  TOURISM = 'TOURISM',
  LANGUAGES = 'LANGUAGES',
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseProps {
  id: UUID;
  instructorId: UUID;
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  price: Money;
  durationMinutes: number;
  maxStudents: number;
  thumbnailUrl?: string;
  status: CourseStatus;
  createdAt: Date;
}

export class Course {
  readonly id: UUID;
  readonly instructorId: UUID;
  readonly title: string;
  readonly description: string;
  readonly category: CourseCategory;
  readonly level: CourseLevel;
  readonly price: Money;
  readonly durationMinutes: number;
  readonly maxStudents: number;
  readonly thumbnailUrl?: string;
  readonly status: CourseStatus;
  readonly createdAt: Date;

  private constructor(props: CourseProps) {
    this.id = props.id;
    this.instructorId = props.instructorId;
    this.title = props.title;
    this.description = props.description;
    this.category = props.category;
    this.level = props.level;
    this.price = props.price;
    this.durationMinutes = props.durationMinutes;
    this.maxStudents = props.maxStudents;
    this.thumbnailUrl = props.thumbnailUrl;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    instructorId: UUID;
    title: string;
    description: string;
    category: CourseCategory;
    level: CourseLevel;
    price: Money;
    durationMinutes: number;
    maxStudents: number;
    thumbnailUrl?: string;
  }): Result<Course, Error> {
    if (props.title.length < 5) {
      return err(new Error('Course title must be at least 5 characters'));
    }
    if (props.durationMinutes <= 0) {
      return err(new Error('Course duration must be positive'));
    }
    if (props.maxStudents < 1) {
      return err(new Error('Course must allow at least 1 student'));
    }

    const course = new Course({
      id: uuidv4(),
      ...props,
      status: 'draft',
      createdAt: new Date(),
    });

    return ok(course);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      instructorId: this.instructorId,
      title: this.title,
      description: this.description,
      category: this.category,
      level: this.level,
      price: this.price.toPrimitives(),
      durationMinutes: this.durationMinutes,
      maxStudents: this.maxStudents,
      thumbnailUrl: this.thumbnailUrl,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Course {
    return new Course({
      ...props,
      price: Money.fromPrimitives(props.price),
    });
  }

  public publish(): Result<void, Error> {
    if (this.status === 'published') {
      return err(new Error('Course is already published'));
    }
    if (this.status === 'archived') {
      return err(new Error('Cannot publish an archived course'));
    }
    (this as any).status = 'published';
    return ok(undefined);
  }

  public archive(): Result<void, Error> {
    if (this.status === 'archived') {
      return err(new Error('Course is already archived'));
    }
    if (this.status === 'draft') {
      return err(new Error('Cannot archive a draft course, publish it first'));
    }
    (this as any).status = 'archived';
    return ok(undefined);
  }
}
