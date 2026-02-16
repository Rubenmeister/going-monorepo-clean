import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  Article,
  IArticleRepository,
  ArticleSearchFilters,
} from '@going-monorepo-clean/domains-blog-core';
import {
  ArticleDocument,
  ArticleModelSchema,
} from './article.schema';

@Injectable()
export class MongooseArticleRepository implements IArticleRepository {
  constructor(
    @InjectModel(ArticleModelSchema.name)
    private readonly model: Model<ArticleDocument>,
  ) {}

  async save(article: Article): Promise<Result<void, Error>> {
    try {
      const primitives = article.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(article: Article): Promise<Result<void, Error>> {
    try {
      const primitives = article.toPrimitives();
      await this.model.updateOne({ id: article.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: string): Promise<Result<Article | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findBySlug(slug: string): Promise<Result<Article | null, Error>> {
    try {
      const doc = await this.model.findOne({ slug }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByAuthorId(authorId: string): Promise<Result<Article[], Error>> {
    try {
      const docs = await this.model.find({ authorId }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async searchPublished(filters: ArticleSearchFilters): Promise<Result<Article[], Error>> {
    try {
      const query: any = { status: 'published' };
      if (filters.category) query.category = filters.category;
      if (filters.mediaType) query.mediaType = filters.mediaType;
      if (filters.tag) query.tags = filters.tag;
      if (filters.title) query.title = { $regex: filters.title, $options: 'i' };

      const docs = await this.model.find(query).sort({ publishedAt: -1 }).exec();
      return ok(docs.map(this.toDomain));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: ArticleDocument): Article {
    return Article.fromPrimitives(doc.toObject() as any);
  }
}
