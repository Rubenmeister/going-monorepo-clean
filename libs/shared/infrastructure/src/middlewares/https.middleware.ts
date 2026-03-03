import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class HttpsMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (isProduction && !isSecure) {
      const host = req.headers.host || '';
      return res.redirect(301, `https://${host}${req.url}`);
    }

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
  }
}
