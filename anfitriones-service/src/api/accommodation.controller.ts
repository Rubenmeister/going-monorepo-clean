import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateAccommodationDto,
  CreateAccommodationUseCase,
  GetAccommodationByIdUseCase,
  PublishAccommodationUseCase,
  SearchAccommodationDto,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser { id: string; email: string; role: string; }

@Controller('accommodations')
export class AccommodationController {
  constructor(
    private readonly createAccommodationUseCase: CreateAccommodationUseCase,
    private readonly getAccommodationByIdUseCase: GetAccommodationByIdUseCase,
    private readonly publishAccommodationUseCase: PublishAccommodationUseCase,
    private readonly searchAccommodationUseCase: SearchAccommodationUseCase,
  ) {}

  /** POST /accommodations — requires JWT; hostId from token */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAccommodation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAccommodationDto,
  ): Promise<any> {
    return this.createAccommodationUseCase.execute({ ...dto, hostId: user.id });
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
    return acc.toPrimitives();
  }

  /** PATCH /accommodations/:id/publish — requires JWT */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishAccommodation(@Param('id') id: string): Promise<any> {
    await this.publishAccommodationUseCase.execute(id);
    return { status: 'published', message: 'Accommodation published successfully' };
  }
}
