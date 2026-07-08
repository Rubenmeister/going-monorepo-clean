import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  Req,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '@going-monorepo-clean/domains-user-core';
import { AccountLockoutService } from '../application/account-lockout.service';

/**
 * Admin Controller — serves internal dashboard endpoints.
 * All routes live under /auth/admin/* so the API-gateway's
 * public /auth forRoute forwards them without requiring a
 * gateway-level JWT check; instead we validate the JWT manually
 * here and enforce the "admin" role.
 */
@Controller('auth/admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly accountLockoutService: AccountLockoutService
  ) {}

  // ────────────────────────────────────────────────
  // Security helper
  // ────────────────────────────────────────────────
  /**
   * Verifica un JWT aceptando HS256 (actual) y RS256 (futuro) — auditoría #13.
   * HS256 queda idéntico; solo se añade la rama RS256 con la clave pública.
   */
  private dualVerify(token: string): Record<string, any> {
    const header = JSON.parse(
      Buffer.from(String(token).split('.')[0] ?? '', 'base64url').toString('utf8'),
    );
    if (header?.alg === 'RS256') {
      const pub = process.env.RS256_PUBLIC_KEY;
      if (!pub) throw new Error('Token RS256 pero RS256_PUBLIC_KEY no configurada');
      return this.jwtService.verify(token, {
        publicKey: pub.replace(/\\n/g, '\n'),
        algorithms: ['RS256'],
      } as any) as Record<string, any>;
    }
    return this.jwtService.verify(token) as Record<string, any>;
  }

  private getAdminPayload(req: Request): Record<string, any> {
    const auth = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const token = auth.slice(7);
    try {
      const payload = this.dualVerify(token);
      if (!Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
      return payload;
    } catch (e) {
      if (
        e instanceof HttpException &&
        e.getStatus() === HttpStatus.FORBIDDEN
      ) {
        throw e;
      }
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  // ────────────────────────────────────────────────
  // GET /auth/admin/stats
  // ────────────────────────────────────────────────
  @Get('stats')
  async getStats(@Req() req: Request) {
    this.getAdminPayload(req);

    const [total, active, suspended, admins, drivers] = await Promise.all([
      this.userRepository.countAll(),
      this.userRepository.countAll({ status: 'active' }),
      this.userRepository.countAll({ status: 'suspended' }),
      this.userRepository.countAll({ role: 'admin' }),
      this.userRepository.countAll({ role: 'driver' }),
    ]);

    return {
      total: total.isOk() ? total.value : 0,
      active: active.isOk() ? active.value : 0,
      suspended: suspended.isOk() ? suspended.value : 0,
      admins: admins.isOk() ? admins.value : 0,
      drivers: drivers.isOk() ? drivers.value : 0,
    };
  }

  // ────────────────────────────────────────────────
  // GET /auth/admin/users
  // ────────────────────────────────────────────────
  @Get('users')
  async listUsers(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('role') role?: string,
    @Query('status') status?: string
  ) {
    this.getAdminPayload(req);

    const result = await this.userRepository.findAll({
      limit: limit ? parseInt(limit, 10) : 200,
      skip: skip ? parseInt(skip, 10) : 0,
      role: role || undefined,
      status: status || undefined,
    });

    if (result.isErr()) {
      this.logger.error(`findAll failed: ${result.error.message}`);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Strip sensitive fields before returning
    const users = result.value.map((u) => {
      const p = u.toPrimitives();
      const { passwordHash, verificationToken, ...safe } = p;
      return safe;
    });

    const totalResult = await this.userRepository.countAll({
      role: role || undefined,
      status: status || undefined,
    });

    return {
      users,
      total: totalResult.isOk() ? totalResult.value : users.length,
    };
  }

  // ────────────────────────────────────────────────
  // PATCH /auth/admin/users/:id/status
  // ────────────────────────────────────────────────
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: Request
  ) {
    this.getAdminPayload(req);

    const validStatuses = ['active', 'suspended', 'pending_verification'];
    if (!validStatuses.includes(body.status)) {
      throw new HttpException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await this.userRepository.updateStatus(id, body.status);
    if (result.isErr()) {
      throw new HttpException(
        'Failed to update user status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    this.logger.log(`Admin updated user ${id} status → ${body.status}`);
    return { success: true, id, status: body.status };
  }

  // ────────────────────────────────────────────────
  // Account lockout management
  // ────────────────────────────────────────────────

  /**
   * GET /auth/admin/users/:id/lockout-stats
   * Devuelve el estado actual del lock de la cuenta:
   * { attemptCount, isLocked, lockoutUntil, lastAttempt }
   */
  @Get('users/:id/lockout-stats')
  async getLockoutStats(@Param('id') id: string, @Req() req: Request) {
    this.getAdminPayload(req);
    const stats = await this.accountLockoutService.getLockoutStats(id);
    return { userId: id, ...stats };
  }

  /**
   * POST /auth/admin/users/:id/unlock
   * Desbloquea manualmente una cuenta lockeada por intentos fallidos de login.
   * Limpia las keys lockout:locked:{id} y lockout:attempts:{id} en Redis y deja
   * traza en el audit log lockout:audit:{id}.
   */
  @Post('users/:id/unlock')
  async unlockUserById(@Param('id') id: string, @Req() req: Request) {
    const adminPayload = this.getAdminPayload(req);
    const adminId = (adminPayload.sub as string) ?? 'unknown';

    const ok = await this.accountLockoutService.unlockAccount(id, adminId);
    if (!ok) {
      throw new HttpException(
        'Failed to unlock account. Redis no disponible o error interno.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    this.logger.warn(`Admin ${adminId} unlocked user ${id}`);
    return { success: true, userId: id, unlockedBy: adminId };
  }

  /**
   * POST /auth/admin/users/by-email/:email/unlock
   * Igual que el anterior pero busca al usuario por email primero. Útil cuando
   * el admin solo tiene el correo de la persona bloqueada (caso típico de
   * soporte) sin tener que buscar el userId a mano.
   */
  @Post('users/by-email/:email/unlock')
  async unlockUserByEmail(@Param('email') email: string, @Req() req: Request) {
    const adminPayload = this.getAdminPayload(req);
    const adminId = (adminPayload.sub as string) ?? 'unknown';

    const userResult = await this.userRepository.findByEmail(email);
    if (userResult.isErr() || !userResult.value) {
      throw new HttpException(
        `User with email ${email} not found`,
        HttpStatus.NOT_FOUND
      );
    }

    const user = userResult.value;
    const userId = user.toPrimitives().id;

    const ok = await this.accountLockoutService.unlockAccount(userId, adminId);
    if (!ok) {
      throw new HttpException(
        'Failed to unlock account. Redis no disponible o error interno.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    this.logger.warn(`Admin ${adminId} unlocked user ${userId} (email=${email})`);
    return { success: true, userId, email, unlockedBy: adminId };
  }
}
