import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuoteSchema } from '../schemas/quote.schema';

@Injectable()
export class QuoteRepository {
  constructor(
    @InjectModel(QuoteSchema.name)
    private readonly model: Model<QuoteSchema>,
  ) {}

  async create(data: Partial<QuoteSchema>): Promise<QuoteSchema> {
    const doc = new this.model(data);
    return doc.save() as any;
  }

  async findByCompany(companyId: string): Promise<QuoteSchema[]> {
    return this.model.find({ companyId }).sort({ createdAt: -1 }).lean().exec() as any;
  }
}
