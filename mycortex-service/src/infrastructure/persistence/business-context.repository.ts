import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessContext, BusinessContextDocument } from '../schemas/business-context.schema';

/**
 * Repo de la constitución singleton. Mismo patrón que CortexConfigRepository:
 * findOrCreate() siempre devuelve un doc; update() hace merge superficial.
 */
@Injectable()
export class BusinessContextRepository {
  private readonly singletonId = 'singleton';

  constructor(
    @InjectModel(BusinessContext.name)
    private readonly model: Model<BusinessContextDocument>,
  ) {}

  async findOrCreate(): Promise<BusinessContextDocument> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: this.singletonId },
        { $setOnInsert: { _id: this.singletonId, body: '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    if (!doc) {
      throw new Error('BusinessContextRepository.findOrCreate: upsert returned null');
    }
    return doc;
  }

  async update(patch: { body?: string; updatedBy: string }): Promise<BusinessContextDocument> {
    const setFields: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: patch.updatedBy,
    };
    if (patch.body !== undefined) setFields.body = patch.body;

    const doc = await this.model
      .findOneAndUpdate(
        { _id: this.singletonId },
        { $set: setFields, $setOnInsert: { _id: this.singletonId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    if (!doc) {
      throw new Error('BusinessContextRepository.update: upsert returned null');
    }
    return doc;
  }
}
