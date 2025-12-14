import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import {
  CreateAccommodationDto,
  CreateAccommodationUseCase,
  SearchAccommodationDto,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';

@Controller('accommodations')
export class AccommodationController {
  constructor(
    private readonly createAccommodationUseCase: CreateAccommodationUseCase,
    private readonly searchAccommodationUseCase: SearchAccommodationUseCase,
  ) {}

  @Post()
  async createAccommodation(@Body() dto: CreateAccommodationDto): Promise<any> {
    return this.createAccommodationUseCase.execute(dto);
  }

  @Get('search')
  async searchAccommodations(@Query() filters: SearchAccommodationDto): Promise<any> {
    return this.searchAccommodationUseCase.execute(filters);
  }
}