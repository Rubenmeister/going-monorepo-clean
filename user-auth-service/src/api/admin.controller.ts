import {
  Controller,
  Get,
  Patch,
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
    private readonly jwtService: JwtService
  ) {}

  // ────────────────────────────────────────────────
  // Security helper
  // ────────────────────────────────────────────────
  private getAdminPayload(req: Request): Record<string, any> {
    const auth = req.headers['authorization'] ?? '';
    if (!auth.startsWith('Bearer ')) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const token = auth.slice(7);
    try {
      const payload = this.jwtService.verify(token) as Record<string, any>;
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
}
