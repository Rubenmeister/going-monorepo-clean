import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RateFareList,
  RateFareListDocument,
} from '../infrastructure/schemas/rate-fare-list.schema';
import { PricingEngineService } from './pricing-engine.service';

/**
 * Gestión de listas de tarifas (lifecycle en vivo):
 *  - cargar una lista nueva (queda inactiva),
 *  - activarla → retira automáticamente las demás (switch sin deploy),
 *  - añadir/editar/quitar rutas y precios en una lista,
 *  - eliminar listas viejas.
 * Cada mutación que afecta la lista activa refresca la caché del motor.
 */
@Injectable()
export class FareListService {
  private readonly logger = new Logger(FareListService.name);

  constructor(
    @InjectModel(RateFareList.name)
    private readonly model: Model<RateFareListDocument>,
    private readonly engine: PricingEngineService,
  ) {}

  /** Todas las listas (resumen), la activa primero. */
  async list() {
    const docs = await this.model
      .find({}, { name: 1, service: 1, version: 1, active: 1, source: 1, updatedAt: 1, shared: 1, privateFares: 1 })
      .sort({ service: 1, active: -1, version: -1 })
      .lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      name: d.name,
      service: d.service ?? 'compartido',
      version: d.version,
      active: d.active,
      source: d.source,
      pairs: Object.keys(d.shared ?? {}).length || Object.keys(d.privateFares ?? {}).length,
      updatedAt: d.updatedAt,
    }));
  }

  /** Carga una lista nueva de un servicio. Versión = max de ese servicio +1. */
  async create(input: {
    name: string;
    service?: string;
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
    rates?: Record<string, Record<string, number>>;
    source?: string;
    activate?: boolean;
    createdBy?: string;
  }) {
    if (!input.name) throw new BadRequestException('name requerido');
    const service = input.service ?? 'compartido';
    const last = await this.model.findOne({ service }).sort({ version: -1 }).lean();
    const version = ((last as any)?.version ?? 0) + 1;
    const doc = await this.model.create({
      name: input.name,
      service,
      version,
      active: false,
      source: input.source ?? 'manual',
      shared: input.shared ?? {},
      privateFares: input.privateFares ?? {},
      rates: input.rates,
      importedAt: new Date(),
      createdBy: input.createdBy ?? 'admin',
    });
    this.logger.log(`Lista creada: "${input.name}" [${service}] v${version}`);
    if (input.activate) await this.activate(String(doc._id));
    return { id: String(doc._id), service, version, active: !!input.activate };
  }

  /** Activa una lista y RETIRA solo las del MISMO servicio. Refresca el motor. */
  async activate(id: string) {
    const target = await this.model.findById(id);
    if (!target) throw new NotFoundException(`Lista ${id} no existe`);
    const service = (target as any).service ?? 'compartido';
    await this.model.updateMany(
      { _id: { $ne: target._id }, service },
      { $set: { active: false } },
    );
    target.active = true;
    await target.save();
    await this.engine.refresh();
    this.engine.publishInvalidate();
    this.logger.log(`Lista ACTIVA [${service}]: "${target.name}" v${target.version} (retiradas las otras de ${service})`);
    return { id, service, active: true, version: target.version, name: target.name };
  }

  /** Añade/edita rutas y precios en una lista. `remove` quita pares. */
  async patchFares(id: string, input: {
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
    remove?: string[];
  }) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException(`Lista ${id} no existe`);
    const key = (k: string) => k.toLowerCase();
    const shared = { ...(doc.shared ?? {}) };
    const privateFares = { ...(doc.privateFares ?? {}) };
    for (const [k, v] of Object.entries(input.shared ?? {})) shared[key(k)] = v;
    for (const [k, v] of Object.entries(input.privateFares ?? {})) privateFares[key(k)] = v as any;
    for (const k of input.remove ?? []) { delete shared[key(k)]; delete privateFares[key(k)]; }
    doc.shared = shared;
    doc.privateFares = privateFares;
    doc.markModified('shared');
    doc.markModified('privateFares');
    await doc.save();
    if (doc.active) {
      await this.engine.refresh(); // efecto inmediato si es la activa
      this.engine.publishInvalidate();
    }
    this.logger.log(`Lista "${doc.name}" v${doc.version}: +${Object.keys(input.shared ?? {}).length} / -${(input.remove ?? []).length} rutas`);
    return { id, pairs: Object.keys(shared).length, active: doc.active };
  }

  /** Elimina una lista vieja. No permite borrar la activa. */
  async remove(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException(`Lista ${id} no existe`);
    if ((doc as any).active) throw new BadRequestException('No se puede borrar la lista ACTIVA; activa otra primero');
    await this.model.deleteOne({ _id: id });
    this.logger.log(`Lista eliminada: "${(doc as any).name}" v${(doc as any).version}`);
    return { id, deleted: true };
  }
}
