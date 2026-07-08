import { Controller, Get, Param, NotFoundException, Inject, UseGuards } from '@nestjs/common';
import { IRideRepository } from '../domain/ports';
import { InternalServiceGuard } from './internal-service.guard';

/**
 * RideInternalController — endpoints S2S sobre viajes, protegidos con
 * InternalServiceGuard (x-internal-token), NO con JWT de usuario. Va en un
 * controller aparte porque RideController tiene @UseGuards(JwtAuthGuard) a nivel
 * de clase y ambos guards se acumularían.
 *
 * payment-context (auditoría B1 #1): payment-service lo consulta para NO confiar
 * en el amount/driverId que manda el cliente en POST /payments/process. Devuelve
 * el pasajero, conductor, estado y tarifa AUTORITATIVOS del viaje, para que el
 * pago se calcule server-side y no sea fabricable.
 */
@Controller('rides')
@UseGuards(InternalServiceGuard)
export class RideInternalController {
  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
  ) {}

  @Get(':rideId/payment-context')
  async getPaymentContext(@Param('rideId') rideId: string): Promise<{
    tripId: string;
    passengerId: string | null;
    driverId: string | null;
    status: string | null;
    amount: number;
  }> {
    const ride: any = await this.rideRepo.findById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    // Tarifa autoritativa: finalFare (viaje cerrado) tiene prioridad; si no,
    // el estimado. Los campos fare/finalFare son objetos { estimatedTotal|total }.
    const num = (f: any): number => {
      if (f == null) return NaN;
      if (typeof f === 'number') return f;
      const v = f.estimatedTotal ?? f.total ?? f.amount;
      return typeof v === 'number' ? v : parseFloat(String(v));
    };
    const amount = [num(ride.finalFare), num(ride.fare)].find((n) => Number.isFinite(n) && n > 0) ?? 0;

    return {
      tripId: rideId,
      passengerId: ride.userId ?? null,
      driverId: ride.driverId ?? null,
      status: ride.status ?? null,
      amount,
    };
  }
}
