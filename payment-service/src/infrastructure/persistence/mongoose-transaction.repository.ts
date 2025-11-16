import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { Transaction, ITransactionRepository } from '@going-monorepo-clean/domains-payment-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { TransactionDocument, TransactionModelSchema } from './schemas/transaction.schema';

@Injectable()
export class MongooseTransactionRepository implements ITransactionRepository {
  constructor(
    @InjectModel(TransactionModelSchema.name)
    private readonly model: Model<TransactionDocument>,
  ) {}

  async save(transaction: Transaction): Promise<Result<void, Error>> {
    try {
      const primitives = transaction.toPrimitives();
      const newDoc = new this.model(primitives);
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async update(transaction: Transaction): Promise<Result<void, Error>> {
    try {
      const primitives = transaction.toPrimitives();
      await this.model.updateOne({ id: transaction.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<Transaction | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Result<Transaction | null, Error>> {
    try {
      const doc = await this.model.findOne({ paymentIntentId }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: TransactionDocument): Transaction {
    return Transaction.fromPrimitives(doc.toObject() as any);
  }
}