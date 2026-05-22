import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpendingLimitSchema } from '../schemas/spending-limit.schema';
import { LimitAmounts } from '../../api/budget.logic';

@Injectable()
export class SpendingLimitRepository {
  constructor(
    @InjectModel(SpendingLimitSchema.name)
    private readonly model: Model<SpendingLimitSchema>,
  ) {}

  async findByCompany(companyId: string): Promise<SpendingLimitSchema[]> {
    return this.model.find({ companyId }).lean().exec() as any;
  }

  async upsert(
    companyId: string,
    scope: string,
    targetId: string,
    amounts: LimitAmounts,
  ): Promise<SpendingLimitSchema> {
    return this.model
      .findOneAndUpdate(
        { companyId, scope, targetId },
        {
          $set: {
            companyId,
            scope,
            targetId,
            daily: amounts.daily ?? null,
            weekly: amounts.weekly ?? null,
            monthly: amounts.monthly ?? null,
          },
        },
        { upsert: true, new: true, lean: true },
      )
      .exec() as any;
  }

  /**
   * Límite aplicable a un empleado, con precedencia empleado → departamento →
   * empresa. Devuelve null si la empresa no definió ningún límite relevante.
   */
  async resolveForEmployee(
    companyId: string,
    employeeId: string,
    department?: string,
  ): Promise<LimitAmounts | null> {
    const all = await this.findByCompany(companyId);
    const pick = (l: SpendingLimitSchema): LimitAmounts => ({
      daily: l.daily,
      weekly: l.weekly,
      monthly: l.monthly,
    });

    const byEmployee = all.find(
      (l) => l.scope === 'employee' && l.targetId === employeeId,
    );
    if (byEmployee) return pick(byEmployee);

    if (department) {
      const byDept = all.find(
        (l) => l.scope === 'department' && l.targetId === department,
      );
      if (byDept) return pick(byDept);
    }

    const byCompany = all.find((l) => l.scope === 'company');
    return byCompany ? pick(byCompany) : null;
  }
}
