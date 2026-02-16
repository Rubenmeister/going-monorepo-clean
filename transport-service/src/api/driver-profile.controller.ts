import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  RegisterDriverProfileDto,
  RegisterDriverProfileUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import { IDriverProfileRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('driver-profiles')
@Controller('driver-profiles')
export class DriverProfileController {
  constructor(
    private readonly registerDriverProfileUseCase: RegisterDriverProfileUseCase,
    @Inject(IDriverProfileRepository) private readonly driverProfileRepo: IDriverProfileRepository,
  ) {}

  @Post('register')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Registrar perfil de conductor (con WhatsApp obligatorio)' })
  @ApiBody({ type: RegisterDriverProfileDto })
  @ApiResponse({ status: 201, description: 'Perfil creado en estado pending_verification' })
  async registerProfile(@Body() dto: RegisterDriverProfileDto): Promise<any> {
    return this.registerDriverProfileUseCase.execute(dto);
  }

  @Get('user/:userId')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Obtener perfil de conductor por userId' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  async getByUserId(@Param('userId') userId: UUID): Promise<any> {
    const result = await this.driverProfileRepo.findByUserId(userId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value ? result.value.toPrimitives() : null;
  }

  @Get(':profileId')
  @Roles('driver', 'admin')
  @ApiOperation({ summary: 'Obtener perfil de conductor por ID' })
  @ApiParam({ name: 'profileId', description: 'ID del perfil' })
  async getById(@Param('profileId') profileId: UUID): Promise<any> {
    const result = await this.driverProfileRepo.findById(profileId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value ? result.value.toPrimitives() : null;
  }
}
