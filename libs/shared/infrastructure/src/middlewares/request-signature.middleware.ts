import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class RequestSignatureMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSignatureMiddleware.name);

  use(req: any, res: any, next: () => void) {
    // TODO: Implement inter-service HMAC request signature validation
    // For now, pass through all requests
    const signature = req.headers['x-service-signature'];
    if (!signature) {
      this.logger.debug(
        `No service signature on ${req.method} ${req.path} - passing through`
      );
    }
    next();
  }
}
