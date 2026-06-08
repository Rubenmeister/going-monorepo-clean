import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CorporateInvoiceSchema } from '../schemas/corporate-invoice.schema';

@Injectable()
export class CorporateInvoiceRepository {
  constructor(
    @InjectModel(CorporateInvoiceSchema.name)
    private readonly model: Model<CorporateInvoiceSchema>,
  ) {}

  /** Genera/regenera la factura del mes (idempotente por companyId+month). */
  async upsertForMonth(
    companyId: string,
    month: string,
    data: Partial<CorporateInvoiceSchema>,
  ): Promise<CorporateInvoiceSchema> {
    return this.model
      .findOneAndUpdate(
        { companyId, month },
        { $set: { ...data, companyId, month } },
        { upsert: true, new: true, lean: true },
      )
      .exec() as any;
  }

  async findByCompany(companyId: string): Promise<CorporateInvoiceSchema[]> {
    return this.model
      .find({ companyId })
      .sort({ month: -1 })
      .lean()
      .exec() as any;
  }

  /** Scoped por companyId: una empresa NO puede leer la factura de otra. */
  async findById(companyId: string, id: string): Promise<CorporateInvoiceSchema | null> {
    return this.model.findOne({ _id: id, companyId }).lean().exec() as any;
  }

  /** Scoped por companyId: solo actualiza si la factura es de esa empresa. */
  async updateStatus(
    companyId: string,
    id: string,
    status: string,
    paidAt: Date | null = null,
  ): Promise<CorporateInvoiceSchema | null> {
    const patch: Record<string, unknown> = { status };
    if (status === 'paid') patch.paidAt = paidAt ?? new Date();
    return this.model
      .findOneAndUpdate({ _id: id, companyId }, { $set: patch }, { new: true, lean: true })
      .exec() as any;
  }
}
