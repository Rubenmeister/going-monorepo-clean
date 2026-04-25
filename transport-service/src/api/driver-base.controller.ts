import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import {
  AssignDriverBaseUseCase,
  UpdateDriverBaseUseCase,
  DeleteDriverBaseUseCase,
  ListDriverBasesUseCase,
  FindDriversNearBaseUseCase,
  AssignDriverBaseInput,
  UpdateDriverBaseInput,
} from '@going-monorepo-clean/domains-transport-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * DriverBaseController
 *
 * Rutas:
 *   GET    /drivers/me/bases              — listar bases propias (driver)
 *   POST   /drivers/me/bases              — driver crea su base
 *   PATCH  /drivers/me/bases/:id          — driver edita su base
 *   DELETE /drivers/me/bases/:id          — driver desactiva
 *   GET    /drivers/:driverId/bases       — admin ve bases de cualquier driver
 *   POST   /drivers/:driverId/bases       — admin asigna base a un driver
 *   GET    /drivers/bases/near?lat&lng    — admin: drivers con base cercana
 */
@Controller('drivers')
@UseGuards(AuthGuard('jwt'))
export class DriverBaseController {
  constructor(
    private readonly assignBase: AssignDriverBaseUseCase,
    private readonly updateBase: UpdateDriverBaseUseCase,
    private readonly deleteBase: DeleteDriverBaseUseCase,
    private readonly listBases: ListDriverBasesUseCase,
    private readonly findNearBase: FindDriversNearBaseUseCase,
  ) {}

  // ── Driver self-service ──────────────────────────────────────────────

  @Get('me/bases')
  async listMine(@CurrentUser('userId') userId: UUID) {
    const bases = await this.listBases.execute(userId);
    return bases.map((b) => b.toPrimitives());
  }

  @Post('me/bases')
  @HttpCode(HttpStatus.CREATED)
  async createMine(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('roles') roles: string[],
    @Body() body: Omit<AssignDriverBaseInput, 'driverId'>,
  ) {
    if (!roles?.includes('driver')) {
      throw new ForbiddenException('Driver role required');
    }
    const base = await this.assignBase.execute({ ...body, driverId: userId });
    return base.toPrimitives();
  }

  @Patch('me/bases/:id')
  async updateMine(
    @CurrentUser('userId') userId: UUID,
    @Param('id') id: UUID,
    @Body() changes: UpdateDriverBaseInput['changes'],
  ) {
    const updated = await this.updateBase.execute({
      id,
      asDriverId: userId,
      changes,
    });
    return updated.toPrimitives();
  }

  @Delete('me/bases/:id')
  async deleteMine(
    @CurrentUser('userId') userId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.deleteBase.execute(id, { asDriverId: userId });
  }

  // ── Admin ─────────────────────────────────────────────────────────────

  @Get('bases/near')
  async findNear(
    @CurrentUser('roles') roles: string[],
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('maxKm') maxKm?: string,
    @Query('onlyInShift') onlyInShift?: string,
  ) {
    if (!roles?.includes('admin') && !roles?.includes('driver')) {
      throw new ForbiddenException('Admin or driver role required');
    }
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) {
      throw new BadRequestException('lat and lng required as numbers');
    }
    return this.findNearBase.execute({
      lat: la,
      lng: ln,
      maxKm: maxKm ? parseFloat(maxKm) : undefined,
      onlyInShift: onlyInShift === 'true',
    });
  }

  @Get(':driverId/bases')
  async listByDriver(
    @CurrentUser('roles') roles: string[],
    @Param('driverId') driverId: UUID,
  ) {
    if (!roles?.includes('admin')) {
      throw new ForbiddenException('Admin role required');
    }
    const bases = await this.listBases.execute(driverId);
    return bases.map((b) => b.toPrimitives());
  }

  @Post(':driverId/bases')
  @HttpCode(HttpStatus.CREATED)
  async assignByAdmin(
    @CurrentUser('roles') roles: string[],
    @Param('driverId') driverId: UUID,
    @Body() body: Omit<AssignDriverBaseInput, 'driverId'>,
  ) {
    if (!roles?.includes('admin')) {
      throw new ForbiddenException('Admin role required');
    }
    const base = await this.assignBase.execute({ ...body, driverId });
    return base.toPrimitives();
  }
}
