import { Controller, Post, Body } from '@nestjs/common';
import {
  CreateExperienceDto,
  CreateExperienceUseCase,
} from '@going-monorepo-clean/domains-experience-application';

@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
  ) {}

  @Post()
  async createExperience(@Body() dto: CreateExperienceDto): Promise<any> {
    return this.createExperienceUseCase.execute(dto);
  }
  
  // (Aquí añadirías endpoints para Search, Publish, etc.)
}