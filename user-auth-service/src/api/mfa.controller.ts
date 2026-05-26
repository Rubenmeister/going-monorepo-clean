/**
 * MfaController — endpoints REST para gestión de MFA del usuario logueado.
 *
 * Rutas (todas requieren JWT excepto verify-login):
 *   GET    /auth/mfa/status                — { enabled, activatedAt? }
 *   POST   /auth/mfa/setup                 — { qrDataUrl, manualEntryCode, recoveryCodes }
 *   POST   /auth/mfa/enable                — body { code }
 *   POST   /auth/mfa/disable               — body { password, code }
 *   POST   /auth/mfa/regenerate-codes      — body { code } → returns nuevos 8 codes
 *
 * El endpoint /auth/mfa/verify-login (parte del login flow, no settings)
 * vive en AuthController porque interactúa con account lockout + JWT issuance.
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { MfaService } from '../application/mfa.service';

interface AuthRequest extends Request {
  user?: { id: string; sub?: string; email: string; [k: string]: any };
}

function extractUserId(req: AuthRequest): string {
  const u = req.user;
  return (u?.id ?? u?.sub) as string;
}

@Controller('auth/mfa')
@UseGuards(AuthGuard('jwt'))
export class MfaController {
  constructor(private readonly mfa: MfaService) {}

  @Get('status')
  async status(@Req() req: AuthRequest) {
    return this.mfa.getStatus(extractUserId(req));
  }

  @Post('setup')
  async setup(@Req() req: AuthRequest) {
    return this.mfa.setup(extractUserId(req));
  }

  @Post('enable')
  async enable(@Req() req: AuthRequest, @Body() body: { code?: string }) {
    if (!body?.code) throw new BadRequestException('code requerido');
    return this.mfa.enable(extractUserId(req), body.code);
  }

  @Post('disable')
  async disable(
    @Req() req: AuthRequest,
    @Body() body: { password?: string; code?: string },
  ) {
    if (!body?.password) throw new BadRequestException('password requerido');
    if (!body?.code) throw new BadRequestException('code requerido');
    return this.mfa.disable(extractUserId(req), body.password, body.code);
  }

  @Post('regenerate-codes')
  async regenerate(@Req() req: AuthRequest, @Body() body: { code?: string }) {
    if (!body?.code) throw new BadRequestException('code requerido');
    const codes = await this.mfa.regenerateRecoveryCodes(extractUserId(req), body.code);
    return { recoveryCodes: codes };
  }
}
