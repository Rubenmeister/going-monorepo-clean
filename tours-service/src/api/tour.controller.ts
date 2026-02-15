import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateTourUseCase, CreateTourDto } from '@going-monorepo-clean/domains-tour-application';

@ApiTags('tours')
@Controller('tours')
export class TourController {
  constructor(private readonly createTourUseCase: CreateTourUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tour' })
  @ApiBody({ type: CreateTourDto })
  @ApiResponse({ status: 201, description: 'Tour creado exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async create(@Body() dto: CreateTourDto) {
    return this.createTourUseCase.execute(dto);
  }
}
