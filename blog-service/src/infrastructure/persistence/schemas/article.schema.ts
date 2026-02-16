import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  ArticleCategory,
  MediaType,
  ArticleStatus,
} from '@going-monorepo-clean/domains-blog-core';

export type ArticleDocument = ArticleModelSchema & Document;

@Schema({ timestamps: true, _id: false })
export class ArticleModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  excerpt: string;

  @Prop({ required: true, enum: Object.values(ArticleCategory), index: true })
  category: ArticleCategory;

  @Prop({ required: true, enum: Object.values(MediaType), index: true })
  mediaType: MediaType;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop()
  coverImageUrl: string;

  @Prop()
  videoUrl: string;

  @Prop({ required: true, enum: ['draft', 'published', 'archived'] })
  status: ArticleStatus;

  @Prop({ type: Date, default: null, index: true })
  publishedAt: Date | null;

  @Prop()
  createdAt: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(ArticleModelSchema);
ArticleSchema.index({ slug: 1 }, { unique: true });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ mediaType: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ publishedAt: -1 });
