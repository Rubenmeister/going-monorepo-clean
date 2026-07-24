import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RateFareList,
  RateFareListDocument,
} from '../infrastructure/schemas/rate-fare-list.schema';
import { PricingEngineService } from './pricing-engine.service';
import { compararListas, alertasDeDiff } from './fare-diff';

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

  /**
   * Añade/edita rutas y precios en una lista BORRADOR. `remove` quita pares.
   *
   * Sobre la lista ACTIVA está prohibido: editarla encima cambiaba el precio que
   * pagan clientes reales sin crear versión, sin autor y sin posibilidad de
   * volver atrás — por eso producción quedó en `version: 1` y fue imposible
   * reconstruir quién bajó una tarifa. Para cambiar lo que está vivo hay que
   * crear un borrador y publicarlo (`publicar()`), que sí deja constancia.
   */
  async patchFares(id: string, input: {
    shared?: Record<string, number>;
    privateFares?: Record<string, Record<string, number>>;
    remove?: string[];
  }) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException(`Lista ${id} no existe`);
    if (doc.active) {
      throw new BadRequestException(
        'No se puede editar la lista ACTIVA en sitio. Crea un borrador ' +
          '(POST /admin/lists), revisa el diff y publícalo: así queda registrado ' +
          'quién cambió qué y se puede deshacer.',
      );
    }
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

  // ── Borrador → diff → publicación ─────────────────────────────────────────
  // El camino ÚNICO para cambiar precios en producción. Cada publicación crea
  // una versión nueva; la anterior queda guardada y se puede restaurar.

  /**
   * Crea un BORRADOR copiando la lista activa de un servicio.
   *
   * Para editar una o pocas rutas sin reescribir toda la tabla: se copia lo
   * vivo a una versión nueva inactiva, se le aplican los cambios con
   * `patchFares`, se revisa el diff y se publica. Así una edición puntual pasa
   * por el mismo control que una carga completa — con autor, motivo y vuelta
   * atrás— en vez de mutar en vivo.
   */
  async draftFromActive(service = 'compartido') {
    const activa = await this.model.findOne({ service, active: true }).lean();
    if (!activa) {
      throw new NotFoundException(`No hay lista activa de "${service}" para copiar`);
    }
    const ultima = await this.model.findOne({ service }).sort({ version: -1 }).lean();
    const version = ((ultima as any)?.version ?? 0) + 1;

    const doc = await this.model.create({
      name: `Borrador sobre v${(activa as any).version}`,
      service,
      version,
      active: false,
      source: 'manual',
      shared: (activa as any).shared ?? {},
      privateFares: (activa as any).privateFares ?? {},
      rates: (activa as any).rates,
      importedAt: new Date(),
      createdBy: 'admin',
    });
    return { id: String(doc._id), service, version, fromVersion: (activa as any).version };
  }

  /**
   * Qué cambiaría si se publicara este borrador. No modifica nada.
   *
   * Es el paso que evita el error caro: ver "Cuenca–Quito SUV: 242 → 220 (−9%)"
   * antes de aplicarlo, en vez de enterarse por un reclamo.
   */
  async diff(id: string) {
    const borrador = await this.model.findById(id).lean();
    if (!borrador) throw new NotFoundException(`Lista ${id} no existe`);
    const service = (borrador as any).service ?? 'compartido';
    const activa = await this.model.findOne({ service, active: true }).lean();

    const d = compararListas(
      {
        shared: (activa as any)?.shared ?? {},
        privateFares: (activa as any)?.privateFares ?? {},
      },
      {
        shared: (borrador as any).shared ?? {},
        privateFares: (borrador as any).privateFares ?? {},
      },
    );

    return {
      borrador: {
        id: String((borrador as any)._id),
        name: (borrador as any).name,
        service,
        version: (borrador as any).version,
      },
      activa: activa
        ? { version: (activa as any).version, name: (activa as any).name }
        : null,
      ...d,
      alertas: alertasDeDiff(d),
    };
  }

  /**
   * Publica un borrador: pasa a ser la lista activa del servicio y la anterior
   * se retira (queda guardada). Registra quién, cuándo y por qué.
   */
  async publicar(
    id: string,
    input: { publishedBy?: string; reason?: string } = {},
  ) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException(`Lista ${id} no existe`);
    if (doc.active) throw new BadRequestException('Esta lista ya está activa');

    const service = (doc as any).service ?? 'compartido';
    const anterior = await this.model.findOne({ service, active: true }).lean();

    // El motivo es obligatorio a propósito: dentro de un mes, "porque sí" no
    // sirve para entender por qué Cuenca bajó un 9%.
    const reason = (input.reason ?? '').trim();
    if (reason.length < 5) {
      throw new BadRequestException(
        'Indica el motivo del cambio (mínimo 5 caracteres): queda en el historial.',
      );
    }

    doc.publishedBy = input.publishedBy ?? 'admin';
    doc.publishedAt = new Date();
    doc.reason = reason;
    doc.replacedVersion = (anterior as any)?.version;
    await doc.save();

    const res = await this.activate(id);
    this.logger.log(
      `PUBLICADA [${service}] v${doc.version} por ${doc.publishedBy} — "${reason}" ` +
        `(reemplaza v${(anterior as any)?.version ?? '—'})`,
    );
    return { ...res, publishedBy: doc.publishedBy, reason, replacedVersion: doc.replacedVersion };
  }

  /** Historial de versiones de un servicio, la más reciente primero. */
  async historial(service = 'compartido') {
    const docs = await this.model
      .find(
        { service },
        {
          name: 1, version: 1, active: 1, source: 1,
          publishedBy: 1, publishedAt: 1, reason: 1,
          replacedVersion: 1, rolledBackFrom: 1, createdAt: 1,
        },
      )
      .sort({ version: -1 })
      .lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      version: d.version,
      active: d.active,
      name: d.name,
      source: d.source,
      publishedBy: d.publishedBy ?? null,
      publishedAt: d.publishedAt ?? null,
      reason: d.reason ?? null,
      replacedVersion: d.replacedVersion ?? null,
      rolledBackFrom: d.rolledBackFrom ?? null,
      createdAt: d.createdAt,
    }));
  }

  /**
   * Vuelve a una versión anterior COPIÁNDOLA como versión nueva.
   *
   * No se reactiva el documento viejo: si se hiciera, el historial dejaría de
   * ser una línea de tiempo y no se sabría qué estuvo vivo en qué momento.
   */
  async volverA(
    version: number,
    service = 'compartido',
    input: { publishedBy?: string; reason?: string } = {},
  ) {
    const origen = await this.model.findOne({ service, version }).lean();
    if (!origen) {
      throw new NotFoundException(`No existe la versión ${version} de ${service}`);
    }
    const ultima = await this.model.findOne({ service }).sort({ version: -1 }).lean();
    const nuevaVersion = ((ultima as any)?.version ?? 0) + 1;

    const copia = await this.model.create({
      name: `${(origen as any).name} (restaurada de v${version})`,
      service,
      version: nuevaVersion,
      active: false,
      source: (origen as any).source ?? 'manual',
      shared: (origen as any).shared ?? {},
      privateFares: (origen as any).privateFares ?? {},
      rates: (origen as any).rates,
      importedAt: new Date(),
      createdBy: input.publishedBy ?? 'admin',
      rolledBackFrom: version,
    });

    return this.publicar(String(copia._id), {
      publishedBy: input.publishedBy,
      reason: input.reason ?? `Vuelta atrás a la versión ${version}`,
    });
  }

  /**
   * Retira una lista de servicio: la deja inactiva sin activar ninguna otra.
   *
   * Existe para desmontar un servicio COMPLETO, no para rotar versiones (eso es
   * `publicar`). El caso real: la lista `empresas` quedó huérfana cuando el
   * precio corporativo pasó a calcularse como privado + recargo; el motor ya no
   * la lee, pero mientras siga marcada activa cualquiera puede creer que manda.
   *
   * Se niega si el motor todavía consulta ese servicio: retirar una lista viva
   * dejaría al servicio SIN tarifas, y eso se descubre cobrando mal.
   */
  async retirar(id: string) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException(`Lista ${id} no existe`);

    const service = (doc as any).service ?? 'compartido';
    const EN_USO = ['compartido', 'privado', 'urbano'];
    if (EN_USO.includes(service)) {
      throw new BadRequestException(
        `El motor todavía consulta "${service}": retirarla lo dejaría sin tarifas. ` +
          `Para cambiar sus precios publica una versión nueva.`,
      );
    }

    doc.active = false;
    await doc.save();
    await this.engine.refresh();
    this.engine.publishInvalidate();
    this.logger.log(`Lista RETIRADA [${service}] v${doc.version}: "${doc.name}"`);
    return { id, service, active: false, version: doc.version };
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
