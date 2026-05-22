import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Límite de gasto corporativo. Puede aplicar a un empleado, un departamento o
 * toda la empresa. Precedencia al evaluar: empleado → departamento → empresa.
 * Montos en la moneda de la empresa (USD por defecto). null = sin tope ese período.
 */
@Schema({ timestamps: true, collection: 'corporate_spending_limits' })
export class SpendingLimitSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, enum: ['employee', 'department', 'company'] })
  scope: string;

  /** employeeId | nombre de departamento | '' (empresa). */
  @Prop({ default: '' })
  targetId: string;

  @Prop({ default: null })
  daily: number | null;

  @Prop({ default: null })
  weekly: number | null;

  @Prop({ default: null })
  monthly: number | null;
}

export const SpendingLimitSchemaDefinition =
  SchemaFactory.createForClass(SpendingLimitSchema);

// Un solo límite por (empresa, alcance, objetivo).
SpendingLimitSchemaDefinition.index(
  { companyId: 1, scope: 1, targetId: 1 },
  { unique: true },
);
