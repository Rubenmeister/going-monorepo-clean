import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InternalServiceGuard } from './internal-service.guard';
import { RideModelSchema } from '../infrastructure/persistence/schemas/ride.schema';
import { ScheduledTripModel } from '../infrastructure/persistence/schemas/scheduled-trip.schema';
import { DriverBaseModelSchema } from '../infrastructure/persistence/schemas/driver-base.schema';

/**
 * PlatformPulseController — endpoint S2S de solo-lectura que resume el estado del
 * PRODUCTO (rides/oferta) para el agente Sacha (going-agent). Protegido con
 * InternalServiceGuard (x-internal-token), nunca con JWT de usuario.
 *
 * Por qué existe: Sacha se llama "agente del producto core (rides, growth,
 * métricas)" pero no tenía forma de leer datos de negocio (no tiene VPC connector
 * ni credenciales de Atlas, y no queremos dárselas porque además escribe a git).
 * Este endpoint centraliza las métricas aquí, donde Atlas ya está conectado, y
 * Sacha las consume vía S2S. Todo es COUNT sobre índices existentes — barato.
 *
 * NO expone datos personales: solo conteos y tasas agregadas.
 */
@Controller('internal/platform-pulse')
@UseGuards(InternalServiceGuard)
export class PlatformPulseController {
  constructor(
    @InjectModel(RideModelSchema.name) private readonly rideModel: Model<any>,
    @InjectModel(ScheduledTripModel.name) private readonly scheduledTripModel: Model<any>,
    @InjectModel(DriverBaseModelSchema.name) private readonly driverBaseModel: Model<any>,
  ) {}

  @Get()
  async pulse(): Promise<Record<string, number | string>> {
    const now = Date.now();
    const t6 = new Date(now - 6 * 60 * 60 * 1000); // ventana de 6h (cada corrida de Sacha)
    const t24 = new Date(now + 24 * 60 * 60 * 1000); // próximos programados
    const stuckBefore = new Date(now - 15 * 60 * 1000); // "requested" >15min sin conductor = atascado
    const nowDate = new Date(now);

    // ── Demanda / cumplimiento en las últimas 6h ────────────────────────────
    const [
      ridesRequested,
      ridesCompleted,
      ridesCancelled,
      ridesNoShow,
      ridesNoDriver,
      ridesStuckNoDriver,
      paymentCaptureFailed,
      orphanSearches,
      scheduledUpcoming24h,
      scheduledUnassigned24h,
      openTripsUpcoming24h,
      activeDrivers,
    ] = await Promise.all([
      this.rideModel.countDocuments({ requestedAt: { $gte: t6 } }),
      this.rideModel.countDocuments({ status: 'completed', completedAt: { $gte: t6 } }),
      this.rideModel.countDocuments({ status: 'cancelled', cancellationTime: { $gte: t6 } }),
      this.rideModel.countDocuments({ status: 'no_show', updatedAt: { $gte: t6 } }),
      this.rideModel.countDocuments({ status: 'no_driver', updatedAt: { $gte: t6 } }),
      // viajes inmediatos atascados: pidieron hace >15min, siguen 'requested', sin conductor
      this.rideModel.countDocuments({
        status: 'requested',
        requestedAt: { $lt: stuckBefore, $gte: t6 },
        $or: [{ driverId: { $exists: false } }, { driverId: null }, { driverId: '' }],
      }),
      // capturas de cobro digital fallidas (reconciliación pendiente)
      this.rideModel.countDocuments({ paymentCaptureStatus: 'failed', paymentCaptureFailedAt: { $gte: t6 } }),
      // búsquedas huérfanas: lease vencido (pod murió a mitad) — salud del motor
      this.rideModel.countDocuments({ status: 'requested', searchingUntil: { $lt: nowDate, $ne: null } }),
      // viajes programados (privado intercity) en las próximas 24h
      this.rideModel.countDocuments({ status: 'scheduled', scheduledAt: { $gte: nowDate, $lte: t24 } }),
      // …de esos, cuántos SIN conductor confirmado todavía
      this.rideModel.countDocuments({
        status: 'scheduled',
        scheduledAt: { $gte: nowDate, $lte: t24 },
        $or: [{ driverConfirmedAt: { $exists: false } }, { driverConfirmedAt: null }],
      }),
      // agendas compartidas abiertas con salidas en las próximas 24h (oferta programada)
      this.scheduledTripModel.countDocuments({ status: 'open', departureAt: { $gte: nowDate, $lte: t24 } }),
      // oferta: conductores activos (proxy de supply)
      this.driverBaseModel.countDocuments({ active: true }),
    ]);

    const completionRate =
      ridesRequested > 0 ? Math.round((ridesCompleted / ridesRequested) * 100) / 100 : 1;

    return {
      windowHours: 6,
      generatedAt: new Date(now).toISOString(),
      ridesRequested,
      ridesCompleted,
      ridesCancelled,
      ridesNoShow,
      ridesNoDriver,
      ridesStuckNoDriver,
      completionRate,
      paymentCaptureFailed,
      orphanSearches,
      scheduledUpcoming24h,
      scheduledUnassigned24h,
      openTripsUpcoming24h,
      activeDrivers,
    };
  }
}
