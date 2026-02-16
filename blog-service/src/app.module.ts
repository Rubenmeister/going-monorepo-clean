import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard, AuditLogInterceptor } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/persistence/schemas/infrastructure.module';
import { ArticleController } from './api/article.controller';
import {
  CreateArticleUseCase,
  GetArticleByIdUseCase,
  GetArticleBySlugUseCase,
  SearchArticlesUseCase,
  PublishArticleUseCase,
} from '@going-monorepo-clean/domains-blog-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.BLOG_DB_URL),
    InfrastructureModule,
  ],
  controllers: [ArticleController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    CreateArticleUseCase,
    GetArticleByIdUseCase,
    GetArticleBySlugUseCase,
    SearchArticlesUseCase,
    PublishArticleUseCase,
  ],
})
export class AppModule {}
