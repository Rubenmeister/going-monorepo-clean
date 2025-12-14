import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CorrelationMiddleware } from './correlation.middleware';

@Module({
  providers: [CorrelationMiddleware],
  exports: [CorrelationMiddleware],
})
export class CorrelationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
