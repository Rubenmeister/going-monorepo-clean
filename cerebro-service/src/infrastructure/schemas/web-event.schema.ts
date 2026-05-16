import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Errores capturados desde las web apps (frontend-webapp, admin-dashboard,
 * corporate-portal). El snippet `lib/cerebro-tracker.ts` que cada app
 * importa una vez en su layout root captura window.onerror +
 * unhandledrejection y los manda acá via POST /cerebro/web-event.
 *
 * Diseño:
 *   - TTL 14 días — frontend-agent lee ventana 6h cada cron, no necesitamos
 *     historia larga acá.
 *   - dedupKey = hash(appId + errorType + topFrameOfStack + url) para que
 *     errores recurrentes ocupen una sola fila con count incrementado.
 *     Reduce inserts y permite "top 5 errores" sin agrupación expensive.
 *   - Sin PII: el client samplea + sanitiza ANTES de enviar (el server
 *     no debe confiar en el client, pero acá no hacemos sanitización
 *     adicional para no quemar CPU).
 */

export type WebErrorType = 'js_error' | 'unhandled_rejection' | 'network' | 'render' | 'other';

@Schema({ collection: 'cerebro_web_events', timestamps: false })
export class WebEventEntity {
  @Prop({ required: true, type: String, index: true })
  appId!: string;                    // 'frontend-webapp' | 'admin-dashboard' | 'corporate-portal'

  @Prop({ required: true, type: String })
  errorType!: WebErrorType;

  @Prop({ required: true, type: String })
  message!: string;                  // primer línea del error (truncada a 500)

  @Prop({ type: String })
  stack?: string;                    // stack truncado a 2000 chars

  @Prop({ required: true, type: String })
  url!: string;                      // pathname sin query (no PII)

  @Prop({ type: String })
  userAgent?: string;                // truncado a 200, sin IP

  /**
   * Hash del fingerprint del error — para dedup. Mismo error en múltiples
   * users reusará la fila e incrementará count. El client genera el hash
   * con SHA-256(appId + errorType + topStackFrame + url).
   */
  @Prop({ required: true, type: String, index: true })
  dedupKey!: string;

  @Prop({ required: true, type: Number, default: 1 })
  count!: number;                    // incrementado en cada hit

  @Prop({ required: true, type: Number, default: 0 })
  affectedSessions!: number;         // unique sessionIds vistos (best-effort)

  @Prop({ required: true, type: Date, index: true })
  firstSeen!: Date;

  @Prop({ required: true, type: Date, index: true, expires: '14d' })
  lastSeen!: Date;
}

export type WebEventDocument = WebEventEntity & Document;
export const WebEventSchema = SchemaFactory.createForClass(WebEventEntity);

// Compound index para queries del frontend-agent: "top errores por appId
// en última ventana".
WebEventSchema.index({ appId: 1, lastSeen: -1, count: -1 });
// Unique compound index para que upsert por dedupKey + appId no duplique.
WebEventSchema.index({ appId: 1, dedupKey: 1 }, { unique: true });
