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

  /** Scoped por companyId: una empresa NO puede ver/decidir flujos de otra. */
  async findById(companyId: string, id: string): Promise<ApprovalWorkflowSchema | null> {
    return this.model.findOne({ _id: id, companyId }).lean().exec() as any;
  }

  async create(data: Partial<ApprovalWorkflowSchema>): Promise<ApprovalWorkflowSchema> {
    const doc = new this.model(data);
    return doc.save() as any;
  }

  async update(
    companyId: string,
    id: string,
    patch: Partial<ApprovalWorkflowSchema>,
  ): Promise<ApprovalWorkflowSchema | null> {
    return this.model.findOneAndUpdate(
      { _id: id, companyId },
      { $set: patch },
      { new: true, lean: true },
    ).exec() as any;
  }

  async countPending(companyId: string): Promise<number> {
    return this.model.countDocuments({ companyId, status: 'pending' }).exec();
  }
}
