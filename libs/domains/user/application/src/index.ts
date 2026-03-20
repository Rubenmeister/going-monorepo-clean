// Re-export use cases and DTOs from domains-user-core
// (the use-case implementations live in core to avoid infra import leakage)
export {
  RegisterUserUseCase,
  LoginUserUseCase,
  OAuthLoginUseCase,
  OAuthLoginDto,
  RegisterUserDto,
  LoginUserDto,
} from '@going-monorepo-clean/domains-user-core';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, _id: false })
export class UserModelSchema {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop([String])
  roles: string[];

  @Prop({
    type: String,
    required: true,
    enum: ['pending_verification', 'active', 'suspended'],
  })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop({ index: true })
  verificationToken?: string;
}

export type UserDocument = UserModelSchema & Document;
export const UserSchema = SchemaFactory.createForClass(UserModelSchema);
