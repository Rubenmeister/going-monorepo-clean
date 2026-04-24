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

  @Prop({ index: true })
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpiry?: Date;

  /**
   * Puntos de fidelidad (tipo B del motor de precios).
   *   - Gana 1 punto por USD pagado (viajes + envíos).
   *   - 100 puntos = 1 USD de descuento, tope 50% del total.
   *   - Sólo aplica a clientes Tipo B (público + pequeños negocios).
   */
  @Prop({ type: Number, default: 0, index: true })
  loyaltyPoints: number;

  /** Timestamp del último movimiento de puntos (para auditoría). */
  @Prop()
  loyaltyPointsUpdatedAt?: Date;
}

export type UserDocument = UserModelSchema & Document;
export const UserSchema = SchemaFactory.createForClass(UserModelSchema);
