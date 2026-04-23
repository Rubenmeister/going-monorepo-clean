import { Controller, Get, Post, Param, Body, Query, Logger } from '@nestjs/common';
import { ArService } from '../application/ar.service';

@Controller('ar')
export class ArController {
  private readonly logger = new Logger(ArController.name);

  constructor(private readonly arService: ArService) {}

  @Get('pois')
  getPois(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('category') category?: string,
  ) {
    return this.arService.getPois(
      parseFloat(lat || '-0.2201'),
      parseFloat(lng || '-78.5123'),
      radius ? parseFloat(radius) : 1,
      category,
    );
  }

  @Get('navigation/:rideId')
  getNavigation(@Param('rideId') rideId: string) {
    return this.arService.getNavigation(rideId);
  }

  @Post('pois')
  addPoi(@Body() body: {
    name: string; category: string; lat: number; lng: number;
    address?: string; phone?: string; rating?: number; description?: string;
  }) {
    return this.arService.addPoi(body);
  }
}
