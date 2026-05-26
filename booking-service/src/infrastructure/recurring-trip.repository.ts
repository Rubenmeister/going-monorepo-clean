import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RecurringTripDocument,
  RecurringTripModelSchema,
} from './persistence/schemas/recurring-trip.schema';

export interface RecurringTripCreateInput {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  serviceType: 'transport' | 'parcel';
  frequency: 'daily' | 'weekly' | 'monthly';
  weekDays?: number[];
  dayOfMonth?: number;
  time: string;
  origin: { address: string; latitude?: number; longitude?: number };
  destination: { address: string; latitude?: number; longitude?: number };
  vehicleType?: string;
  notes?: string;
  active?: boolean;
}

export type RecurringTripUpdateInput = Partial<
  Omit<RecurringTripCreateInput, 'id' | 'userId' | 'companyId'>
> & {
  expandedUntil?: Date;
  lastExpandedAt?: Date;
};

@Injectable()
export class RecurringTripRepository {
  constructor(
    @InjectModel(RecurringTripModelSchema.name)
    private readonly model: Model<RecurringTripDocument>,
  ) {}

  async create(input: RecurringTripCreateInput): Promise<RecurringTripModelSchema> {
    const doc = new this.model({ active: true, ...input });
    await doc.save();
    return doc.toObject();
  }

  async findById(id: string): Promise<RecurringTripModelSchema | null> {
    return this.model.findOne({ id }).lean<RecurringTripModelSchema>().exec();
  }

  async findByCompany(companyId: string): Promise<RecurringTripModelSchema[]> {
    return this.model
      .find({ companyId })
      .sort({ createdAt: -1 })
      .lean<RecurringTripModelSchema[]>()
      .exec();
  }

  async findByUser(userId: string): Promise<RecurringTripModelSchema[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean<RecurringTripModelSchema[]>()
      .exec();
  }

  /**
   * Cron query: todos los recurrentes activos cuya última expansión es vieja
   * (o nunca expandidos). Limit razonable para no abrumar memoria.
   */
  async findActiveForExpansion(limit = 500): Promise<RecurringTripModelSchema[]> {
    return this.model
      .find({ active: true })
      .limit(limit)
      .lean<RecurringTripModelSchema[]>()
      .exec();
  }

  async update(
    id: string,
    companyId: string,
    patch: RecurringTripUpdateInput,
  ): Promise<RecurringTripModelSchema | null> {
    return this.model
      .findOneAndUpdate(
        { id, companyId },
        { $set: patch },
        { new: true },
      )
      .lean<RecurringTripModelSchema>()
      .exec();
  }

  /**
   * Update sin filtro por companyId — usado solo por el cron expander para
   * sellar `expandedUntil` después de generar bookings.
   */
  async updateExpansionState(
    id: string,
    expandedUntil: Date,
  ): Promise<void> {
    await this.model
      .updateOne(
        { id },
        { $set: { expandedUntil, lastExpandedAt: new Date() } },
      )
      .exec();
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const res = await this.model.deleteOne({ id, companyId }).exec();
    return res.deletedCount > 0;
  }
}
