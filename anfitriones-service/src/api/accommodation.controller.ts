import { Controller, Post, Body, Get, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateAccommodationDto,
  CreateAccommodationUseCase,
  SearchAccommodationDto,
  SearchAccommodationUseCase,
  GetAccommodationByIdUseCase,
  PublishAccommodationUseCase,
  GetAccommodationsByHostUseCase,
} from '@going-monorepo-clean/domains-accommodation-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('accommodations')
@Controller('accommodations')
export class AccommodationController {
  constructor(
    private readonly createAccommodationUseCase: CreateAccommodationUseCase,
    private readonly searchAccommodationUseCase: SearchAccommodationUseCase,
    private readonly getByIdUseCase: GetAccommodationByIdUseCase,
    private readonly publishUseCase: PublishAccommodationUseCase,
    private readonly getByHostUseCase: GetAccommodationsByHostUseCase,
  ) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear un nuevo alojamiento' })
  @ApiBody({ type: CreateAccommodationDto })
  @ApiResponse({ status: 201, description: 'Alojamiento creado exitosamente' })
  async createAccommodation(@Body() dto: CreateAccommodationDto): Promise<any> {
    return this.createAccommodationUseCase.execute(dto);
  }

  @Get('search')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Buscar alojamientos por filtros' })
  @ApiResponse({ status: 200, description: 'Lista de alojamientos encontrados' })
  async searchAccommodations(@Query() filters: SearchAccommodationDto): Promise<any> {
    return this.searchAccommodationUseCase.execute(filters);
  }

  @Get('host/:hostId')
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Obtener alojamientos de un anfitrión' })
  @ApiParam({ name: 'hostId', description: 'ID del anfitrión' })
  @ApiResponse({ status: 200, description: 'Lista de alojamientos del anfitrión' })
  async getByHost(@Param('hostId') hostId: UUID): Promise<any> {
    return this.getByHostUseCase.execute(hostId);
  }

  @Get(':id')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener un alojamiento por ID' })
  @ApiParam({ name: 'id', description: 'ID del alojamiento' })
  @ApiResponse({ status: 200, description: 'Alojamiento encontrado' })
  @ApiResponse({ status: 404, description: 'Alojamiento no encontrado' })
  async getById(@Param('id') id: UUID): Promise<any> {
    const acc = await this.getByIdUseCase.execute(id);
    return acc.toPrimitives();
  }

  @Patch(':id/publish')
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Publicar un alojamiento' })
  @ApiParam({ name: 'id', description: 'ID del alojamiento' })
  @ApiResponse({ status: 200, description: 'Alojamiento publicado' })
  @ApiResponse({ status: 404, description: 'Alojamiento no encontrado' })
  async publish(@Param('id') id: UUID): Promise<any> {
    await this.publishUseCase.execute(id);
    return { message: 'Accommodation published' };
  }
}
