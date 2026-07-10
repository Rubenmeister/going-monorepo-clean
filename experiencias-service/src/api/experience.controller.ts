import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateExperienceDto,
  CreateExperienceUseCase,
  GetExperienceByIdUseCase,
  SearchExperiencesUseCase,
  PublishExperienceUseCase,
} from '@going-monorepo-clean/domains-experience-application';
import {
  ExperienceSearchFilters,
  IExperienceRepository,
} from '@going-monorepo-clean/domains-experience-core';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser { id: string; email: string; role: string; }

@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
    private readonly getExperienceByIdUseCase: GetExperienceByIdUseCase,
    private readonly searchExperiencesUseCase: SearchExperiencesUseCase,
    private readonly publishExperienceUseCase: PublishExperienceUseCase,
    @Inject(IExperienceRepository)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  /**
   * GET /experiences/mine — experiencias del operador autenticado, INCLUIDOS
   * borradores (panel de operador, auditoría webapp #8). Antes de @Get(':id').
   */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async myExperiences(@CurrentUser() user: AuthUser): Promise<any[]> {
    const result = await this.experienceRepo.findByHostId(user.id);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map((e) => e.toPrimitives());
  }

  /**
   * GET /experiences/operator/stats — panel del operador (webapp #8 pulido C).
   * Conteo REAL de actividades publicadas/borrador. Antes de @Get(':id').
   */
  @Get('operator/stats')
  @UseGuards(JwtAuthGuard)
  async operatorStats(@CurrentUser() user: AuthUser): Promise<any> {
    const result = await this.experienceRepo.findByHostId(user.id);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    const mine = result.value.map((e) => e.toPrimitives());
    const activeActivities = mine.filter(
      (e: any) => String(e.status ?? '').toLowerCase() === 'published',
    ).length;
    return { activeActivities, draftActivities: mine.length - activeActivities };
  }

  /** POST /experiences — requires JWT; hostId from token */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createExperience(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExperienceDto,
  ): Promise<any> {
    return this.createExperienceUseCase.execute({ ...dto, hostId: user.id });
  }

  /** GET /experiences/search — public */
  @Get('search')
  async searchExperiences(
    @Query('city') city?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<any[]> {
    const filters: ExperienceSearchFilters = {
      locationCity: city,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };
    return this.searchExperiencesUseCase.execute(filters);
  }

  /** GET /experiences/:id — public */
  @Get(':id')
  async getExperienceById(@Param('id') id: string): Promise<any> {
    const exp = await this.getExperienceByIdUseCase.execute(id);
    return exp.toPrimitives();
  }

  /** PATCH /experiences/:id/publish — requires JWT; solo el operador dueño o admin (#19) */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishExperience(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<any> {
    const isAdmin = ['admin', 'super_admin', 'ops', 'ADMIN', 'SUPER_ADMIN'].includes(
      user.role,
    );
    return this.publishExperienceUseCase.execute(id, user.id, isAdmin);
  }
}
