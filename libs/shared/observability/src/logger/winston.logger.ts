import * as winston from 'winston';
import * as ElasticsearchTransport from 'winston-elasticsearch';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export interface LoggerConfig {
  serviceName: string;
  environment?: string;
  logstashUrl?: string;
  elasticsearchNode?: string;
  logLevel?: string;
}

/**
 * Create a configured Winston logger with multiple transports
 */
export function createLogger(config: LoggerConfig): winston.Logger {
  const {
    serviceName,
    environment = process.env.NODE_ENV || 'development',
    logstashUrl = process.env.LOGSTASH_URL || 'localhost:5000',
    elasticsearchNode = process.env.ELASTICSEARCH_NODE ||
      'http://localhost:9200',
    logLevel = process.env.LOG_LEVEL || 'info',
  } = config;

  const transports: winston.transport[] = [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${serviceName}] ${level.toUpperCase()}: ${message} ${metaStr}`;
        })
      ),
    }),

    // Daily rotate file for persistence
    new DailyRotateFile({
      filename: `logs/${serviceName}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),

    // Error logs
    new DailyRotateFile({
      filename: `logs/${serviceName}-error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxDays: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ];

  // Elasticsearch transport for aggregated logging
  if (environment !== 'development') {
    transports.push(
      new ElasticsearchTransport({
        level: logLevel,
        clientOpts: { node: elasticsearchNode },
        index: `going-logs-${serviceName}`,
        transformer: (logData) => ({
          '@timestamp': new Date().toISOString(),
          message: logData.message,
          severity: logData.level,
          service: serviceName,
          environment,
          fields: logData.meta,
        }),
      }) as any
    );
  }

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: serviceName,
      environment,
    },
    transports,
  });
}

/**
 * Structured logging helper for common patterns
 */
export class StructuredLogger {
  constructor(private logger: winston.Logger, private serviceName: string) {}

  info(message: string, data?: Record<string, any>) {
    this.logger.info(message, { service: this.serviceName, ...data });
  }

  error(message: string, error?: Error, data?: Record<string, any>) {
    this.logger.error(message, {
      service: this.serviceName,
      error: error?.message,
      stack: error?.stack,
      ...data,
    });
  }

  warn(message: string, data?: Record<string, any>) {
    this.logger.warn(message, { service: this.serviceName, ...data });
  }

  debug(message: string, data?: Record<string, any>) {
    this.logger.debug(message, { service: this.serviceName, ...data });
  }

  logHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ) {
    this.logger.info('HTTP Request', {
      service: this.serviceName,
      http: {
        method,
        path,
        status_code: statusCode,
        duration_ms: duration,
      },
      user_id: userId,
    });
  }

  logDatabaseQuery(collection: string, operation: string, duration: number) {
    this.logger.debug('Database Query', {
      service: this.serviceName,
      database: {
        collection,
        operation,
        duration_ms: duration,
      },
    });
  }

  logCacheOperation(key: string, operation: string, hit: boolean) {
    this.logger.debug('Cache Operation', {
      service: this.serviceName,
      cache: {
        key,
        operation,
        hit,
      },
    });
  }
}
