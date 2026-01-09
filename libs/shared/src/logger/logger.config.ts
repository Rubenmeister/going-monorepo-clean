import { LoggerModule } from 'nestjs-pino';
import { RequestMethod } from '@nestjs/common';

export const SharedLoggerModule = LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
    // Exclude health checks from logs to reduce noise
    autoLogging: {
      ignore: (req) => {
        return req.url?.includes('/health') || false;
      },
    },
    customProps: (_req, _res) => ({
      context: 'HTTP',
    }),
  },
  exclude: [{ method: RequestMethod.ALL, path: 'health' }],
});
