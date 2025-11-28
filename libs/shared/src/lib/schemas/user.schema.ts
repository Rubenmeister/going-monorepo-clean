import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';

// Definimos los roles posibles en Going
export enum UserRole {
  PASAJERO = 'PASAJERO',
  CONDUCTOR = 'CONDUCTOR',
  ADMIN = 'ADMIN',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Agrega createdAt y updatedAt automáticamente
export class User {
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Prop({ required: true })
  @IsString()
  lastName: string;

  @Prop({ required: true, unique: true, index: true })
  @IsEmail()
  email: string;

  @Prop({ select: false }) // Por seguridad, nunca devolver la contraseña en consultas normales
  @IsString()
  passwordHash: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.PASAJERO })
  @IsEnum(UserRole)
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;
  
  // Aquí podrías agregar campos futuros como:
  // @Prop() profilePicture?: string;
  // @Prop() phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);