import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  async createTrip(@Body(new ValidationPipe()) createTripDto: CreateTripDto) {
    return this.tripsService.create(createTripDto);
  }
}