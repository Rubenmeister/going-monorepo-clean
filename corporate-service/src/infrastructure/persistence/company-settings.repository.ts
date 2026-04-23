import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanySettingsSchema } from '../schemas/company-settings.schema';

@Injectable()
export class CompanySettingsRepository {
  constructor(
    @InjectModel(CompanySettingsSchema.name)
    private readonly model: Model<CompanySettingsSchema>,
  ) {}

  async findByCompanyId(companyId: string): Promise<CompanySettingsSchema | null> {
    return this.model.findOne({ companyId }).lean().exec() as any;
  }

  async upsert(companyId: string, data: Partial<CompanySettingsSchema>): Promise<CompanySettingsSchema> {
    return this.model.findOneAndUpdate(
      { companyId },
      { $set: data },
      { upsert: true, new: true, lean: true },
    ).exec() as any;
  }
}
