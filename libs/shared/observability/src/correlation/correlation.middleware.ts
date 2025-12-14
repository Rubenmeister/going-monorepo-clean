import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

// Extend Express Request to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    
    // Attach to request for downstream use
    req.correlationId = correlationId;
    
    // Set response header
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    
    next();
  }
}

/**
 * Helper to get correlation ID from request
 */
export function getCorrelationId(req: Request): string {
  return req.correlationId || 'unknown';
}
