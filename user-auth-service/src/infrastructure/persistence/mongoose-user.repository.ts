import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import { User, IUserRepository } from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope
import { UserDocument, UserModelSchema } from '../user.schema';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModelSchema.name)
    private readonly model: Model<UserDocument>
  ) {}

  async save(user: User): Promise<Result<void, Error>> {
    try {
      const primitives = user.toPrimitives();
      const newDoc = new this.model({ ...primitives, _id: primitives.id });
      await newDoc.save();
      return ok(undefined);
    } catch (error) {
      if (error.code === 11000) {
        return err(new Error('Email already exists'));
      }
      return err(new Error(error.message));
    }
  }

  async update(user: User): Promise<Result<void, Error>> {
    try {
      const primitives = user.toPrimitives();
      await this.model.updateOne({ id: user.id }, { $set: primitives }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findById(id: UUID): Promise<Result<User | null, Error>> {
    try {
      const doc = await this.model.findOne({ id }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const doc = await this.model.findOne({ email }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByVerificationToken(
    token: string
  ): Promise<Result<User | null, Error>> {
    try {
      const doc = await this.model.findOne({ verificationToken: token }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findByOAuthId(provider: string, oauthId: string): Promise<Result<User | null, Error>> {
    try {
      const doc = await this.model.findOne({ oauthProvider: provider, oauthId }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async findAll(opts?: {
    limit?: number;
    skip?: number;
    role?: string;
    status?: string;
  }): Promise<Result<User[], Error>> {
    try {
      const filter: Record<string, unknown> = {};
      if (opts?.role) filter['roles'] = opts.role;
      if (opts?.status) filter['status'] = opts.status;

      const docs = await this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(opts?.skip ?? 0)
        .limit(opts?.limit ?? 500)
        .exec();

      return ok(docs.map((d) => this.toDomain(d)));
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async countAll(opts?: {
    role?: string;
    status?: string;
  }): Promise<Result<number, Error>> {
    try {
      const filter: Record<string, unknown> = {};
      if (opts?.role) filter['roles'] = opts.role;
      if (opts?.status) filter['status'] = opts.status;
      const count = await this.model.countDocuments(filter).exec();
      return ok(count);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async updateStatus(id: UUID, status: string): Promise<Result<void, Error>> {
    try {
      await this.model.updateOne({ id }, { $set: { status } }).exec();
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: UserDocument): User {
    return User.fromPrimitives(doc.toObject() as any);
  }
}
