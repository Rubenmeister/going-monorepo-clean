import { Body, Controller, Post, Get, Query, HttpCode, HttpStatus, UsePipes, ValidationPipe, HttpException } from '@nestjs/common';
import { 
  CreateExperienceUseCase,
  SearchExperiencesUseCase,
  DeleteExperienceUseCase,
  FindAllExperiencesUseCase,
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
    private readonly deleteExperienceUseCase: DeleteExperienceUseCase,
    private readonly findAllExperiencesUseCase: FindAllExperiencesUseCase,
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

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllExperiences(): Promise<Experience[]> {
    const result = await this.findAllExperiencesUseCase.execute();

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return result.value;
  }

  @Post(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExperience(@Body('id') id: string): Promise<void> {
    const result = await this.deleteExperienceUseCase.execute(id);

    if (result.isErr()) {
      throw new HttpException(result.error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}