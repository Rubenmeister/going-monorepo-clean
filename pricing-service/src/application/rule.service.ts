import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RateRule, RateRuleDocument } from '../infrastructure/schemas/rate-rule.schema';
import { PricingEngineService } from './pricing-engine.service';

/**
 * Gestión de REGLAS de recargo (F4) editables en vivo: recargo noche / hora
 * pico / fin de semana / feriado / promo, con condición + efecto + grupo +
 * prioridad. Cada cambio refresca la caché del motor.
 */
@Injectable()
export class RuleService {
  private readonly logger = new Logger(RuleService.name);

  constructor(
    @InjectModel(RateRule.name)
    private readonly model: Model<RateRuleDocument>,
    private readonly engine: PricingEngineService,
  ) {}

  async list() {
    const docs = await this.model.find({}).sort({ active: -1, priority: 1 }).lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      name: d.name,
      active: d.active,
      group: d.group,
      priority: d.priority,
      scope: d.scope,
      condition: d.condition,
      effect: d.effect,
    }));
  }

  /** Crea o actualiza una regla (upsert por `name`). */
  async upsert(body: {
    name: string;
    active?: boolean;
    group?: string;
    priority?: number;
    scope?: Record<string, unknown>;
    condition?: Record<string, unknown>;
    effect?: Record<string, unknown>;
  }) {
    if (!body?.name) throw new BadRequestException('name requerido');
    if (!body.condition || !body.effect) throw new BadRequestException('condition y effect requeridos');
    const doc = await this.model.findOneAndUpdate(
      { name: body.name },
      {
        $set: {
          name: body.name,
          active: body.active ?? true,
          group: body.group ?? '',
          priority: body.priority ?? 100,
          scope: body.scope ?? {},
          condition: body.condition,
          effect: body.effect,
        },
      },
      { upsert: true, new: true },
    );
    await this.engine.refresh();
    this.logger.log(`Regla upsert: "${body.name}" (${body.active === false ? 'inactiva' : 'activa'})`);
    return { id: String(doc._id), name: doc.name, active: doc.active };
  }

  async setActive(id: string, active: boolean) {
    const doc = await this.model.findByIdAndUpdate(id, { $set: { active } }, { new: true });
    if (!doc) throw new NotFoundException(`Regla ${id} no existe`);
    await this.engine.refresh();
    return { id, active: doc.active };
  }

  async remove(id: string) {
    const r = await this.model.deleteOne({ _id: id });
    if (!r.deletedCount) throw new NotFoundException(`Regla ${id} no existe`);
    await this.engine.refresh();
    return { id, deleted: true };
  }
}
