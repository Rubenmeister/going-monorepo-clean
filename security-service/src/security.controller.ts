import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(private readonly securityService: SecurityService) {}

  /** POST /security/2fa/enable */
  @Post('2fa/enable')
  async enable2FA(@Body() body: { userId: string; method: string }) {
    if (!body.userId || !body.method) throw new BadRequestException('userId and method required');
    return this.securityService.enableTwoFactorAuth(body.userId, body.method as any);
  }

  /** POST /security/2fa/confirm */
  @Post('2fa/confirm')
  async confirm2FA(@Body() body: { userId: string; token: string }) {
    if (!body.userId || !body.token) throw new BadRequestException('userId and token required');
    return this.securityService.confirmTwoFactorAuth(body.userId, body.token);
  }

  /** POST /security/2fa/verify */
  @Post('2fa/verify')
  async verify2FA(@Body() body: { userId: string; code: string }) {
    if (!body.userId || !body.code) throw new BadRequestException('userId and code required');
    const valid = await this.securityService.verifyTwoFactorCode(body.userId, body.code);
    return { valid };
  }

  /** POST /security/audit */
  @Post('audit')
  async logAudit(@Body() body: {
    userId: string; action: string; resourceType: string;
    resourceId: string; status: 'SUCCESS' | 'FAILED'; ipAddress?: string; userAgent?: string; metadata?: any;
  }) {
    return this.securityService.logAudit(
      body.userId, body.action, body.resourceType, body.resourceId,
      body.status, body.ipAddress || '0.0.0.0', body.userAgent || 'unknown', body.metadata,
    );
  }

  /** GET /security/audit/:userId */
  @Get('audit/:userId')
  async getAuditTrail(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.securityService.getAuditTrail(userId, limit ? parseInt(limit) : 50);
  }

  /** POST /security/privacy/request */
  @Post('privacy/request')
  async privacyRequest(@Body() body: { userId: string; requestType: string }) {
    if (!body.userId || !body.requestType) throw new BadRequestException('userId and requestType required');
    return this.securityService.requestDataPrivacy(body.userId, body.requestType as any);
  }

  /** POST /security/encrypt */
  @Post('encrypt')
  async encrypt(@Body() body: { plaintext: string }) {
    if (!body.plaintext) throw new BadRequestException('plaintext required');
    const ciphertext = await this.securityService.encryptData(body.plaintext);
    return { ciphertext };
  }

  /** GET /security/compliance */
  @Get('compliance')
  getCompliance() {
    return this.securityService.getComplianceStatus();
  }

  /** POST /security/keys/rotate */
  @Post('keys/rotate')
  rotateKeys() {
    return this.securityService.rotateEncryptionKeys();
  }
}
