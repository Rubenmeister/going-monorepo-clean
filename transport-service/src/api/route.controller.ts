import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  CreateRouteDto,
  CreateRouteUseCase,
  CreateScheduleDto,
  CreateScheduleUseCase,
} from '@going-monorepo-clean/domains-transport-application';
import {
  IRouteRepository,
  IScheduleRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('routes')
@Controller('routes')
export class RouteController {
  constructor(
    private readonly createRouteUseCase: CreateRouteUseCase,
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    @Inject(IRouteRepository) private readonly routeRepo: IRouteRepository,
    @Inject(IScheduleRepository) private readonly scheduleRepo: IScheduleRepository,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una ruta' })
  @ApiBody({ type: CreateRouteDto })
  @ApiResponse({ status: 201, description: 'Ruta creada' })
  async createRoute(@Body() dto: CreateRouteDto): Promise<any> {
    return this.createRouteUseCase.execute(dto);
  }

  @Post('schedules')
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un horario para una ruta' })
  @ApiBody({ type: CreateScheduleDto })
  @ApiResponse({ status: 201, description: 'Horario creado' })
  async createSchedule(@Body() dto: CreateScheduleDto): Promise<any> {
    return this.createScheduleUseCase.execute(dto);
  }

  @Get()
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener todas las rutas activas' })
  async getActiveRoutes(): Promise<any> {
    const result = await this.routeRepo.findActiveRoutes();
    if (result.isErr()) throw new Error(result.error.message);
    return result.value.map(r => r.toPrimitives());
  }

  @Get(':routeId')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener una ruta por ID' })
  @ApiParam({ name: 'routeId', description: 'ID de la ruta' })
  async getRouteById(@Param('routeId') routeId: UUID): Promise<any> {
    const result = await this.routeRepo.findById(routeId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value ? result.value.toPrimitives() : null;
  }

  @Get(':routeId/schedules')
  @Roles('user', 'driver', 'admin')
  @ApiOperation({ summary: 'Obtener horarios de una ruta' })
  @ApiParam({ name: 'routeId', description: 'ID de la ruta' })
  async getSchedulesByRoute(@Param('routeId') routeId: UUID): Promise<any> {
    const result = await this.scheduleRepo.findByRouteId(routeId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value.map(s => s.toPrimitives());
  }
}
