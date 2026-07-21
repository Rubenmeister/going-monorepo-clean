import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProviderBankAccountDocument = Document & ProviderBankAccount;

/**
 * Cuenta bancaria de quien presta el servicio (conductora, conductor, anfitriona,
 * guía, mensajero), para poder transferirle su liquidación semanal.
 *
 * Antes esto NO EXISTÍA: el código de liquidación recibía un `bankAccountId`
 * suelto que nunca se guardaba ni se podía registrar desde ningún lado, porque
 * Stripe lo habría manejado del otro lado y Stripe nunca operó en Ecuador. Sin
 * estos datos no hay archivo de pagos masivos que generar.
 *
 * NOTA sobre `_id`: este esquema es una COLECCIÓN, así que jamás lleva
 * `_id: false` — ese flag es para subdocumentos y en una colección impide
 * generar el _id, con lo que todo `save()` falla en silencio.
 */
@Schema({ timestamps: true, collection: 'provider_bank_accounts' })
export class ProviderBankAccount {
  /** Id de la persona prestadora. Una cuenta por persona: se reemplaza, no se acumula. */
  @Prop({ required: true, unique: true, index: true })
  providerId: string;

  @Prop({
    required: true,
    enum: ['driver', 'host', 'guide', 'courier'],
    default: 'driver',
    index: true,
  })
  providerType: string;

  /**
   * Nombre del titular TAL COMO figura en el banco. Se guarda aparte del nombre
   * de la cuenta de Going: el banco rechaza la transferencia si no coincide con
   * la titularidad, y hay quien cobra a nombre de su cónyuge o de su empresa.
   */
  @Prop({ required: true, trim: true })
  holderName: string;

  @Prop({ required: true, enum: ['cedula', 'ruc'] })
  documentType: string;

  /** Validado con checksum al guardar (ver identificacion.validator.ts). */
  @Prop({ required: true, trim: true, index: true })
  documentNumber: string;

  /** Nombre del banco destino, como lo lista el portal (p. ej. "Produbanco"). */
  @Prop({ required: true, trim: true })
  bankName: string;

  /** Código del banco en el archivo de lote. Se llena cuando el banco lo exija. */
  @Prop({ trim: true })
  bankCode?: string;

  @Prop({ required: true, enum: ['ahorros', 'corriente'] })
  accountType: string;

  @Prop({ required: true, trim: true })
  accountNumber: string;

  /**
   * Si Going ya confirmó que la cuenta es correcta (por ejemplo, tras una
   * primera transferencia exitosa). Deliberadamente NO bloquea el pago: sirve
   * para revisar primero a quien nunca cobró, que es donde aparecen los errores.
   */
  @Prop({ type: Boolean, default: false, index: true })
  verified: boolean;

  /** Última vez que la persona cambió sus datos — un cambio reciente merece revisión. */
  @Prop({ type: Date })
  lastChangedAt?: Date;
}

export const ProviderBankAccountSchema =
  SchemaFactory.createForClass(ProviderBankAccount);

// Para armar el archivo del lote: se buscan las cuentas de un conjunto de
// personas de una sola vez.
ProviderBankAccountSchema.index({ providerType: 1, verified: 1 });
