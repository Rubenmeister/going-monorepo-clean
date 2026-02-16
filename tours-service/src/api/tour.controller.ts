import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateTourUseCase, CreateTourDto } from '@going-monorepo-clean/domains-tour-application';
import { Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('tours')
@Controller('tours')
export class TourController {
  constructor(private readonly createTourUseCase: CreateTourUseCase) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear un nuevo tour' })
  @ApiBody({ type: CreateTourDto })
  @ApiResponse({ status: 201, description: 'Tour creado exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: solo hosts y admins' })
  async create(@Body() dto: CreateTourDto) {
    return this.createTourUseCase.execute(dto);
  }
}
