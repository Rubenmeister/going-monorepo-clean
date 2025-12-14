import { Controller, Post, Body, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateTrackingEventUseCase, CreateTrackingEventDto } from '@going-monorepo-clean/domains-tracking-application';

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly createTrackingEventUseCase: CreateTrackingEventUseCase,
  ) {}

  @Post('events')
  async createEvent(@Body() dto: CreateTrackingEventDto) {
    const result = await this.createTrackingEventUseCase.execute(dto);

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return result.value.toPrimitives();
  }
}