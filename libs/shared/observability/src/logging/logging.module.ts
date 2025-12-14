import { Module, DynamicModule } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule, Params } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { CORRELATION_ID_HEADER } from '../correlation';

export interface LoggingModuleOptions {
  serviceName: string;
  level?: string;
}

@Module({})
export class LoggingModule {
  static forRoot(options: LoggingModuleOptions): DynamicModule {
    const pinoHttpConfig = {
      level: options.level || process.env['LOG_LEVEL'] || 'info',
      transport: process.env['NODE_ENV'] !== 'production' 
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
      customProps: (req: IncomingMessage & { correlationId?: string }) => ({
        service: options.serviceName,
        correlationId: req.correlationId || 'unknown',
      }),
      serializers: {
        req: (req: IncomingMessage & { method?: string; url?: string }) => ({
          method: req.method,
          url: req.url,
        }),
        res: (res: ServerResponse) => ({
          statusCode: res.statusCode,
        }),
      },
      autoLogging: {
        ignore: (req: IncomingMessage) => 
          req.url === '/health' || req.url === '/health/ready',
      },
    };

    return {
      module: LoggingModule,
      imports: [
        PinoLoggerModule.forRoot({
          pinoHttp: pinoHttpConfig as Params['pinoHttp'],
        }),
      ],
      exports: [PinoLoggerModule],
    };
  }
}
