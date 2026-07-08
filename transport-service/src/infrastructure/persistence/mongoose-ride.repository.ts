import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RideModelSchema, RideDocument } from './schemas/ride.schema';
import { IRideRepository } from '../../domain/ports';

@Injectable()
export class MongooseRideRepository implements IRideRepository {
  constructor(
    @InjectModel(RideModelSchema.name)
    private readonly model: Model<RideDocument>
  ) {}

  async create(ride: any): Promise<any> {
    const doc = await this.model.create({
      userId: ride.userId,
      driverId: ride.driverId,
      bookingId: ride.bookingId,
      pickupLocation: ride.pickupLocation?.toObject?.() ?? ride.pickupLocation,
      dropoffLocation:
        ride.dropoffLocation?.toObject?.() ?? ride.dropoffLocation,
      fare: ride.fare?.toObject?.() ?? ride.fare,
      finalFare: ride.finalFare?.toObject?.() ?? ride.finalFare,
      status: ride.status,
      requestedAt: ride.requestedAt,
      acceptedAt: ride.acceptedAt,
      startedAt: ride.startedAt,
      completedAt: ride.completedAt,
      durationSeconds: ride.durationSeconds,
      distanceKm: ride.distanceKm,
      totalDistanceKm: ride.totalDistanceKm,
      cancellationReason: ride.cancellationReason,
      cancellationTime: ride.cancellationTime,
      serviceType: ride.serviceType,
      modalidad: ride.modalidad,
      scheduledAt: ride.scheduledAt,
      lockedFare: ride.lockedFare,
      matchDispatchedAt: ride.matchDispatchedAt,
      channelOpenedAt: ride.channelOpenedAt,
      channelClosedAt: ride.channelClosedAt,
      pickupToken: ride.pickupToken,
      deliveryToken: ride.deliveryToken,
      pickupVerified: ride.pickupVerified,
      deliveryVerified: ride.deliveryVerified,
      deliveryPhotoUrl: ride.deliveryPhotoUrl,
      shareToken: ride.shareToken,
      paymentRef: ride.paymentRef,
      paymentTxnId: ride.paymentTxnId,
      paymentEstimated: ride.paymentEstimated,
      paymentMethod: ride.paymentMethod,
      cashConfirmed: ride.cashConfirmed,
    });
    return this._toRideData(doc);
  }

  async findById(id: string): Promise<any | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;
    return this._toRideData(doc);
  }

  async findByUserId(userId: string, limit = 20): Promise<any[]> {
    const docs = await this.model
      .find({ userId })
      .limit(limit)
      .sort({ requestedAt: -1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findByDriverId(driverId: string, limit = 20): Promise<any[]> {
    const docs = await this.model
      .find({ driverId })
      .limit(limit)
      .sort({ requestedAt: -1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findActiveByDriverId(driverId: string): Promise<any[]> {
    const docs = await this.model
      .find({
        driverId,
        status: { $in: ['requested', 'accepted', 'arriving', 'started'] },
      })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  /**
   * Viaje activo (no terminal) más reciente del pasajero. Devuelve el doc CRUDO
   * (lean) para conservar los campos `lastDriver*` (posición/ETA) que el mapper
   * `_toRideData` no expone — los usa el endpoint de "viaje activo" del asistente.
   */
  async findActiveByUserId(userId: string): Promise<any | null> {
    return this.model
      .findOne({
        userId,
        status: { $in: ['requested', 'scheduled', 'accepted', 'arriving', 'started'] },
      })
      .sort({ requestedAt: -1 })
      .lean();
  }

  async update(id: string, data: any): Promise<any> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
    if (!doc) throw new Error(`Ride ${id} not found`);
    return this._toRideData(doc);
  }

  /**
   * Compare-and-swap atómico: acepta el viaje SOLO si sigue en 'requested'.
   * Si dos conductores aceptan a la vez, sólo uno matchea el filtro; el otro
   * recibe null. Evita la doble-aceptación del read-then-write.
   */
  async acceptIfRequested(rideId: string, driverId: string): Promise<any | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: rideId, status: 'requested' },
        { $set: { driverId, status: 'accepted', acceptedAt: new Date() } },
        { new: true },
      )
      .lean();
    return doc ? this._toRideData(doc) : null;
  }

  async findRecent(limit: number): Promise<any[]> {
    const docs = await this.model
      .find()
      .limit(limit)
      .sort({ requestedAt: -1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findByStatus(
    status: string,
    limit = 20,
    excludeDriverId?: string,
  ): Promise<any[]> {
    const filter: any = { status };
    if (excludeDriverId) {
      // Excluir viajes que este conductor ya rechazó — evita flood en /rides/pending
      filter.rejectedByDriverIds = { $ne: excludeDriverId };
    }
    const docs = await this.model.find(filter).limit(limit).lean();
    return docs.map((d) => this._toRideData(d));
  }

  async findChannelsToClose(cutoff: Date, limit = 100): Promise<any[]> {
    const docs = await this.model
      .find({
        status: 'completed',
        channelOpenedAt: { $ne: null },
        channelClosedAt: null,
        completedAt: { $lt: cutoff },
      })
      .sort({ completedAt: 1 })
      .limit(limit)
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  /**
   * Idempotente: $addToSet evita duplicados si el conductor rechaza dos veces
   * (ej. clic doble o auto-reject + manual). No crea el documento si no existe.
   */
  async addRejection(rideId: string, driverId: string): Promise<void> {
    await this.model.updateOne(
      { _id: rideId },
      { $addToSet: { rejectedByDriverIds: driverId } },
    );
  }

  /**
   * Viajes RESERVADOS listos para despachar: status='scheduled', con
   * scheduledAt <= threshold (= now + lead) y que aún no fueron disparados
   * (matchDispatchedAt null). El filtro por matchDispatchedAt da idempotencia
   * multi-pod sin lock: el primer pod que despacha setea el campo y el resto
   * deja de verlo en la query.
   */
  async findScheduledDue(threshold: Date, limit = 100): Promise<any[]> {
    const docs = await this.model
      .find({
        status: 'scheduled',
        scheduledAt: { $lte: threshold },
        $or: [
          { matchDispatchedAt: { $exists: false } },
          { matchDispatchedAt: null },
        ],
      })
      .limit(limit)
      .sort({ scheduledAt: 1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  /**
   * Viajes reservados próximos que aún no recibieron el recordatorio `field`.
   * Ventana: scheduledAt en (now+fromMin, now+toMin], status no terminal, flag
   * vacío. Idempotencia: el cron setea el flag tras enviar.
   */
  async findUpcomingNeedingReminder(
    field: string,
    fromMin: number,
    toMin: number,
    limit = 100,
  ): Promise<any[]> {
    const now = Date.now();
    const lower = new Date(now + fromMin * 60_000);
    const upper = new Date(now + toMin * 60_000);
    const docs = await this.model
      .find({
        scheduledAt: { $gt: lower, $lte: upper },
        status: { $nin: ['completed', 'cancelled', 'no_driver'] },
        $or: [{ [field]: { $exists: false } }, { [field]: null }],
      })
      .limit(limit)
      .sort({ scheduledAt: 1 })
      .lean();
    return docs.map((d) => this._toRideData(d));
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  private _toRideData(doc: any): any {
    return {
      id: doc._id?.toString() ?? doc.id,
      userId: doc.userId,
      driverId: doc.driverId,
      bookingId: doc.bookingId,
      pickupLocation: doc.pickupLocation,
      dropoffLocation: doc.dropoffLocation,
      fare: doc.fare,
      finalFare: doc.finalFare,
      status: doc.status,
      rejectedByDriverIds: doc.rejectedByDriverIds ?? [],
      requestedAt: doc.requestedAt,
      acceptedAt: doc.acceptedAt,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      durationSeconds: doc.durationSeconds,
      distanceKm: doc.distanceKm,
      totalDistanceKm: doc.totalDistanceKm,
      cancellationReason: doc.cancellationReason,
      cancellationTime: doc.cancellationTime,
      serviceType: doc.serviceType,
      modalidad: doc.modalidad,
      scheduledAt: doc.scheduledAt,
      lockedFare: doc.lockedFare,
      driverConfirmedAt: doc.driverConfirmedAt,
      preliminaryAssignedAt: doc.preliminaryAssignedAt,
      previousDriverId: doc.previousDriverId,
      matchDispatchedAt: doc.matchDispatchedAt,
      channelOpenedAt: doc.channelOpenedAt,
      channelClosedAt: doc.channelClosedAt,
      pickupToken: doc.pickupToken,
      deliveryToken: doc.deliveryToken,
      pickupVerified: doc.pickupVerified,
      deliveryVerified: doc.deliveryVerified,
      deliveryPhotoUrl: doc.deliveryPhotoUrl,
      shareToken: doc.shareToken,
      paymentRef: doc.paymentRef,
      paymentTxnId: doc.paymentTxnId,
      paymentEstimated: doc.paymentEstimated,
      paymentMethod: doc.paymentMethod,
      cashConfirmed: doc.cashConfirmed,
    };
  }
}
