import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Solicitud de alta de empresa (prospecto B2B). ANTES vivía en un array
 * in-memory de una ruta Next del frontend → los prospectos se PERDÍAN en cada
 * reinicio. Ahora se persiste acá y el equipo de ventas la ve y la aprueba,
 * conectando con el flujo `companies/:id/approve` que ya existe.
 *
 * estado: prospect → contacted → approved | rejected
 */
@Schema({ collection: 'corporate_applications', timestamps: true })
export class CompanyApplicationSchema extends Document {
  @Prop({ required: true, index: true })
  razonSocial: string;

  @Prop({ required: true, index: true })
  ruc: string;

  /** 'negocio' | 'corporativo' (tamaño/tipo de cuenta que pidió el prospecto). */
  @Prop({ default: 'negocio' })
  tipoCuenta: string;

  @Prop({ required: true })
  contactoNombre: string;

  @Prop({ required: true, index: true })
  contactoEmail: string;

  @Prop()
  contactoTelefono: string;

  @Prop()
  ciudad: string;

  @Prop()
  empleadosEstimados: number;

  @Prop()
  notas: string;

  /** prospect | contacted | approved | rejected */
  @Prop({ default: 'prospect', index: true })
  estado: string;

  /** true si el RUC pasó la validación de formato+checksum ecuatoriano. */
  @Prop({ default: false })
  rucValido: boolean;

  /** userId del admin de plataforma que decidió, si aplica. */
  @Prop()
  decididoPor: string;

  @Prop()
  decididoEn: string;

  /** companyId resultante si la solicitud se aprobó y se convirtió en cuenta. */
  @Prop()
  companyId: string;

  /** Metadata libre del formulario (campos extra sin romper el schema). */
  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const CompanyApplicationSchemaDefinition =
  SchemaFactory.createForClass(CompanyApplicationSchema);
