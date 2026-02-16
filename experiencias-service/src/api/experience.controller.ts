import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreateExperienceDto,
  CreateExperienceUseCase,
} from '@going-monorepo-clean/domains-experience-application';
import { Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('experiences')
@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
  ) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear una nueva experiencia' })
  @ApiBody({ type: CreateExperienceDto })
  @ApiResponse({ status: 201, description: 'Experiencia creada exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: solo hosts y admins' })
  async createExperience(@Body() dto: CreateExperienceDto): Promise<any> {
    return this.createExperienceUseCase.execute(dto);
  }
}
