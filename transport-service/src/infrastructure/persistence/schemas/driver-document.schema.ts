import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * DriverDocument — documento regulatorio del conductor (Ecuador ANT/MINTUR).
 *
 * Cada driver debe tener TODOS los `REQUIRED_DOCUMENT_TYPES` en status='approved'
 * Y con `expiresAt` vigente (o sin expiración para los que no caducan) para
 * operar la app. Lo enforce `RideNoShowCronService` + `MatchAvailableDriversUseCase`
 * + `ParcelMatchingOrchestrator` consultando `getDriverComplianceStatus()` antes
 * de hacer match.
 *
 * Workflow:
 *   1. Driver sube PDF/foto → status='pending_review'
 *   2. Ops revisa via admin-dashboard
 *      - aprueba → status='approved' + reviewedBy/At
 *      - rechaza → status='rejected' + rejectionReason + reviewedBy/At
 *   3. Cron diario: si `expiresAt < now` y status='approved' → status='expired'
 *      Si pierde un doc requerido → driver auto-suspended (vía cron complementario)
 *   4. Driver re-uploadea el doc renovado → vuelve a status='pending_review'
 *
 * Backwards compatibility:
 *   - Documentos viejos (pre-este-refactor) tienen sólo type/url/filename/status/
 *     uploadedAt. Los nuevos campos (documentNumber, issuingAuthority, issuedAt,
 *     expiresAt, reviewedBy, reviewedAt) son opcionales — se llenan cuando ops
 *     re-revisa el doc en el nuevo workflow.
 *   - `type='soat'` queda en el enum como deprecated (no eliminar para no romper
 *     docs históricos), pero ya no existe en Ecuador desde la reforma.
 */

// ─── Tipos canónicos de documentos ───────────────────────────────────────────

export const DRIVER_DOCUMENT_TYPES = [
  // Identidad / personal
  'cedula',
  'licencia',           // Licencia profesional de conducir (vigente, tipo C/E según ANT)
  'criminal_record',    // Antecedentes penales (renovación periódica)

  // Vehículo
  'matricula',          // Matrícula del vehículo (ANT)
  'mechanical_inspection', // Revisión técnico-mecánica anual (RTV)
  'foto_vehiculo',      // Foto identificatoria del vehículo (frente con placa)

  // Seguros
  'vehicle_insurance',     // Seguro del vehículo (post-SOAT, póliza privada obligatoria)
  'third_party_insurance', // Responsabilidad civil a terceros

  // Regulatorio operativo
  'ant_permit',         // Permiso de operación ANT (cuenta propia o por operadora)
  'company_membership', // Pertenencia a operadora de transporte registrada
  'tourism_permit',     // SOLO si transporte turístico (MINTUR — condicional)

  // Going internos
  'going_contract',     // Contrato firmado con Going
  'going_training',     // Capacitación inicial completada (seguridad vial + atención al cliente)

  // Deprecated — no eliminar (docs históricos lo usan, NO emitir nuevos)
  'soat',               // @deprecated SOAT ya no existe en Ecuador desde la reforma
] as const;

export type DriverDocumentType = typeof DRIVER_DOCUMENT_TYPES[number];

/**
 * Documentos OBLIGATORIOS para que un driver opere la app.
 * `tourism_permit` se chequea aparte solo si el driver hace transporte turístico.
 * `going_contract` y `going_training` son requisitos internos antes de salir a operar.
 */
export const REQUIRED_DOCUMENT_TYPES: DriverDocumentType[] = [
  'cedula',
  'licencia',
  'criminal_record',
  'matricula',
  'mechanical_inspection',
  'vehicle_insurance',
  'third_party_insurance',
  'ant_permit',
  'company_membership',
  'going_contract',
  'going_training',
];

/**
 * Documentos que NO expiran (ej. cédula nunca, foto no). Los demás SÍ requieren
 * `expiresAt` para evitar suspender drivers falsamente.
 */
export const NON_EXPIRING_TYPES = new Set<DriverDocumentType>([
  'cedula',
  'foto_vehiculo',
  'going_training',
]);

// ─── Status workflow ─────────────────────────────────────────────────────────

export const DRIVER_DOCUMENT_STATUSES = [
  'pending_review',     // Driver subió, ops debe revisar
  'approved',           // Ops aprobó, vigente
  'rejected',           // Ops rechazó con motivo (driver re-sube)
  'expired',            // expiresAt < now (cron lo marca automáticamente)
] as const;

export type DriverDocumentStatus = typeof DRIVER_DOCUMENT_STATUSES[number];

// ─── Schema Mongoose ─────────────────────────────────────────────────────────

@Schema({ timestamps: true, collection: 'driver_documents' })
export class DriverDocumentModel {
  // ── Identidad del doc ─────────────────────────────────────────
  @Prop({ required: true, index: true })
  driverId: string;

  @Prop({ required: true, index: true, type: String })
  type: DriverDocumentType;

  // ── Storage (GCS) ─────────────────────────────────────────────
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  filename: string;

  // ── Metadata regulatoria (opcional para backwards compat) ─────
  /** Número del documento (ej. número de licencia, RUC del operador, etc.). */
  @Prop({ type: String })
  documentNumber?: string;

  /** Autoridad emisora (ej. 'ANT', 'MINTUR', 'Compañía Aseguradora X'). */
  @Prop({ type: String })
  issuingAuthority?: string;

  @Prop({ type: Date })
  issuedAt?: Date;

  /** Fecha de expiración. Si ausente y type no está en NON_EXPIRING_TYPES,
   *  el doc no se puede considerar 'approved' definitivo — ops debe llenar
   *  esto al revisar. */
  @Prop({ type: Date, index: true })
  expiresAt?: Date;

  // ── Workflow ──────────────────────────────────────────────────
  @Prop({ default: 'pending_review', index: true, type: String })
  status: DriverDocumentStatus;

  /** ID del admin que revisó (aprobó/rechazó). */
  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;

  /** Motivo del rechazo (ej. "PDF ilegible", "Documento vencido al subir"). */
  @Prop({ type: String })
  rejectionReason?: string;

  /** Legacy field — mantener para no romper docs viejos. Reemplazado por rejectionReason. */
  @Prop({ type: String })
  rejectedReason?: string;

  // ── Timestamps ────────────────────────────────────────────────
  @Prop({ default: () => new Date() })
  uploadedAt: Date;
}

export type DriverDocumentDocument = DriverDocumentModel & Document;
export const DriverDocumentSchema = SchemaFactory.createForClass(DriverDocumentModel);

// Index compuesto para query rápida de "todos los docs vigentes de un driver"
DriverDocumentSchema.index({ driverId: 1, status: 1, type: 1 });

// Index para cron de vencimientos
DriverDocumentSchema.index({ status: 1, expiresAt: 1 });

// ─── Helpers de compliance ───────────────────────────────────────────────────

/**
 * Estado de cumplimiento agregado de un driver.
 *
 *   'verified'           — Todos los docs requeridos aprobados Y vigentes
 *   'pending'            — Falta uno o más docs requeridos (no subido o pending_review)
 *   'expired'            — Tenía todo aprobado pero al menos uno expiró
 *   'rejected'           — Al menos un doc fue rechazado por ops (driver debe re-subir)
 *   'tourism_pending'    — Driver tiene todo lo base pero registró como turístico
 *                          y le falta tourism_permit (NO bloquea privado, sí turístico)
 */
export type DriverComplianceStatus =
  | 'verified'
  | 'pending'
  | 'expired'
  | 'rejected'
  | 'tourism_pending';

export interface DriverComplianceReport {
  driverId: string;
  status: DriverComplianceStatus;
  approved: DriverDocumentType[];
  missing: DriverDocumentType[];     // Required docs sin doc approved + vigente
  expired: DriverDocumentType[];     // Required docs con status='expired'
  rejected: DriverDocumentType[];    // Required docs con status='rejected'
  expiringSoon: DriverDocumentType[]; // Approved + expiresAt < now+30days
}

/**
 * Calcula el estado de compliance del driver a partir de sus documentos.
 *
 * @param docs            Todos los documentos del driver (cualquier status)
 * @param now             Hora actual (inyectable para tests). Default new Date()
 * @param isTourismDriver Si el driver opera transporte turístico. Default false.
 *                        Si true, requiere tourism_permit además del base.
 */
export function computeDriverCompliance(
  docs: DriverDocumentModel[],
  now: Date = new Date(),
  isTourismDriver: boolean = false,
): DriverComplianceReport {
  const driverId = docs[0]?.driverId ?? '';

  // Por type, agrupar y elegir el doc más actual (mayor uploadedAt) con status válido
  const latestByType = new Map<DriverDocumentType, DriverDocumentModel>();
  for (const doc of docs) {
    const existing = latestByType.get(doc.type as DriverDocumentType);
    if (!existing || doc.uploadedAt > existing.uploadedAt) {
      latestByType.set(doc.type as DriverDocumentType, doc);
    }
  }

  const approved: DriverDocumentType[] = [];
  const missing: DriverDocumentType[] = [];
  const expired: DriverDocumentType[] = [];
  const rejected: DriverDocumentType[] = [];
  const expiringSoon: DriverDocumentType[] = [];

  const required = [...REQUIRED_DOCUMENT_TYPES];
  if (isTourismDriver) required.push('tourism_permit');

  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const reqType of required) {
    const doc = latestByType.get(reqType);
    if (!doc) {
      missing.push(reqType);
      continue;
    }
    if (doc.status === 'rejected') {
      rejected.push(reqType);
      continue;
    }
    if (doc.status === 'pending_review') {
      missing.push(reqType);
      continue;
    }
    if (doc.status === 'expired') {
      expired.push(reqType);
      continue;
    }
    // status === 'approved'
    if (doc.expiresAt && doc.expiresAt < now) {
      // Approved pero ya expiró (cron aún no corrió o gap)
      expired.push(reqType);
      continue;
    }
    if (!doc.expiresAt && !NON_EXPIRING_TYPES.has(reqType)) {
      // Approved sin expiresAt en doc que SÍ expira — caso inválido por
      // omisión de ops. Lo tratamos como pending para forzar re-revisión.
      missing.push(reqType);
      continue;
    }
    approved.push(reqType);
    if (doc.expiresAt && doc.expiresAt < thirtyDaysFromNow) {
      expiringSoon.push(reqType);
    }
  }

  // Determinar status agregado (prioridad: rejected > expired > pending > tourism > verified)
  let status: DriverComplianceStatus;
  if (rejected.length > 0) status = 'rejected';
  else if (expired.length > 0) status = 'expired';
  else if (missing.length > 0) {
    // Si solo falta tourism_permit y todos los base están OK
    if (isTourismDriver && missing.length === 1 && missing[0] === 'tourism_permit') {
      status = 'tourism_pending';
    } else {
      status = 'pending';
    }
  } else status = 'verified';

  return { driverId, status, approved, missing, expired, rejected, expiringSoon };
}
