import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Constitución del negocio (Fase 1 del upgrade agéntico — ver
 * docs/GOING-AGENTIC-UPGRADE-PLAN.md). Contexto AUTORITATIVO declarado por
 * humanos sobre cómo opera Going: modelo de viajes, precios, zonas rojas,
 * alertas obligatorias, lenguaje, qué NO hacer.
 *
 * Distinción con `cortex_config.systemPrompt`: el systemPrompt define el ROL de
 * MyCortex (cómo razona); esta constitución define las REGLAS DEL NEGOCIO (qué
 * es cierto de Going). Se inyecta junto al system prompt para que el cerebro
 * razone con las reglas reales en vez de re-adivinarlas.
 *
 * Singleton (`_id='singleton'`): Going es UN negocio → UNA constitución (a
 * diferencia de PYMEX/MyCortex-SaaS que son multi-tenant). Editable en runtime
 * desde admin-dashboard, cacheada 60s (igual patrón que cortex_config).
 */
@Schema({
  collection: 'business_context',
  timestamps: { createdAt: false, updatedAt: 'updatedAt' },
})
export class BusinessContext {
  /** Siempre 'singleton'. */
  @Prop({ type: String, required: true, default: 'singleton' })
  _id!: string;

  /**
   * Cuerpo markdown de la constitución (secciones ## …). Si está vacío o muy
   * corto, PromptBuilderService cae al DEFAULT_BUSINESS_CONTEXT hardcoded —
   * defensa para que borrar la constitución en la UI no deje al cerebro sin reglas.
   */
  @Prop({ type: String, required: false, default: '' })
  body!: string;

  @Prop({ type: Date, required: false })
  updatedAt?: Date;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type BusinessContextDocument = HydratedDocument<BusinessContext>;
export const BusinessContextSchema = SchemaFactory.createForClass(BusinessContext);
