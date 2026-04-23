import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApprovalWorkflowSchema } from '../schemas/approval-workflow.schema';

@Injectable()
export class ApprovalWorkflowRepository {
  constructor(
    @InjectModel(ApprovalWorkflowSchema.name)
    private readonly model: Model<ApprovalWorkflowSchema>,
  ) {}

  async findPendingByCompany(companyId: string): Promise<ApprovalWorkflowSchema[]> {
    return this.model.find({ companyId, status: 'pending' }).sort({ createdAt: -1 }).lean().exec() as any;
  }

  async findById(id: string): Promise<ApprovalWorkflowSchema | null> {
    return this.model.findById(id).lean().exec() as any;
  }

  async create(data: Partial<ApprovalWorkflowSchema>): Promise<ApprovalWorkflowSchema> {
    const doc = new this.model(data);
    return doc.save() as any;
  }

  async decide(id: string, status: 'approved' | 'rejected', decidedBy: string, comments: string): Promise<ApprovalWorkflowSchema | null> {
    return this.model.findByIdAndUpdate(
      id,
      { $set: { status, decidedBy, decidedAt: new Date(), comments } },
      { new: true, lean: true },
    ).exec() as any;
  }

  async countPending(companyId: string): Promise<number> {
    return this.model.countDocuments({ companyId, status: 'pending' }).exec();
  }
}
