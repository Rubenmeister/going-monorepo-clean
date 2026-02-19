import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * Request Signer Service
 * Signs HTTP requests for inter-service authentication
 *
 * Strategy:
 * - Each service has a shared secret with the gateway
 * - Sign requests with HMAC-SHA256
 * - Include signature in X-Signature header
 * - Gateway validates signature before forwarding
 *
 * Headers:
 * - X-Service-ID: Service identifier
 * - X-Timestamp: Request timestamp (prevents replay attacks)
 * - X-Signature: HMAC-SHA256 signature
 * - X-Nonce: Random nonce (prevents replay attacks)
 *
 * Signature calculation:
 * HMAC-SHA256(secret, `${serviceId}:${timestamp}:${nonce}:${method}:${path}:${body}`)
 */
@Injectable()
export class RequestSignerService {
  private readonly logger = new Logger(RequestSignerService.name);
  private readonly requestSigningSecret: string;
  private readonly serviceId: string;

  constructor(private configService: ConfigService) {
    this.requestSigningSecret = configService.get('REQUEST_SIGNING_SECRET') || '';
    this.serviceId = configService.get('SERVICE_ID') || 'unknown-service';

    if (!this.requestSigningSecret) {
      this.logger.warn(
        `REQUEST_SIGNING_SECRET not configured. Inter-service signing disabled.`,
      );
    }
  }

  /**
   * Generate a request signature
   *
   * @param method HTTP method (GET, POST, etc)
   * @param path Request path
   * @param body Request body (stringified if object)
   * @param timestamp Optional timestamp (defaults to now)
   * @returns Signature object with headers to include
   */
  sign(
    method: string,
    path: string,
    body?: any,
    timestamp?: number,
  ): {
    'X-Service-ID': string;
    'X-Timestamp': string;
    'X-Nonce': string;
    'X-Signature': string;
  } {
    if (!this.requestSigningSecret) {
      this.logger.warn(`Cannot sign request: REQUEST_SIGNING_SECRET not configured`);
      return {
        'X-Service-ID': this.serviceId,
        'X-Timestamp': new Date().toISOString(),
        'X-Nonce': this.generateNonce(),
        'X-Signature': 'unsigned',
      };
    }

    const ts = timestamp || Date.now();
    const nonce = this.generateNonce();
    const bodyString =
      typeof body === 'string' ? body : JSON.stringify(body || '');

    // Create canonical request string
    const canonical = `${this.serviceId}:${ts}:${nonce}:${method.toUpperCase()}:${path}:${bodyString}`;

    // Generate HMAC signature
    const signature = createHmac('sha256', this.requestSigningSecret)
      .update(canonical)
      .digest('hex');

    this.logger.debug(
      `Signed request for ${method} ${path} with signature ${signature.substring(0, 8)}...`,
    );

    return {
      'X-Service-ID': this.serviceId,
      'X-Timestamp': ts.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature,
    };
  }

  /**
   * Verify a request signature
   *
   * @param headers Request headers containing X-Signature, X-Timestamp, X-Nonce
   * @param method HTTP method
   * @param path Request path
   * @param body Request body
   * @returns true if signature is valid, false otherwise
   */
  verify(
    headers: Record<string, string>,
    method: string,
    path: string,
    body?: any,
  ): boolean {
    if (!this.requestSigningSecret) {
      this.logger.warn(`Cannot verify signature: REQUEST_SIGNING_SECRET not configured`);
      return true; // Allow if not configured
    }

    const serviceId = headers['x-service-id'];
    const timestamp = headers['x-timestamp'];
    const nonce = headers['x-nonce'];
    const providedSignature = headers['x-signature'];

    if (!timestamp || !nonce || !providedSignature) {
      this.logger.warn(`Missing required signature headers`);
      return false;
    }

    // Check timestamp (prevent replay attacks)
    const ts = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (now - ts > maxAge) {
      this.logger.warn(
        `Request timestamp too old: ${new Date(ts).toISOString()}`,
      );
      return false;
    }

    // Recalculate signature
    const bodyString =
      typeof body === 'string' ? body : JSON.stringify(body || '');
    const canonical = `${serviceId}:${timestamp}:${nonce}:${method.toUpperCase()}:${path}:${bodyString}`;

    const expectedSignature = createHmac('sha256', this.requestSigningSecret)
      .update(canonical)
      .digest('hex');

    // Compare signatures (use timing-safe comparison)
    const isValid = this.timingSafeEqual(providedSignature, expectedSignature);

    if (!isValid) {
      this.logger.warn(
        `Invalid signature for ${method} ${path} from service ${serviceId}`,
      );
      return false;
    }

    this.logger.debug(`Verified request signature for ${method} ${path}`);
    return true;
  }

  /**
   * Generate a random nonce
   */
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  /**
   * Timing-safe string comparison
   * Prevents timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
