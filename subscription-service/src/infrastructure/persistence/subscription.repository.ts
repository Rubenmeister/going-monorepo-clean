import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionSchema } from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionRepository {
  private readonly logger = new Logger(SubscriptionRepository.name);

  constructor(
    @InjectModel(SubscriptionSchema.name)
    private readonly model: Model<SubscriptionSchema>,
  ) {}

  async findByUserId(userId: string): Promise<any | null> {
    return this.model.findOne({ userId, status: 'active' }).lean().exec();
  }

  async create(data: Partial<any>): Promise<any> {
    const sub = new this.model(data);
    return sub.save();
  }

  async cancel(userId: string): Promise<boolean> {
    const result = await this.model.findOneAndUpdate(
      { userId, status: 'active' },
      { $set: { status: 'cancelled', cancelledAt: new Date(), autoRenew: false } },
    ).exec();
    return !!result;
  }

  async findAll(limit = 50, offset = 0): Promise<any[]> {
    return this.model.find().sort({ createdAt: -1 }).skip(offset).limit(limit).lean().exec();
  }
}
