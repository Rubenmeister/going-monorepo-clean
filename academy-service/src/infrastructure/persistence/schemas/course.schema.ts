import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  CourseCategory,
  CourseLevel,
  CourseStatus,
} from '@going-monorepo-clean/domains-academy-core';

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true })
  currency: string;
}

export type CourseDocument = CourseModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class CourseModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  instructorId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: Object.values(CourseCategory) })
  category: CourseCategory;

  @Prop({ required: true, enum: Object.values(CourseLevel) })
  level: CourseLevel;

  @Prop({ required: true, type: MoneySchema })
  price: MoneySchema;

  @Prop({ required: true })
  durationMinutes: number;

  @Prop({ required: true })
  maxStudents: number;

  @Prop()
  thumbnailUrl: string;

  @Prop({ required: true, enum: ['draft', 'published', 'archived'] })
  status: CourseStatus;

  @Prop()
  createdAt: Date;
}

export const CourseSchema = SchemaFactory.createForClass(CourseModelSchema);
CourseSchema.index({ category: 1 });
CourseSchema.index({ level: 1 });
CourseSchema.index({ 'price.amount': 1 });
