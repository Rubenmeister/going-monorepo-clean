import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * TravelPolicy — reglas que se aplican a TODOS los empleados de una empresa
 * al solicitar servicios Going. Editable desde /empresas/panel/politica.
 *
 * Scope decidido en Gap #2: GLOBAL a la empresa (no por departamento).
 * Si después se quiere por-departamento, se agrega un campo `departmentPolicies[]`
 * sin migración rompiente — esta política sigue siendo el fallback.
 */
@Schema({ _id: false })
export class TravelPolicySchema {
  @Prop({ default: false })
  enabled: boolean;

  /** Tarifa máxima de un viaje individual. Por encima → bloqueado. */
  @Prop({ default: 0 })
  maxFarePerTrip: number;

  /** Gasto agregado máximo por día (todos los viajes del empleado). */
  @Prop({ default: 0 })
  maxFarePerDay: number;

  /** Gasto agregado máximo por mes (todos los viajes del empleado). */
  @Prop({ default: 0 })
  maxFarePerMonth: number;

  /** A partir de este monto, el empleado debe escribir motivo del viaje. */
  @Prop({ default: 0 })
  requireJustificationAbove: number;

  /** Servicios habilitados: ['transport','tours','experiences','accommodation','parcels']. */
  @Prop({ type: [String], default: [] })
  allowedServices: string[];

  /** Días laborables permitidos: 0=Dom..6=Sáb. Fuera → requiere aprobación. */
  @Prop({ type: [Number], default: [] })
  allowedDays: number[];

  /** Hora desde permitida (HH:MM, 24h, zona ECT). */
  @Prop({ default: '00:00' })
  allowedHoursFrom: string;

  /** Hora hasta permitida (HH:MM). */
  @Prop({ default: '23:59' })
  allowedHoursTo: string;

  /** Reservas por debajo de este monto se aprueban automático (sin manager). */
  @Prop({ default: 0 })
  autoApproveBelow: number;

  /** Reservas iguales/superiores a este monto requieren aprobación del manager. */
  @Prop({ default: 0 })
  requireApprovalAbove: number;

  /** Empleados pueden usar Going para viajes personales fuera de horario. */
  @Prop({ default: false })
  allowPersonalUse: boolean;

  /** Permite tours/alojamiento fuera del país. */
  @Prop({ default: false })
  allowInternational: boolean;
}

@Schema({ timestamps: true, collection: 'company_settings' })
export class CompanySettingsSchema extends Document {
  @Prop({ required: true, unique: true, index: true })
  companyId: string;

  /**
   * Bloque 3 (#5): usuarios administradores de la empresa. Solo ellos pueden
   * configurar políticas, límites, settings, invitar miembros y la cadena de
   * aprobación. Vacío = empresa no migrada (fallback: solo staff Going).
   */
  @Prop({ type: [String], default: [] })
  adminUserIds: string[];

  @Prop({ default: '' })
  companyName: string;

  @Prop({ default: '' })
  ruc: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  contactEmail: string;

  @Prop({ default: '' })
  contactPhone: string;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: 0 })
  monthlyBudget: number;

  @Prop({ default: true })
  requireApproval: boolean;

  @Prop({ default: 0 })
  approvalThreshold: number;

  /**
   * Niveles de la cadena de aprobación (escalado por monto). Cada elemento:
   * { level:number, role?:string, approverId?:string, minAmount?:number }.
   * Vacío → un solo nivel (manager) para cualquier monto.
   */
  @Prop({ type: [Object], default: [] })
  approvalLevels: Record<string, unknown>[];

  /**
   * Recargo corporativo NEGOCIADO con esta empresa, por servicio.
   *
   * Se guarda como fracción: 0.25 = +25%. `default` aplica a los servicios que
   * no tengan tasa propia; si no hay nada, rige `RECARGO_CORPORATIVO_POR_DEFECTO`.
   *
   * Ejemplo: { default: 0.25, transport: 0.18, tour: 0.30 }
   *   → transporte +18%, tours +30%, envíos y el resto +25%.
   *
   * Antes el +25% estaba FIJO en el código (`return 0.25`) y el precio
   * corporativo se guardaba ya multiplicado en una lista aparte — 862 números
   * duplicados que había que mantener sincronizados a mano. Ahora el corporativo
   * se calcula al cotizar: se cambia el precio privado en un solo lugar y el
   * corporativo sigue solo, porque ya no es un dato sino una operación.
   *
   * OJO: esta tasa la resuelve SIEMPRE el servidor a partir de la empresa de la
   * sesión. Si llegara del navegador, cualquiera podría negociarse su propia
   * tarifa.
   */
  @Prop({ type: Object, default: {} })
  surchargeRates: Record<string, number>;

  // ── Contrato / facturación ─────────────────────────────────────────────────
  /** 'monthly_consolidated' (diferido, factura mensual) | 'prepaid' (saldo). */
  @Prop({ default: 'monthly_consolidated' })
  billingMode: string;

  /** Día del mes en que se corta/emite la factura consolidada. */
  @Prop({ default: 1 })
  billingCycleDay: number;

  /** 'active' | 'suspended'. Contrato corporativo. */
  @Prop({ default: 'active' })
  contractStatus: string;

  /** Tope de crédito mensual del contrato (0 = sin tope explícito). */
  @Prop({ default: 0 })
  creditLimit: number;

  @Prop({ type: [String], default: [] })
  allowedServiceTypes: string[];

  // ── Política de viajes (Gap #2) ────────────────────────────────────────────
  @Prop({ type: TravelPolicySchema, default: () => ({}) })
  travelPolicy: TravelPolicySchema;

  /** Quién hizo el último cambio de política (userId del JWT). */
  @Prop()
  policyChangedBy?: string;

  /** Timestamp del último cambio. */
  @Prop()
  policyChangedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;
}

export const CompanySettingsSchemaDefinition = SchemaFactory.createForClass(CompanySettingsSchema);
