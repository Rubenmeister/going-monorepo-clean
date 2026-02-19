import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payout, PayoutDocument } from '../schemas/payout.schema';
import { IPayoutRepository } from '@going/shared-infrastructure';

/**
 * MongoDB Payout Repository
 */
@Injectable()
export class MongoPayoutRepository implements IPayoutRepository {
  constructor(@InjectModel('Payout') private payoutModel: Model<PayoutDocument>) {}

  async create(payout: any): Promise<any> {
    const created = await this.payoutModel.create({
      payoutId: payout.id,
      driverId: payout.driverId,
      amount: payout.amount,
      currency: payout.currency || 'USD',
      status: payout.status || 'pending',
      paymentMethod: payout.paymentMethod,
      periodStart: payout.periodStart,
      periodEnd: payout.periodEnd,
      transactionCount: payout.transactionCount,
      transactionIds: payout.transactionIds || [],
      fees: payout.fees || 0,
      netAmount: payout.netAmount || payout.amount - (payout.fees || 0),
      metadata: payout.metadata || {},
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<any> {
    const doc = await this.payoutModel.findOne({ payoutId: id });
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByDriver(driverId: string, limit = 20): Promise<any[]> {
    const docs = await this.payoutModel
      .find({ driverId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByStatus(status: string, limit = 50): Promise<any[]> {
    const docs = await this.payoutModel
      .find({ status })
      .sort({ createdAt: -1 })
      .limit(limit);

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByDriverAndPeriod(driverId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    const doc = await this.payoutModel.findOne({
      driverId,
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    });

    return doc ? this.mapToEntity(doc) : null;
  }

  async update(id: string, updates: any): Promise<any> {
    const doc = await this.payoutModel.findOneAndUpdate(
      { payoutId: id },
      { ...updates },
      { new: true }
    );

    if (!doc) {
      throw new Error(`Payout ${id} not found`);
    }

    return this.mapToEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.payoutModel.deleteOne({ payoutId: id });
  }

  async findPendingPayouts(): Promise<any[]> {
    const docs = await this.payoutModel
      .find({ status: { $in: ['pending', 'processing'] } })
      .sort({ createdAt: 1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async calculateDriverBalance(driverId: string, upTo = new Date()): Promise<number> {
    const result = await this.payoutModel.aggregate([
      {
        $match: {
          driverId,
          status: 'completed',
          processedAt: { $lte: upTo },
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$netAmount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalPaid : 0;
  }

  async findDuePayouts(daysThreshold = 7): Promise<any[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - daysThreshold);

    const docs = await this.payoutModel
      .find({
        status: 'pending',
        createdAt: { $lte: dueDate },
      })
      .sort({ createdAt: 1 });

    return docs.map((doc) => this.mapToEntity(doc));
  }

  private mapToEntity(doc: any): any {
    return {
      id: doc.payoutId,
      driverId: doc.driverId,
      amount: doc.amount,
      currency: doc.currency,
      status: doc.status,
      paymentMethod: doc.paymentMethod,
      periodStart: doc.periodStart,
      periodEnd: doc.periodEnd,
      transactionCount: doc.transactionCount,
      transactionIds: doc.transactionIds,
      fees: doc.fees,
      netAmount: doc.netAmount,
      createdAt: doc.createdAt,
      processedAt: doc.processedAt,
      failureReason: doc.failureReason,
      metadata: doc.metadata,
    };
  }
}
