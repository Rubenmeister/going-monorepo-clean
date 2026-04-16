import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CreateParcelDto,
  CreateParcelUseCase,
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-application';
import { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
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
    private readonly parcelRepository: IParcelRepository,
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

  /**
   * Get a single parcel by ID
   * GET /api/parcels/:id
   */
  @Get(':id')
  async getParcelById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const result = await this.parcelRepository.findById(id);
    if (result.isErr()) throw new NotFoundException('Envío no encontrado');
    const parcel = result.value;
    if (!parcel) throw new NotFoundException('Envío no encontrado');
    // Only the owner or admin can see the parcel
    if (parcel.toPrimitives().userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Sin permiso para ver este envío');
    }
    return parcel.toPrimitives();
  }

  /**
   * Cancel a parcel (user can cancel if not yet picked up)
   * PATCH /api/parcels/:id/cancel
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelParcel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: UUID,
  ): Promise<any> {
    const result = await this.parcelRepository.findById(id);
    if (result.isErr() || !result.value) throw new NotFoundException('Envío no encontrado');
    const parcel = result.value;
    const primitives = parcel.toPrimitives();
    if (primitives.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Sin permiso para cancelar este envío');
    }
    if (['delivered', 'cancelled'].includes(primitives.status)) {
      throw new ForbiddenException('El envío ya fue entregado o cancelado');
    }
    if (primitives.status === 'picked_up' || primitives.status === 'in_transit') {
      throw new ForbiddenException('No se puede cancelar: el envío ya fue recogido');
    }
    // Update status to cancelled
    (parcel as any).status = 'cancelled';
    await this.parcelRepository.update(parcel);
    return { message: 'Envío cancelado', id };
  }
}
