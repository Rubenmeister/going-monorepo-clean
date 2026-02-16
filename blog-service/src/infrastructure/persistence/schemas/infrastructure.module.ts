import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IArticleRepository } from '@going-monorepo-clean/domains-blog-core';
import { MongooseArticleRepository } from './mongoose-article.repository';
import {
  ArticleModelSchema,
  ArticleSchema,
} from './article.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ArticleModelSchema.name, schema: ArticleSchema },
    ]),
  ],
  providers: [
    {
      provide: IArticleRepository,
      useClass: MongooseArticleRepository,
    },
  ],
  exports: [IArticleRepository],
})
export class InfrastructureModule {}
