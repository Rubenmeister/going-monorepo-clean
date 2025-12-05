import { Body, Controller, Post, Get, Query, HttpCode, HttpStatus, UsePipes, ValidationPipe, HttpException } from '@nestjs/common';
import { 
  CreateExperienceUseCase,
  SearchExperiencesUseCase,
  CreateExperienceDto,
  SearchExperiencesDto,
} from '@going-monorepo-clean/domains-experience-application';
import { Experience } from '@going-monorepo-clean/domains-experience-core';

@Controller('experiences')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true })) 
export class ExperienceController {
  
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
    private readonly searchExperiencesUseCase: SearchExperiencesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExperience(
    @Body() createDto: CreateExperienceDto,
  ): Promise<Experience> {
    const result = await this.createExperienceUseCase.execute(createDto);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST); 
    }
    
    return result.value; 
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchExperiences(
    @Query() searchDto: SearchExperiencesDto,
  ): Promise<Experience[]> { 
    const result = await this.searchExperiencesUseCase.execute(searchDto);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return result.value;
  }
}