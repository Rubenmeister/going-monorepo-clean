import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateParcelDto,
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { NearbyDriversService } from '../infrastructure/services/nearby-drivers.service';
import { ParcelDispatchGateway } from '../infrastructure/gateways/parcel-dispatch.gateway';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
}

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelController {
  constructor(
    private readonly createParcelUseCase: CreateParcelUseCase,
    private readonly findParcelsByUserUseCase: FindParcelsByUserUseCase,
    private readonly nearbyDrivers: NearbyDriversService,
    private readonly dispatchGateway: ParcelDispatchGateway,
  ) {}

  /**
   * Create a new parcel delivery request
   * POST /api/parcels
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createParcel(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateParcelDto
  ): Promise<any> {
    // Always use the authenticated user's ID — never trust client-provided userId
    const result = await this.createParcelUseCase.execute({
      ...dto,
      userId: user.id,
    });

    // Fire-and-forget: find nearby drivers and dispatch push notifications
    this.nearbyDrivers
      .findNearbyOnlineDrivers(
        dto.origin.latitude,
        dto.origin.longitude,
        10 // 10 km radius
      )
      .then((driverIds) => {
        if (driverIds.length > 0) {
          this.dispatchGateway.broadcastParcelToDrivers(result.id, driverIds, {
            originAddress: dto.origin.address,
            destinationAddress: dto.destination.address,
            price: dto.price.amount,
          });
        }
      })
      .catch(() => { /* non-fatal */ });

    return result;
  }

  /**
   * Get parcels for authenticated user
   * GET /api/parcels/my
   */
  @Get('my')
  async getMyParcels(@CurrentUser() user: AuthUser): Promise<any> {
    return this.findParcelsByUserUseCase.execute(user.id as UUID);
  }

  /**
   * Get parcels by user ID (admin / internal use)
   * GET /api/parcels/user/:userId
   */
  @Get('user/:userId')
  async getParcelsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findParcelsByUserUseCase.execute(userId);
  }
}
