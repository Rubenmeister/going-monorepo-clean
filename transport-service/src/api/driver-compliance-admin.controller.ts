import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import {
  DriverDocumentModel,
  DriverDocumentDocument,
  DRIVER_DOCUMENT_TYPES,
  NON_EXPIRING_TYPES,
  computeDriverCompliance,
  type DriverDocumentType,
  type DriverDocumentStatus,
  type DriverComplianceStatus,
} from '../infrastructure/persistence/schemas/driver-document.schema';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
  roles?: string[];
}

interface ApproveDocBody {
  /** Número del documento (placa, número de licencia, etc.). */
  documentNumber?: string;
  /** Autoridad emisora ('ANT', 'MINTUR', 'Aseguradora X'). */
  issuingAuthority?: string;
  /** Fecha de emisión ISO 8601. */
  issuedAt?: string;
  /** Fecha de expiración ISO 8601. Obligatoria si el type NO está en NON_EXPIRING_TYPES. */
  expiresAt?: string;
}

interface RejectDocBody {
  /** Motivo del rechazo — se muestra al driver para que sepa qué corregir. */
  rejectionReason: string;
}

interface DriverComplianceListItem {
  driverId: string;
  status: DriverComplianceStatus;
  approved: DriverDocumentType[];
  missing: DriverDocumentType[];
  expired: DriverDocumentType[];
  rejected: DriverDocumentType[];
  expiringSoon: DriverDocumentType[];
}

/**
 * DriverComplianceAdminController — endpoints para que el equipo de ops
 * gestione el flujo de aprobación/rechazo de documentos regulatorios.
 *
 * Todas las rutas requieren JWT con role='admin'.
 *
 * Rutas:
 *   GET    /compliance/drivers?status=...&limit=50
 *   GET    /compliance/drivers/:driverId
 *   PATCH  /compliance/documents/:docId/approve
 *   PATCH  /compliance/documents/:docId/reject
 *
 * Por simplicidad este controller queda en transport-service junto con el
 * resto del Compliance System (cron + schema). Si en el futuro el flow de
 * aprobación se mueve a un servicio dedicado de ops, mover acá.
 */
@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class DriverComplianceAdminController {
  private readonly logger = new Logger(DriverComplianceAdminController.name);

  constructor(
    @InjectModel(DriverDocumentModel.name)
    private readonly docModel: Model<DriverDocumentDocument>,
  ) {}

  private assertAdmin(user: AuthUser): void {
    const roles = user.roles ?? [user.role];
    if (!roles.includes('admin')) {
      throw new ForbiddenException('Solo administradores pueden gestionar compliance');
    }
  }

  /**
   * GET /admin/drivers/compliance
   *
   * Lista drivers agregando su estado de compliance. Calcula on-the-fly a
   * partir de driver_documents (no hay tabla de compliance separada).
   *
   * Query params:
   *   status=verified|pending|expired|rejected|tourism_pending   (opcional)
   *   limit=N                                                    default 50, max 200
   */
  @Get('drivers')
  async listCompliance(
    @CurrentUser() user: AuthUser,
    @Query('status') statusFilter?: string,
    @Query('limit') limitStr?: string,
  ): Promise<{ total: number; items: DriverComplianceListItem[] }> {
    this.assertAdmin(user);

    const limit = Math.min(parseInt(limitStr ?? '50', 10) || 50, 200);

    // Agrupar docs por driverId. Trae todos los docs (sin filtro de status)
    // para que computeDriverCompliance pueda evaluar el estado real.
    const allDocs = await this.docModel.find({}).limit(10000).lean();
    const byDriver = new Map<string, DriverDocumentModel[]>();
    for (const doc of allDocs) {
      const list = byDriver.get(doc.driverId) ?? [];
      list.push(doc as DriverDocumentModel);
      byDriver.set(doc.driverId, list);
    }

    const items: DriverComplianceListItem[] = [];
    for (const [driverId, docs] of byDriver) {
      const r = computeDriverCompliance(docs, new Date());
      if (statusFilter && r.status !== statusFilter) continue;
      items.push({
        driverId,
        status: r.status,
        approved: r.approved,
        missing: r.missing,
        expired: r.expired,
        rejected: r.rejected,
        expiringSoon: r.expiringSoon,
      });
      if (items.length >= limit) break;
    }

    return { total: items.length, items };
  }

  /**
   * GET /admin/drivers/:driverId/documents
   *
   * Devuelve todos los documentos de un driver con la metadata completa
   * (incluye fields nuevos: documentNumber, issuingAuthority, expiresAt, etc.).
   * Útil para que el admin-dashboard renderice la pantalla de revisión.
   */
  @Get('drivers/:driverId')
  async getDriverDocuments(
    @CurrentUser() user: AuthUser,
    @Param('driverId') driverId: string,
  ) {
    this.assertAdmin(user);

    const docs = await this.docModel
      .find({ driverId })
      .sort({ uploadedAt: -1 })
      .lean();

    // Compliance computado para mostrar al admin junto a los docs
    const compliance = computeDriverCompliance(docs as DriverDocumentModel[], new Date());

    return {
      driverId,
      compliance,
      documents: docs.map((d) => ({
        id: (d as any)._id?.toString(),
        type: d.type,
        url: d.url,
        filename: d.filename,
        status: d.status,
        documentNumber: d.documentNumber,
        issuingAuthority: d.issuingAuthority,
        issuedAt: d.issuedAt,
        expiresAt: d.expiresAt,
        reviewedBy: d.reviewedBy,
        reviewedAt: d.reviewedAt,
        rejectionReason: d.rejectionReason ?? d.rejectedReason,
        uploadedAt: d.uploadedAt,
      })),
    };
  }

  /**
   * PATCH /admin/drivers/documents/:docId/approve
   *
   * Aprueba un documento. Si type requiere expiresAt (no está en
   * NON_EXPIRING_TYPES), el body DEBE incluir expiresAt. Otros campos
   * (documentNumber, issuingAuthority, issuedAt) son recomendados pero
   * opcionales.
   *
   * Re-aprobar un doc ya aprobado: idempotente (actualiza reviewedBy/At).
   */
  @Patch('documents/:docId/approve')
  @HttpCode(HttpStatus.OK)
  async approveDocument(
    @CurrentUser() user: AuthUser,
    @Param('docId') docId: string,
    @Body() body: ApproveDocBody,
  ) {
    this.assertAdmin(user);

    const doc = await this.docModel.findById(docId);
    if (!doc) throw new NotFoundException(`Documento ${docId} no encontrado`);

    // Validar expiresAt obligatorio para tipos que expiran
    const docType = doc.type as DriverDocumentType;
    const needsExpiry = !NON_EXPIRING_TYPES.has(docType);
    if (needsExpiry && !body.expiresAt && !doc.expiresAt) {
      throw new BadRequestException(
        `El tipo "${docType}" requiere expiresAt (no está en NON_EXPIRING_TYPES)`,
      );
    }

    // Validar expiresAt no en el pasado
    if (body.expiresAt) {
      const exp = new Date(body.expiresAt);
      if (Number.isNaN(exp.getTime())) {
        throw new BadRequestException('expiresAt inválido (debe ser ISO 8601)');
      }
      if (exp < new Date()) {
        throw new BadRequestException(
          'expiresAt no puede estar en el pasado — si el doc ya está vencido, rechazalo en vez de aprobarlo',
        );
      }
    }

    const update: Partial<DriverDocumentModel> = {
      status: 'approved' as DriverDocumentStatus,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      rejectionReason: undefined, // clear cualquier rejection previa
    };
    if (body.documentNumber !== undefined) update.documentNumber = body.documentNumber;
    if (body.issuingAuthority !== undefined) update.issuingAuthority = body.issuingAuthority;
    if (body.issuedAt !== undefined) update.issuedAt = new Date(body.issuedAt);
    if (body.expiresAt !== undefined) update.expiresAt = new Date(body.expiresAt);

    await this.docModel.updateOne(
      { _id: docId },
      { $set: update, $unset: { rejectionReason: '', rejectedReason: '' } },
    );

    this.logger.log(
      `[compliance-admin] approved doc=${docId} type=${docType} driver=${doc.driverId} by=${user.id}`,
    );

    return { id: docId, status: 'approved', reviewedBy: user.id, reviewedAt: update.reviewedAt };
  }

  /**
   * PATCH /admin/drivers/documents/:docId/reject
   *
   * Rechaza un documento con motivo. El driver verá el motivo en su app
   * para saber qué corregir y volver a subir.
   *
   * Re-rechazar un doc ya rechazado: idempotente (actualiza el motivo).
   */
  @Patch('documents/:docId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectDocument(
    @CurrentUser() user: AuthUser,
    @Param('docId') docId: string,
    @Body() body: RejectDocBody,
  ) {
    this.assertAdmin(user);

    if (!body.rejectionReason || body.rejectionReason.trim().length < 5) {
      throw new BadRequestException(
        'rejectionReason requerido (mínimo 5 caracteres) — el driver lo necesita para corregir',
      );
    }

    const doc = await this.docModel.findById(docId);
    if (!doc) throw new NotFoundException(`Documento ${docId} no encontrado`);

    await this.docModel.updateOne(
      { _id: docId },
      {
        $set: {
          status: 'rejected' as DriverDocumentStatus,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          rejectionReason: body.rejectionReason.trim(),
        },
      },
    );

    this.logger.log(
      `[compliance-admin] rejected doc=${docId} type=${doc.type} driver=${doc.driverId} ` +
        `by=${user.id} reason="${body.rejectionReason.slice(0, 80)}"`,
    );

    return {
      id: docId,
      status: 'rejected',
      rejectionReason: body.rejectionReason.trim(),
      reviewedBy: user.id,
    };
  }
}
