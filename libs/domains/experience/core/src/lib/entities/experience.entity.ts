import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result, ok, err } from 'neverthrow';

export type ExperienceStatus = 'draft' | 'published' | 'archived';

export interface ExperienceProps {
  id: UUID;
  hostId: UUID;
  title: string;
  description: string;
  status: ExperienceStatus;
  pricePerPerson: number;
  currency: string;
  maxCapacity: number;
  durationHours: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Experience {
  private constructor(private readonly props: ExperienceProps) {}

  static create(props: Omit<ExperienceProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Result<Experience, Error> {
    if (!props.title) return err(new Error('Title is required'));
    if (props.maxCapacity <= 0) return err(new Error('Capacity must be > 0'));
    const now = new Date();
    const experience = new Experience({
      ...props,
      id: crypto.randomUUID() as UUID,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
    return ok(experience);
  }

  publish(): Result<Experience, Error> {
    if (this.props.status !== 'draft') return err(new Error('Only draft experiences can be published'));
    const updated = new Experience({ ...this.props, status: 'published', updatedAt: new Date() });
    return ok(updated);
  }

  archive(): Result<Experience, Error> {
    if (this.props.status === 'archived') return err(new Error('Experience already archived'));
    const updated = new Experience({ ...this.props, status: 'archived', updatedAt: new Date() });
    return ok(updated);
  }

  toPrimitives(): ExperienceProps {
    return { ...this.props };
  }

  static fromPrimitives(data: ExperienceProps): Experience {
    return new Experience(data);
  }
}