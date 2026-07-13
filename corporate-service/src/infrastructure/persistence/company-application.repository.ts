import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyApplicationSchema } from '../schemas/company-application.schema';

@Injectable()
export class CompanyApplicationRepository {
  constructor(
    @InjectModel(CompanyApplicationSchema.name)
    private readonly model: Model<CompanyApplicationSchema>,
  ) {}

  async create(data: Partial<CompanyApplicationSchema>): Promise<CompanyApplicationSchema> {
    const doc = new this.model(data);
    return doc.save() as any;
  }

  /** ¿Ya hay una solicitud abierta (prospect/contacted) con ese RUC o email? */
  async findOpenByRucOrEmail(ruc: string, email: string): Promise<CompanyApplicationSchema | null> {
    return this.model
      .findOne({
        estado: { $in: ['prospect', 'contacted'] },
        $or: [{ ruc }, { contactoEmail: email.toLowerCase() }],
      })
      .lean()
      .exec() as any;
  }

  async findAll(estado?: string, limit = 200): Promise<CompanyApplicationSchema[]> {
    const q = estado ? { estado } : {};
    return this.model.find(q).sort({ createdAt: -1 }).limit(limit).lean().exec() as any;
  }

  async findById(id: string): Promise<CompanyApplicationSchema | null> {
    return this.model.findById(id).lean().exec() as any;
  }

  async updateStatus(
    id: string,
    patch: { estado: string; decididoPor?: string; companyId?: string },
  ): Promise<CompanyApplicationSchema | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { $set: { ...patch, decididoEn: new Date().toISOString() } },
        { new: true },
      )
      .lean()
      .exec() as any;
  }
}
