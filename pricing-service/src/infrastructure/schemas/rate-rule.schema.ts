import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * rate_rules — reglas editables en vivo (día / ventana horaria / feriado / promo
 * / por conductor) con condición, efecto, vigencia y prioridad.
 *
 * F1: la colección existe pero el motor todavía aplica las reglas vía el código
 * de `libs/pricing` (paridad garantizada). F4 migra las reglas hardcodeadas aquí
 * y el motor pasa a evaluarlas desde Atlas.
 */
@Schema({ timestamps: true, collection: 'rate_rules' })
export class RateRule {
  @Prop({ required: true }) name!: string;
  @Prop({ default: true, index: true }) active!: boolean;
  @Prop({ default: 100 }) priority!: number;

  /** CUÁNDO aplica (todos opcionales = comodín). */
  @Prop({ type: Object, default: {} }) scope!: Record<string, unknown>;
  /** time_window | day_of_week | date_range | holiday | promo_code | always */
  @Prop({ type: Object, required: true }) condition!: Record<string, unknown>;
  /** surcharge_rate | multiplier | flat_add | flat_override */
  @Prop({ type: Object, required: true }) effect!: Record<string, unknown>;

  @Prop() validFrom?: Date;
  @Prop() validTo?: Date;
  @Prop() createdBy?: string;
}

export type RateRuleDocument = RateRule & Document;
export const RateRuleSchema = SchemaFactory.createForClass(RateRule);
