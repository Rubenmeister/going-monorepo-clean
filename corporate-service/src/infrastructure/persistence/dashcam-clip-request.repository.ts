import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashcamClipRequestSchema } from '../schemas/dashcam-clip-request.schema';

@Injectable()
export class DashcamClipRequestRepository {
  constructor(
    @InjectModel(DashcamClipRequestSchema.name)
    private readonly model: Model<DashcamClipRequestSchema>,
  ) {}

  async create(data: Partial<DashcamClipRequestSchema>): Promise<DashcamClipRequestSchema> {
    const doc = new this.model(data);
    return doc.save() as any;
  }

  async findByCompany(companyId: string): Promise<DashcamClipRequestSchema[]> {
    return this.model.find({ companyId }).sort({ createdAt: -1 }).lean().exec() as any;
  }
}
