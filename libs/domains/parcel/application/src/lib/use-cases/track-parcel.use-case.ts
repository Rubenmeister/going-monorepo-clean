import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Parcel,
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-core';

@Injectable()
export class TrackParcelUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(trackingCode: string): Promise<any> {
    const result = await this.parcelRepo.findByTrackingCode(trackingCode);

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    const parcel = result.value;
    if (!parcel) {
      throw new NotFoundException('Envío no encontrado');
    }

    const primitives = parcel.toPrimitives();
    // Puntos de entrega para el seguimiento. En un envío a un solo destino hay
    // uno; en uno distribuido, varios con su estado. NO se exponen los OTP —
    // esos solo los ve quien recibe— solo dirección, destinatario y estado.
    const deliveries = (primitives.deliveries ?? []).map((d: any) => ({
      sequence: d.sequence,
      address: d.address?.address,
      recipientName: d.recipientName,
      status: d.status,
      deliveredAt: d.deliveredAt,
    }));
    return {
      trackingCode: primitives.trackingCode,
      status: primitives.status,
      from: primitives.origin.address,
      to: primitives.destination.address,
      size: primitives.description,
      createdAt: primitives.createdAt,
      deliveries,
      dropCount: deliveries.length,
      deliveredCount: deliveries.filter((d: any) => d.status === 'delivered').length,
    };
  }
}
