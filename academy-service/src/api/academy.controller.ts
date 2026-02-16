import { Controller, Post, Body, Get, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateCourseUseCase,
  CreateCourseDto,
  GetCourseByIdUseCase,
  SearchCoursesUseCase,
  SearchCourseDto,
  PublishCourseUseCase,
} from '@going-monorepo-clean/domains-academy-application';
import { UUID, Roles } from '@going-monorepo-clean/shared-domain';

@ApiTags('academy')
@Controller('courses')
export class AcademyController {
  constructor(
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly getCourseByIdUseCase: GetCourseByIdUseCase,
    private readonly searchCoursesUseCase: SearchCoursesUseCase,
    private readonly publishCourseUseCase: PublishCourseUseCase,
  ) {}

  @Post()
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Curso creado exitosamente' })
  async create(@Body() dto: CreateCourseDto) {
    return this.createCourseUseCase.execute(dto);
  }

  @Get('search')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Buscar cursos publicados' })
  @ApiResponse({ status: 200, description: 'Lista de cursos encontrados' })
  async search(@Query() filters: SearchCourseDto) {
    return this.searchCoursesUseCase.execute(filters);
  }

  @Get(':id')
  @Roles('user', 'host', 'admin')
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  @ApiParam({ name: 'id', description: 'ID del curso' })
  @ApiResponse({ status: 200, description: 'Curso encontrado' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  async getById(@Param('id') id: UUID) {
    const course = await this.getCourseByIdUseCase.execute(id);
    return course.toPrimitives();
  }

  @Patch(':id/publish')
  @Roles('host', 'admin')
  @ApiOperation({ summary: 'Publicar un curso' })
  @ApiParam({ name: 'id', description: 'ID del curso' })
  @ApiResponse({ status: 200, description: 'Curso publicado exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  @ApiResponse({ status: 412, description: 'No se puede publicar el curso en su estado actual' })
  async publish(@Param('id') id: UUID) {
    await this.publishCourseUseCase.execute(id);
    return { message: 'Curso publicado exitosamente' };
  }
}
