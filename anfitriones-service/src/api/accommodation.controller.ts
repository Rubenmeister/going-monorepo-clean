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
  NotFoundException,
} from '@nestjs/common';
import {
  CreateAccommodationDto,
  CreateAccommodationUseCase,
  GetAccommodationByIdUseCase,
  PublishAccommodationUseCase,
  SearchAccommodationDto,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser { id: string; email: string; role: string; }

@Controller('accommodations')
export class AccommodationController {
  constructor(
    private readonly createAccommodationUseCase: CreateAccommodationUseCase,
    private readonly getAccommodationByIdUseCase: GetAccommodationByIdUseCase,
    private readonly publishAccommodationUseCase: PublishAccommodationUseCase,
    private readonly searchAccommodationUseCase: SearchAccommodationUseCase,
    @Inject(IAccommodationRepository)
    private readonly accommodationRepo: IAccommodationRepository,
  ) {}

  /**
   * GET /accommodations/mine — espacios del anfitrión autenticado, INCLUIDOS
   * borradores (panel de operador, auditoría webapp #8). Antes de @Get(':id').
   */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async myAccommodations(@CurrentUser() user: AuthUser): Promise<any[]> {
    const result = await this.accommodationRepo.findByHostId(user.id);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    return result.value.map((a) => a.toPrimitives());
  }

  /**
   * GET /accommodations/host/stats — panel del anfitrión (webapp #8 pulido C).
   * Conteo REAL de espacios publicados/borrador. Antes de @Get(':id').
   */
  @Get('host/stats')
  @UseGuards(JwtAuthGuard)
  async hostStats(@CurrentUser() user: AuthUser): Promise<any> {
    const result = await this.accommodationRepo.findByHostId(user.id);
    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    const mine = result.value.map((a) => a.toPrimitives());
    const publishedSpaces = mine.filter(
      (a: any) => String(a.status ?? '').toLowerCase() === 'published',
    ).length;
    return { publishedSpaces, draftSpaces: mine.length - publishedSpaces };
  }

  /** POST /accommodations — requires JWT; hostId from token */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAccommodation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAccommodationDto,
  ): Promise<any> {
    return this.createAccommodationUseCase.execute({ ...dto, hostId: user.id });
  }

  /**
   * GET /accommodations — lista PÚBLICA de alojamientos publicados (browse).
   * Faltaba (404 → el browse caía a datos hardcodeados). Antes de @Get(':id').
   */
  @Get()
  async listPublished(): Promise<any> {
    return this.searchAccommodationUseCase.execute({} as SearchAccommodationDto);
  }

  /** GET /accommodations/search — public */
  @Get('search')
  async searchAccommodations(@Query() filters: SearchAccommodationDto): Promise<any> {
    return this.searchAccommodationUseCase.execute(filters);
  }

  /** GET /accommodations/:id — public */
  @Get(':id')
  async getAccommodationById(@Param('id') id: string): Promise<any> {
    const acc = await this.getAccommodationByIdUseCase.execute(id);
    const primitive = acc.toPrimitives();
    // Bloque 3: el GET público solo expone publicados (no draft/archived).
    if (String(primitive.status ?? '').toLowerCase() !== 'published') {
      throw new NotFoundException('Alojamiento no encontrado');
    }
    return primitive;
  }

  /** PATCH /accommodations/:id/publish — requires JWT; solo host dueño o admin (#19) */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishAccommodation(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<any> {
    const isAdmin = ['admin', 'super_admin', 'ops', 'ADMIN', 'SUPER_ADMIN'].includes(
      user.role,
    );
    await this.publishAccommodationUseCase.execute(id, user.id, isAdmin);
    return { status: 'published', message: 'Accommodation published successfully' };
  }
}
