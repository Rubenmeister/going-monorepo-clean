import { Params } from 'nestjs-pino';

/**
 * Pino logger configuration for structured JSON logs
 * Includes correlation ID and automatic request/response logging
 */
export const pinoLoggerConfig: Params = {
  pinoHttp: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              levelFirst: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    level: process.env.LOG_LEVEL || 'info',
    customProps: (req: any) => ({
      correlationId: req.correlationId || req.headers['x-request-id'],
    }),
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        correlationId: req.correlationId || req.headers['x-request-id'],
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
    },
    autoLogging: {
      ignore: (req: any) => req.url === '/health' || req.url === '/health/live',
    },
  },
};
