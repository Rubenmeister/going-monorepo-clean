import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  Shipment,
  IShipmentRepository,
  ShipmentAssignedEvent,
} from '@going-monorepo-clean/domains-transport-core';
import { Money, Location, IEventBus } from '@going-monorepo-clean/shared-domain';
import { CreateShipmentDto } from '../dto/create-shipment.dto';

@Injectable()
export class CreateShipmentUseCase {
  private readonly logger = new Logger(CreateShipmentUseCase.name);

  constructor(
    @Inject(IShipmentRepository)
    private readonly shipmentRepo: IShipmentRepository,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: CreateShipmentDto): Promise<{ id: string }> {
    const originResult = Location.create(dto.origin);
    if (originResult.isErr()) throw new InternalServerErrorException(originResult.error.message);

    const destResult = Location.create(dto.destination);
    if (destResult.isErr()) throw new InternalServerErrorException(destResult.error.message);

    const priceVO = Money.fromPrimitives({
      amount: dto.price.amount,
      currency: dto.price.currency as 'USD',
    });

    const shipmentResult = Shipment.create({
      senderId: dto.senderId,
      recipientName: dto.recipientName,
      recipientPhone: dto.recipientPhone,
      recipientId: dto.recipientId,
      origin: originResult.value,
      destination: destResult.value,
      description: dto.description,
      weightKg: dto.weightKg,
      price: priceVO,
    });

    if (shipmentResult.isErr()) {
      throw new InternalServerErrorException(shipmentResult.error.message);
    }

    const shipment = shipmentResult.value;
    const saveResult = await this.shipmentRepo.save(shipment);
    if (saveResult.isErr()) throw new InternalServerErrorException(saveResult.error.message);

    return { id: shipment.id };
  }
}
