import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Definimos el tipo Document para que TS sepa que tiene métodos de Mongoose
export type UserDocument = UserModel & Document;

@Schema({ collection: 'users', timestamps: true })
export class UserModel {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  // Agrega aquí otros campos que tenga tu entidad User
  // Por ejemplo:
  // @Prop()
  // firstName: string;
  
  // @Prop()
  // lastName: string;

  // @Prop({ default: 'ACTIVE' })
  // status: string;
}

export const UserModelSchema = SchemaFactory.createForClass(UserModel);