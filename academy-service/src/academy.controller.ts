import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AcademyService } from './academy.service';
import { JwtAuthGuard, InternalServiceGuard, CurrentUser } from './infrastructure/auth/jwt.guard';

/**
 * AcademyController — progreso, insignias y niveles de la Academia Going App.
 *
 * TODOS los endpoints requieren cuenta (JwtAuthGuard): guardar progreso y ganar
 * insignias es por usuario. La identidad SIEMPRE sale del JWT (@CurrentUser),
 * nunca del body/param — un usuario solo puede escribir su propio progreso.
 */
@Controller('academy')
export class AcademyController {
  private readonly logger = new Logger(AcademyController.name);
  constructor(private readonly academy: AcademyService) {}

  /** GET /academy/progress — progreso del propio usuario (JWT). */
  @Get('progress')
  @UseGuards(JwtAuthGuard)
  getProgress(@CurrentUser() user: any) {
    return this.academy.getProgress(user.id);
  }

  /** POST /academy/lessons/complete — marca una lección como vista. */
  @Post('lessons/complete')
  @UseGuards(JwtAuthGuard)
  completeLesson(
    @CurrentUser() user: any,
    @Body() body: { courseId: string; lessonId: string },
  ) {
    if (!body?.courseId || !body?.lessonId) {
      throw new BadRequestException('courseId y lessonId requeridos');
    }
    return this.academy.completeLesson(user.id, body.courseId, body.lessonId);
  }

  /**
   * POST /academy/courses/:courseId/complete — registra el resultado del quiz.
   * Body: { quizScore, quizTotal }. Si aprueba (≥2/3), otorga la insignia del
   * curso, la de la escuela si la completó, y recalcula el nivel Aliado.
   */
  @Post('courses/:courseId/complete')
  @UseGuards(JwtAuthGuard)
  completeCourse(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
    @Body() body: { quizScore: number; quizTotal: number },
  ) {
    if (body?.quizScore == null || body?.quizTotal == null) {
      throw new BadRequestException('quizScore y quizTotal requeridos');
    }
    return this.academy.completeCourse(
      user.id,
      courseId,
      Number(body.quizScore),
      Number(body.quizTotal),
    );
  }

  /**
   * POST /academy/levels — niveles de Academia de varios usuarios (S2S).
   * Consumido por el ranking de conductores (transport-service). Requiere
   * X-Internal-Token; el api-gateway borra ese header en el borde público.
   */
  @Post('levels')
  @UseGuards(InternalServiceGuard)
  getLevels(@Body() body: { userIds: string[] }) {
    if (!Array.isArray(body?.userIds)) {
      throw new BadRequestException('userIds (array) requerido');
    }
    return this.academy.getLevelsForUsers(body.userIds);
  }
}
