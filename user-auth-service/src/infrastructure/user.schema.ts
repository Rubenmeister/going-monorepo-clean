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

  // ── MFA / TOTP (Camino 2A) ────────────────────────────────────────────
  /** Si true, el login normal pide TOTP/recovery code después de password. */
  @Prop({ default: false, index: true })
  mfaEnabled: boolean;

  /**
   * Secret TOTP base32 (formato compatible con Google Authenticator / Authy).
   * NUNCA se devuelve por API — solo se usa server-side para validar codes.
   * Si en el futuro queremos rotación, agregamos `mfaSecretPrev` con TTL.
   */
  @Prop({ select: false })
  mfaSecret?: string;

  /** Cuando el usuario activó MFA (al completar verify del primer code). */
  @Prop()
  mfaActivatedAt?: Date;

  /**
   * 8 códigos de recuperación one-time, almacenados HASHEADOS (bcrypt) para
   * que un dump de la DB no exponga códigos reutilizables. Cuando se usa
   * uno, se remueve del array. `select: false` para no devolver por API.
   */
  @Prop({ type: [String], default: [], select: false })
  mfaRecoveryCodes: string[];
}

export type UserDocument = UserModelSchema & Document;
export const UserSchema = SchemaFactory.createForClass(UserModelSchema);
