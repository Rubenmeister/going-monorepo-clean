/**
 * Rate Limiting Middleware
 * Enforces per-user, per-IP, and per-endpoint rate limits
 * Uses distributed token bucket algorithm with Redis
 */

import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import TokenBucketService, {
  RateLimitResult,
  RateLimitConfig,
} from '../services/token-bucket.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private rateLimitConfigs: Record<string, RateLimitConfig> = {
    // Auth endpoints (stricter limits)
    '/api/auth/login': { capacity: 5, refillRate: 0.1, window: 60 },
    '/api/auth/register': { capacity: 3, refillRate: 0.05, window: 60 },
    '/api/auth/refresh-token': { capacity: 10, refillRate: 0.17, window: 60 },

    // Payment endpoints (strict limits for security)
    '/api/payments/process': { capacity: 10, refillRate: 0.17, window: 60 },
    '/api/payments/refund': { capacity: 5, refillRate: 0.08, window: 60 },

    // Ride endpoints (moderate limits)
    '/api/rides/request': { capacity: 30, refillRate: 0.5, window: 60 },
    '/api/rides/*': { capacity: 100, refillRate: 1.67, window: 60 },

    // User endpoints (moderate limits)
    '/api/users/*': { capacity: 50, refillRate: 0.83, window: 60 },

    // Default limit for all other endpoints
    default: { capacity: 100, refillRate: 1.67, window: 60 },
  };

  constructor(
    private tokenBucketService: TokenBucketService,
    private configService: ConfigService
  ) {}

  async use(request: Request, response: Response, next: NextFunction) {
    // Skip rate limiting if disabled
    if (!this.configService.get('RATE_LIMIT_ENABLED')) {
      return next();
    }

    try {
      // Extract rate limit identifiers
      const userId = this.extractUserId(request);
      const clientIp = this.extractClientIp(request);
      const endpoint = this.extractEndpoint(request);

      // Determine rate limit configuration
      const config = this.getRateLimitConfig(endpoint);

      // Try to consume tokens for user
      const userResult = await this.tokenBucketService.tryConsume(
        `user:${userId}`,
        1,
        config
      );

      if (!userResult.allowed) {
        return this.sendRateLimitError(
          response,
          userResult,
          `User rate limit exceeded for ${endpoint}`
        );
      }

      // Try to consume tokens for IP address
      const ipResult = await this.tokenBucketService.tryConsume(
        `ip:${clientIp}`,
        1,
        { capacity: 1000, refillRate: 16.67, window: 60 } // Global IP limit: 1000/min
      );

      if (!ipResult.allowed) {
        return this.sendRateLimitError(
          response,
          ipResult,
          `IP rate limit exceeded: ${clientIp}`
        );
      }

      // Try to consume tokens for endpoint
      const endpointResult = await this.tokenBucketService.tryConsume(
        `endpoint:${endpoint}`,
        1,
        { capacity: 10000, refillRate: 166.67, window: 60 } // Global endpoint limit: 10000/min
      );

      if (!endpointResult.allowed) {
        return this.sendRateLimitError(
          response,
          endpointResult,
          `Endpoint rate limit exceeded: ${endpoint}`
        );
      }

      // Add rate limit headers to response
      response.setHeader('X-RateLimit-Limit', config.capacity);
      response.setHeader(
        'X-RateLimit-Remaining',
        Math.floor(userResult.tokensRemaining)
      );
      response.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(userResult.resetTime / 1000)
      );

      // If approaching limit, send warning header
      if (userResult.tokensRemaining < config.capacity * 0.1) {
        response.setHeader('X-RateLimit-Warning', 'Approaching rate limit');
      }

      // Continue to next middleware
      return next();
    } catch (error) {
      console.error('[RateLimitMiddleware] Error:', error);
      // Fail open - allow request if rate limiting service fails
      return next();
    }
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(request: Request): string {
    // Try to get from JWT token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode JWT (simplified, in production use proper JWT verification)
        const decoded = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
        return decoded.sub || decoded.userId || 'anonymous';
      } catch (e) {
        return 'anonymous';
      }
    }

    return 'anonymous';
  }

  /**
   * Extract client IP address
   */
  private extractClientIp(request: Request): string {
    // Check for IP in headers (behind proxy)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return (forwardedFor as string).split(',')[0].trim();
    }

    // Check for IP in other common headers
    const clientIp =
      (request.headers['x-client-ip'] as string) ||
      (request.headers['cf-connecting-ip'] as string) ||
      (request.socket?.remoteAddress as string) ||
      'unknown';

    return clientIp;
  }

  /**
   * Extract endpoint from request
   */
  private extractEndpoint(request: Request): string {
    const path = request.path;
    const method = request.method;

    // Normalize path (remove IDs)
    const normalizedPath = path
      .replace(/\/[0-9a-f]{24}/g, '/:id') // MongoDB ObjectId
      .replace(/\/\d+/g, '/:id'); // Numeric IDs

    return `${method} ${normalizedPath}`;
  }

  /**
   * Get rate limit configuration for endpoint
   */
  private getRateLimitConfig(endpoint: string): RateLimitConfig {
    // Check for exact match
    if (this.rateLimitConfigs[endpoint]) {
      return this.rateLimitConfigs[endpoint];
    }

    // Check for wildcard matches
    for (const [pattern, config] of Object.entries(this.rateLimitConfigs)) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(endpoint)) {
          return config;
        }
      }
    }

    // Return default config
    return this.rateLimitConfigs['default'];
  }

  /**
   * Send rate limit error response
   */
  private sendRateLimitError(
    response: Response,
    result: RateLimitResult,
    message: string
  ): Response {
    const retryAfter = result.retryAfter || 60;

    response.setHeader('Retry-After', retryAfter);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    response.setHeader('X-RateLimit-Remaining', 0);

    return response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message,
      retryAfter,
      timestamp: new Date().toISOString(),
    });
  }
}

export default RateLimitMiddleware;
