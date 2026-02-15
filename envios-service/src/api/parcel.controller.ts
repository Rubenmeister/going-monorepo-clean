import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateParcelDto,
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@ApiTags('parcels')
@Controller('parcels')
export class ParcelController {
  constructor(
    private readonly createParcelUseCase: CreateParcelUseCase,
    private readonly findParcelsByUserUseCase: FindParcelsByUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo envío' })
  @ApiBody({ type: CreateParcelDto })
  @ApiResponse({ status: 201, description: 'Envío creado exitosamente', schema: { properties: { id: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createParcel(@Body() dto: CreateParcelDto): Promise<any> {
    return this.createParcelUseCase.execute(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener envíos de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Lista de envíos del usuario' })
  async getParcelsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findParcelsByUserUseCase.execute(userId);
  }
}
