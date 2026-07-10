import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateTourDto,
  CreateTourUseCase,
  GetTourByIdUseCase,
  PublishTourUseCase,
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-application';
import {
  TourSearchFilters,
  ITourRepository,
} from '@going-monorepo-clean/domains-tour-core';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser { id: string; email: string; role: string; }

@Controller('tours')
export class TourController {
  constructor(
    private readonly createTourUseCase: CreateTourUseCase,
    private readonly getTourByIdUseCase: GetTourByIdUseCase,
    private readonly publishTourUseCase: PublishTourUseCase,
    private readonly searchToursUseCase: SearchToursUseCase,
    @Inject(ITourRepository)
    private readonly tourRepo: ITourRepository,
  ) {}

  /**
   * GET /tours/mine — listados del promotor autenticado, INCLUIDOS borradores.
   * Alimenta el panel de operador (auditoría webapp #8). hostId del token.
   * Debe declararse ANTES de @Get(':id') para no ser capturado por él.
   */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async myTours(@CurrentUser() user: AuthUser): Promise<any[]> {
    const result = await this.tourRepo.findByHostId(user.id);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map((t) => t.toPrimitives());
  }

  /** POST /tours — requires JWT; hostId from token */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTour(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTourDto,
  ): Promise<any> {
    return this.createTourUseCase.execute({ ...dto, hostId: user.id });
  }

  /** GET /tours/search — public */
  @Get('search')
  async searchTours(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<any[]> {
    const filters: TourSearchFilters = {
      locationCity: city,
      category: category as any,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };
    return this.searchToursUseCase.execute(filters);
  }

  /** GET /tours/:id — public */
  @Get(':id')
  async getTourById(@Param('id') id: string): Promise<any> {
    const tour = await this.getTourByIdUseCase.execute(id);
    return tour.toPrimitives();
  }

  /** PATCH /tours/:id/publish — requires JWT; solo el host dueño o admin (#19) */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishTour(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<any> {
    const isAdmin = ['admin', 'super_admin', 'ops', 'ADMIN', 'SUPER_ADMIN'].includes(
      user.role,
    );
    return this.publishTourUseCase.execute(id, user.id, isAdmin);
  }
}
