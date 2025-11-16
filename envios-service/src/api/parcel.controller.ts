import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import {
  CreateParcelDto,
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('parcels')
export class ParcelController {
  constructor(
    private readonly createParcelUseCase: CreateParcelUseCase,
    private readonly findParcelsByUserUseCase: FindParcelsByUserUseCase,
  ) {}

  @Post()
  // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
  async createParcel(@Body() dto: CreateParcelDto): Promise<any> {
    return this.createParcelUseCase.execute(dto);
  }

  @Get('user/:userId')
  // @UseGuards(AuthGuard('jwt')) // Protegido por el API Gateway
  async getParcelsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findParcelsByUserUseCase.execute(userId);
  }
}