/**
 * API Gateway Integration Module
 * Integrates all advanced features:
 * - Rate Limiting (Token Bucket)
 * - Alert Management (Sentry + PagerDuty + Slack)
 * - Performance Monitoring (Prometheus + Grafana)
 * - Caching (Redis)
 * - Security (OWASP, Snyk, Secret scanning)
 */

import { Module, NestModule, MiddlewareConsumer, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import * as Sentry from '@sentry/node';

// Services
import TokenBucketService from '../libs/shared/infrastructure/src/services/token-bucket.service';
import { CacheOptimizerService } from '../libs/shared/infrastructure/src/services/cache-optimizer.service';
import { QueryOptimizerService } from '../libs/shared/database/src/services/query-optimizer.service';
import SentryAlertsIntegration from '../config/sentry-alerts.integration';
import PagerDutyService from '../libs/shared/infrastructure/src/integrations/pagerduty.service';
import SlackAlertsService from '../libs/shared/infrastructure/src/integrations/slack-alerts.service';
import AlertAggregationService from '../libs/shared/infrastructure/src/services/alert-aggregation.service';

// Middleware & Guards
import { RateLimitMiddleware } from './middlewares/rate-limit.middleware';
import { RequestLoggingMiddleware } from './middlewares/request-logging.middleware';
import { PerformanceMonitoringMiddleware } from './middlewares/performance-monitoring.middleware';
import { SentryWebhookController } from './controllers/sentry-webhook.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        '.env.production',
        '.env.staging',
        '.env.development',
      ],
    }),

    // Prometheus Metrics
    PrometheusModule.register({
      path: '/metrics',
      prefix: 'going_platform_',
    }),

    // TypeORM with MongoDB
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService.get('MONGODB_URL'),
        database: 'going-platform',
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('LOG_LEVEL') === 'debug',
        autoLoadEntities: true,
        poolSize: configService.get('MONGODB_POOL_SIZE', 50),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
  ],

  providers: [
    // Rate Limiting
    TokenBucketService,

    // Cache Optimization
    CacheOptimizerService,

    // Database Query Optimization
    QueryOptimizerService,

    // Alert Management
    {
      provide: 'SENTRY_ALERTS',
      useFactory: (
        configService: ConfigService,
        pagerDutyService: typeof PagerDutyService,
        slackService: typeof SlackAlertsService,
        aggregationService: typeof AlertAggregationService
      ) => {
        if (!configService.get('SENTRY_ENABLED')) {
          return null;
        }

        // Initialize Sentry
        Sentry.init({
          dsn: configService.get('SENTRY_DSN'),
          environment: configService.get('SENTRY_ENVIRONMENT', 'production'),
          tracesSampleRate: configService.get('SENTRY_TRACES_SAMPLE_RATE', 0.1),
          profilesSampleRate: configService.get(
            'SENTRY_PROFILES_SAMPLE_RATE',
            0.1
          ),
          integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({
              request: true,
              serverName: true,
              version: false,
              transaction: 'path',
            }),
          ],
        });

        return new SentryAlertsIntegration(
          pagerDutyService,
          slackService,
          aggregationService
        );
      },
      inject: [
        ConfigService,
        'PAGERDUTY_SERVICE',
        'SLACK_SERVICE',
        'ALERT_AGGREGATION_SERVICE',
      ],
    },

    // PagerDuty Service
    {
      provide: 'PAGERDUTY_SERVICE',
      useFactory: (configService: ConfigService) => {
        if (!configService.get('PAGERDUTY_ENABLED')) {
          return null;
        }
        return PagerDutyService;
      },
      inject: [ConfigService],
    },

    // Slack Service
    {
      provide: 'SLACK_SERVICE',
      useFactory: (configService: ConfigService) => {
        if (!configService.get('SLACK_ENABLED')) {
          return null;
        }
        return SlackAlertsService;
      },
      inject: [ConfigService],
    },

    // Alert Aggregation Service
    {
      provide: 'ALERT_AGGREGATION_SERVICE',
      useValue: AlertAggregationService,
    },
  ],

  controllers: [SentryWebhookController],

  exports: [
    TokenBucketService,
    CacheOptimizerService,
    QueryOptimizerService,
    'SENTRY_ALERTS',
    'PAGERDUTY_SERVICE',
    'SLACK_SERVICE',
    'ALERT_AGGREGATION_SERVICE',
  ],
})
export class AdvancedFeaturesModule implements NestModule {
  constructor(
    private configService: ConfigService,
    @Inject('SENTRY_ALERTS') private sentryAlerts: SentryAlertsIntegration
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // Rate Limiting Middleware
    if (this.configService.get('RATE_LIMIT_ENABLED')) {
      consumer.apply(RateLimitMiddleware).forRoutes('*');
    }

    // Request Logging Middleware
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');

    // Performance Monitoring Middleware
    consumer.apply(PerformanceMonitoringMiddleware).forRoutes('*');
  }
}

export default AdvancedFeaturesModule;
