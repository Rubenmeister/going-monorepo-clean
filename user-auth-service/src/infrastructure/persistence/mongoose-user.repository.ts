import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ok, err } from 'neverthrow';
import {
  User,
  IUserRepository,
} from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope
import { UserDocument, UserModel } from './schemas/user.schema';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel.name)
    private readonly model: Model<UserDocument>,
  ) {}

  async save(user: User): Promise<Result<void, Error>> {
    try {
      const primitives = user.toPrimitives();
      const newDoc = new this.model(primitives);
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
      await this.model
        .updateOne({ id: user.id }, { $set: primitives })
        .exec();
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

  async findByVerificationToken(token: string): Promise<Result<User | null, Error>> {
    try {
      const doc = await this.model.findOne({ verificationToken: token }).exec();
      return ok(doc ? this.toDomain(doc) : null);
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  private toDomain(doc: UserDocument): User {
    return User.fromPrimitives(doc.toObject() as any);
  }
}