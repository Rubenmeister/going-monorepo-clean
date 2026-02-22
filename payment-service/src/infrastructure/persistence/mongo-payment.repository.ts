import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { IPaymentRepository } from '../../../domain/ports';
import {
  PaginationDto,
  PaginatedResult,
  getPaginationOptions,
  createPaginatedResponse,
} from '@going-monorepo-clean/shared-database';

/**
 * MongoDB Payment Repository
 */
@Injectable()
export class MongoPaymentRepository implements IPaymentRepository {
  constructor(
    @InjectModel('Payment') private paymentModel: Model<PaymentDocument>
  ) {}

  async create(payment: any): Promise<any> {
    const created = await this.paymentModel.create({
      paymentId: payment.id,
      tripId: payment.tripId,
      passengerId: payment.passengerId,
      driverId: payment.driverId,
      amount: payment.amount,
      platformFee: payment.platformFee || 0,
      driverAmount: payment.driverAmount || 0,
      currency: payment.currency || 'USD',
      paymentMethod: payment.paymentMethod,
      status: payment.status || 'pending',
      transactionId: payment.transactionId,
      serviceCharge: payment.serviceCharge || 0,
      tax: payment.tax || 0,
      metadata: payment.metadata || {},
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<any> {
    const doc = await this.paymentModel.findOne({ paymentId: id });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByTrip(tripId: string): Promise<any> {
    const doc = await this.paymentModel.findOne({ tripId });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByPassenger(passengerId: string, limit = 20): Promise<any[]> {
    const docs = await this.paymentModel
      .find({ passengerId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByPassengerPaginated(
    passengerId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { skip, limit } = getPaginationOptions(pagination);
    const [docs, total] = await Promise.all([
      this.paymentModel
        .find({ passengerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.paymentModel.countDocuments({ passengerId }),
    ]);

    return createPaginatedResponse(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      skip,
      limit
    );
  }

  async findByDriver(driverId: string, limit = 20): Promise<any[]> {
    const docs = await this.paymentModel
      .find({ driverId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByDriverPaginated(
    driverId: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { skip, limit } = getPaginationOptions(pagination);
    const [docs, total] = await Promise.all([
      this.paymentModel
        .find({ driverId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.paymentModel.countDocuments({ driverId }),
    ]);

    return createPaginatedResponse(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      skip,
      limit
    );
  }

  async findByStatus(status: string, limit = 50): Promise<any[]> {
    const docs = await this.paymentModel
      .find({ status })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByStatusPaginated(
    status: string,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { skip, limit } = getPaginationOptions(pagination);
    const [docs, total] = await Promise.all([
      this.paymentModel
        .find({ status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.paymentModel.countDocuments({ status }),
    ]);

    return createPaginatedResponse(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      skip,
      limit
    );
  }

  async update(id: string, updates: any): Promise<any> {
    const doc = await this.paymentModel.findOneAndUpdate(
      { paymentId: id },
      { ...updates },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Payment ${id} not found`);
    }

    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.paymentModel.deleteOne({ paymentId: id });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const docs = await this.paymentModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: -1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findCompletedByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const docs = await this.paymentModel
      .find({
        status: 'completed',
        completedAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ completedAt: -1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async calculateDriverRevenue(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await this.paymentModel.aggregate([
      {
        $match: {
          driverId,
          status: 'completed',
          completedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$driverAmount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalRevenue : 0;
  }

  private mapToEntity(doc: any): any {
    return {
      id: doc.paymentId,
      tripId: doc.tripId,
      passengerId: doc.passengerId,
      driverId: doc.driverId,
      amount: doc.amount,
      platformFee: doc.platformFee,
      driverAmount: doc.driverAmount,
      currency: doc.currency,
      paymentMethod: doc.paymentMethod,
      status: doc.status,
      transactionId: doc.transactionId,
      serviceCharge: doc.serviceCharge,
      tax: doc.tax,
      createdAt: doc.createdAt,
      completedAt: doc.completedAt,
      failureReason: doc.failureReason,
      metadata: doc.metadata,
    };
  }
}
