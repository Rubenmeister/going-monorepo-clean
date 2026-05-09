import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CortexConfig, CortexConfigDocument } from '../schemas/cortex-config.schema';

/**
 * Repo de la singleton config de MyCortex.
 *
 * Patrón:
 *   - findOrCreate(): siempre devuelve un doc — si no existe, lo crea con
 *     defaults vacíos. Cliente no necesita preocuparse por null.
 *   - update(): merge superficial — solo overrides los campos que vienen
 *     en el patch, deja el resto intacto. Setea updatedAt + updatedBy.
 */
@Injectable()
export class CortexConfigRepository {
  private readonly singletonId = 'singleton';

  constructor(
    @InjectModel(CortexConfig.name)
    private readonly model: Model<CortexConfigDocument>,
  ) {}

  /**
   * Devuelve el doc singleton. Si no existe, lo crea con defaults.
   *
   * Usamos upsert + findOneAndUpdate con $setOnInsert para que la operación
   * sea atómica — múltiples instancias del service podrían intentar crear
   * el doc al mismo tiempo en el primer arranque.
   */
  async findOrCreate(): Promise<CortexConfigDocument> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: this.singletonId },
        { $setOnInsert: { _id: this.singletonId, systemPrompt: '', model: '', enabled: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    if (!doc) {
      // Nunca debería pasar con upsert+new, pero TypeScript lo cubre.
      throw new Error('CortexConfigRepository.findOrCreate: upsert returned null');
    }
    return doc;
  }

  /**
   * Update superficial. El cliente pasa solo los campos que quiere cambiar.
   * Campos undefined se ignoran (no se sobrescriben con null).
   */
  async update(patch: {
    systemPrompt?:    string;
    model?:           string;
    maxTokens?:       number;
    pollIntervalMin?: number;
    enabled?:         boolean;
    updatedBy:        string;
  }): Promise<CortexConfigDocument> {
    const setFields: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: patch.updatedBy,
    };
    // Solo metemos los fields que vinieron — undefined se ignora.
    if (patch.systemPrompt !== undefined) setFields.systemPrompt = patch.systemPrompt;
    if (patch.model !== undefined)        setFields.model        = patch.model;
    if (patch.maxTokens !== undefined)    setFields.maxTokens    = patch.maxTokens;
    if (patch.pollIntervalMin !== undefined) setFields.pollIntervalMin = patch.pollIntervalMin;
    if (patch.enabled !== undefined)      setFields.enabled      = patch.enabled;

    const doc = await this.model
      .findOneAndUpdate(
        { _id: this.singletonId },
        { $set: setFields, $setOnInsert: { _id: this.singletonId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    if (!doc) {
      throw new Error('CortexConfigRepository.update: upsert returned null');
    }
    return doc;
  }
}
