import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import {
  CreateAccommodationDto,
  CreateAccommodationUseCase,
  SearchAccommodationDto,
  SearchAccommodationUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';

@ApiTags('accommodations')
@Controller('accommodations')
export class AccommodationController {
  constructor(
    private readonly createAccommodationUseCase: CreateAccommodationUseCase,
    private readonly searchAccommodationUseCase: SearchAccommodationUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo alojamiento' })
  @ApiBody({ type: CreateAccommodationDto })
  @ApiResponse({ status: 201, description: 'Alojamiento creado exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createAccommodation(@Body() dto: CreateAccommodationDto): Promise<any> {
    return this.createAccommodationUseCase.execute(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar alojamientos por filtros' })
  @ApiResponse({ status: 200, description: 'Lista de alojamientos encontrados' })
  async searchAccommodations(@Query() filters: SearchAccommodationDto): Promise<any> {
    return this.searchAccommodationUseCase.execute(filters);
  }
}
