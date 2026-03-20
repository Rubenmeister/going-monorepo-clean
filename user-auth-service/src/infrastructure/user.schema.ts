import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserModelSchema {
  @Prop({ required: true, unique: true })
  _id: string;

  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop()
  passwordHash?: string;

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

  @Prop({ index: true })
  companyId?: string;

  @Prop()
  companyName?: string;

  @Prop({ enum: ['google', 'facebook'] })
  oauthProvider?: string;

  @Prop({ index: true })
  oauthId?: string;

  @Prop()
  profilePicture?: string;
}

export type UserDocument = UserModelSchema & Document;
export const UserSchema = SchemaFactory.createForClass(UserModelSchema);
