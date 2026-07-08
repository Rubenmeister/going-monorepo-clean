/**
 * DriverController
 *
 * Endpoints relacionados con el perfil del conductor.
 * Montado en /drivers
 *
 * POST /drivers/me/documents         — Sube un documento a GCS
 * GET  /drivers/me/documents         — Lista documentos del conductor
 * GET  /drivers/me/trips             — Historial de viajes (rides completados)
 * GET  /drivers/me/ratings           — Lista de calificaciones recibidas
 * GET  /drivers/me/ratings/summary   — Promedio y desglose por estrellas
 */
import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Storage }         from '@google-cloud/storage';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';
import { InjectModel }     from '@nestjs/mongoose';
import { Model }           from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument } from 'mongoose';
import { RideModelSchema, RideDocument } from '../infrastructure/persistence/schemas/ride.schema';
import {
  DriverVehicleModel,
  DriverVehicleDocument,
} from '../infrastructure/persistence/schemas/driver-vehicle.schema';
import { SaveVehicleDto } from './dtos/write.dto';
import {
  DriverDocumentModel,
  DriverDocumentDocument,
  DriverDocumentSchema,
  DRIVER_DOCUMENT_TYPES,
  type DriverDocumentType,
} from '../infrastructure/persistence/schemas/driver-document.schema';

// Re-export del schema externo para no romper imports existentes (app.module + infra)
export { DriverDocumentModel, DriverDocumentSchema };
export type { DriverDocumentDocument };

const VALID_DOC_TYPES = DRIVER_DOCUMENT_TYPES;
type DocType = DriverDocumentType;

// ── DriverRating inline schema ────────────────────────────────────────────────
// Los pasajeros califican al conductor al finalizar el viaje.

@Schema({ timestamps: true, collection: 'driver_ratings' })
export class DriverRatingModel {
  @Prop({ required: true, index: true }) driverId:     string;
  @Prop({ required: true, index: true }) passengerId:  string;
  @Prop({ required: true })             rideId:       string;
  @Prop({ required: true, min: 1, max: 5 }) rating:   number;
  @Prop()                               comment?:     string;
  @Prop({ type: [String], default: [] }) tags:        string[];
  @Prop()                               passengerName?: string;
}

export type DriverRatingDocument = DriverRatingModel & MongoDocument;
export const DriverRatingSchema = SchemaFactory.createForClass(DriverRatingModel);
DriverRatingSchema.index({ driverId: 1, createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────

const GCS_BUCKET   = process.env.GCS_BUCKET_DOCS ?? process.env.GCS_BUCKET ?? 'going-driver-docs';
const MAX_FILE_MB  = 10;
const MAX_BYTES    = MAX_FILE_MB * 1024 * 1024;

@Controller('drivers')
export class DriverController {
  private readonly logger  = new Logger(DriverController.name);
  private readonly storage = new Storage();

  constructor(
    @InjectModel(DriverDocumentModel.name)
    private readonly docModel: Model<DriverDocumentDocument>,

    @InjectModel(RideModelSchema.name)
    private readonly rideModel: Model<RideDocument>,

    @InjectModel(DriverRatingModel.name)
    private readonly ratingModel: Model<DriverRatingDocument>,

    @InjectModel(DriverVehicleModel.name)
    private readonly vehicleModel: Model<DriverVehicleDocument>,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  //  PUT /drivers/me/vehicle — la conductora o el conductor guarda su vehículo
  //  (marca/modelo/año/placa). El app lo envía al registrarse o al editar perfil.
  // ──────────────────────────────────────────────────────────────────────────
  @Put('me/vehicle')
  @UseGuards(JwtAuthGuard)
  async saveVehicle(
    @CurrentUser('id') driverId: string,
    @Body() body: SaveVehicleDto,
  ) {
    if (!driverId) throw new BadRequestException('Sesión inválida');
    const plate = (body?.plate ?? '').trim().toUpperCase();
    const set: Record<string, unknown> = {
      driverId,
      brand: (body?.brand ?? '').trim(),
      model: (body?.model ?? '').trim(),
      year: (body?.year ?? '').toString().trim(),
      plate,
      color: (body?.color ?? '').trim(),
    };
    const doc = await this.vehicleModel.findOneAndUpdate(
      { driverId },
      { $set: set },
      { upsert: true, new: true },
    );
    this.logger.log(`Driver ${driverId} guardó vehículo ${doc.brand} ${doc.model} · ${doc.plate}`);
    return { brand: doc.brand, model: doc.model, year: doc.year, plate: doc.plate, color: doc.color };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  POST /drivers/me/documents
  // ──────────────────────────────────────────────────────────────────────────

  @Post('me/documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('document', {
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.mimetype)) {
        cb(new BadRequestException('Solo se aceptan imágenes (jpg, png, webp) o PDF'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @CurrentUser('id') driverId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') docType: string,
  ) {
    if (!file) {
      throw new BadRequestException('Se requiere el campo "document" con el archivo');
    }
    if (!VALID_DOC_TYPES.includes(docType as DocType)) {
      throw new BadRequestException(
        `Tipo de documento inválido. Valores permitidos: ${VALID_DOC_TYPES.join(', ')}`
      );
    }

    const ext       = file.originalname.split('.').pop() ?? 'bin';
    const timestamp = Date.now();
    const gcsPath   = `drivers/${driverId}/${docType}_${timestamp}.${ext}`;

    // Subir a Google Cloud Storage
    let publicUrl: string;
    try {
      const bucket = this.storage.bucket(GCS_BUCKET);
      const blob   = bucket.file(gcsPath);
      await blob.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
    } catch (err: any) {
      this.logger.error(`GCS upload failed for driver ${driverId}: ${err.message}`);
      throw new BadRequestException('Error al subir el archivo. Inténtalo de nuevo.');
    }

    // Guardar / reemplazar registro en MongoDB
    const doc = await this.docModel.findOneAndUpdate(
      { driverId, type: docType },
      {
        driverId,
        type:       docType,
        url:        publicUrl,
        filename:   file.originalname,
        status:     'pending_review',
        uploadedAt: new Date(),
        $unset:     { rejectedReason: '' },
      },
      { upsert: true, new: true },
    );

    this.logger.log(`Driver ${driverId} uploaded ${docType} → ${publicUrl}`);

    return {
      type:       doc.type,
      url:        doc.url,
      status:     doc.status,
      uploadedAt: doc.uploadedAt,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/documents
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/documents')
  @UseGuards(JwtAuthGuard)
  async getDocuments(@CurrentUser('id') driverId: string) {
    const docs = await this.docModel
      .find({ driverId })
      .select(
        // Legacy: rejectedReason. Nuevos: rejectionReason, expiresAt, documentNumber, issuingAuthority, issuedAt, reviewedAt
        'type url status rejectedReason rejectionReason ' +
        'documentNumber issuingAuthority issuedAt expiresAt reviewedAt uploadedAt',
      )
      .sort({ uploadedAt: -1 })
      .lean();

    // Añadir los tipos que faltan como "not_uploaded"
    const uploadedTypes = new Set(docs.map((d) => d.type));
    const missing = VALID_DOC_TYPES.filter((t) => !uploadedTypes.has(t)).map((t) => ({
      type:   t,
      status: 'not_uploaded',
      url:    null,
    }));

    return { documents: [...docs, ...missing] };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/trips?status=&limit=&page=
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/trips')
  @UseGuards(JwtAuthGuard)
  async getTrips(
    @CurrentUser('id') driverId: string,
    @Query('status')   statusFilter?: string,
    @Query('limit')    limitStr:  string = '50',
    @Query('page')     pageStr:   string = '1',
  ) {
    const limit = Math.min(parseInt(limitStr, 10) || 50, 200);
    const page  = Math.max(parseInt(pageStr,  10) || 1, 1);

    const query: any = { driverId };
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const [rides, total] = await Promise.all([
      this.rideModel
        .find(query)
        .sort({ completedAt: -1, requestedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.rideModel.countDocuments(query),
    ]);

    const data = rides.map((r: any) => ({
      id:            String(r._id),
      origin:        r.pickupLocation?.address  ?? r.pickupLocation?.name  ?? null,
      destination:   r.dropoffLocation?.address ?? r.dropoffLocation?.name ?? null,
      date:          r.completedAt ?? r.requestedAt,
      amount:        r.finalFare?.total ?? r.fare?.total ?? 0,
      status:        r.status,
      duration:      r.durationSeconds ? Math.round(r.durationSeconds / 60) : null,
      distanceKm:    r.distanceKm ?? null,
      modalidad:     r.modalidad ?? 'privado',
      paymentMethod: r.paymentMethod ?? null,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/ratings?limit=&page=
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/ratings')
  @UseGuards(JwtAuthGuard)
  async getRatings(
    @CurrentUser('id') driverId: string,
    @Query('limit')    limitStr: string = '20',
    @Query('page')     pageStr:  string = '1',
  ) {
    const limit = Math.min(parseInt(limitStr, 10) || 20, 100);
    const page  = Math.max(parseInt(pageStr,  10) || 1, 1);

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find({ driverId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.ratingModel.countDocuments({ driverId }),
    ]);

    return {
      ratings: ratings.map((r: any) => ({
        id:            String(r._id),
        rating:        r.rating,
        comment:       r.comment ?? null,
        tags:          r.tags ?? [],
        passengerName: r.passengerName ?? null,
        createdAt:     (r as any).createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/stats — KPIs de carreras y ganancias por período.
  //  Hoy / 7 días / 30 días + lifetime totals. Una query Mongo cubre todo.
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@CurrentUser('id') driverId: string) {
    const now           = new Date();
    const startOfDay    = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek   = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth  = new Date(now); startOfMonth.setDate(now.getDate() - 30);

    const [rides, totalCompleted] = await Promise.all([
      this.rideModel
        .find({ driverId, status: 'completed', completedAt: { $gte: startOfMonth } })
        .select('completedAt finalFare fare')
        .lean(),
      this.rideModel.countDocuments({ driverId, status: 'completed' }),
    ]);

    const amount = (r: any) => r.finalFare?.total ?? r.fare?.total ?? 0;
    const since  = (from: Date) => rides.filter(r => r.completedAt && new Date(r.completedAt as any) >= from);

    const today = since(startOfDay);
    const week  = since(startOfWeek);

    const sum = (arr: any[]) => arr.reduce((s, r) => s + amount(r), 0);
    const round2 = (n: number) => Math.round(n * 100) / 100;

    return {
      today: { trips: today.length, earnings: round2(sum(today)) },
      week:  { trips: week.length,  earnings: round2(sum(week)) },
      month: { trips: rides.length, earnings: round2(sum(rides)) },
      lifetime: { trips: totalCompleted },
    };
  }

  // Legacy alias usado por mobile-driver-app — devuelve sólo el bloque "today".
  @Get('me/stats/today')
  @UseGuards(JwtAuthGuard)
  async getStatsToday(@CurrentUser('id') driverId: string) {
    const stats = await this.getStats(driverId);
    return stats.today;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GET /drivers/me/ratings/summary
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me/ratings/summary')
  @UseGuards(JwtAuthGuard)
  async getRatingsSummary(@CurrentUser('id') driverId: string) {
    const agg = await this.ratingModel.aggregate([
      { $match: { driverId } },
      {
        $group: {
          _id:     null,
          average: { $avg: '$rating' },
          total:   { $sum: 1 },
          star5:   { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          star4:   { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star3:   { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star2:   { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star1:   { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    if (!agg.length) {
      return { average: 5.0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }

    const { average, total, star5, star4, star3, star2, star1 } = agg[0];
    return {
      average:   +average.toFixed(2),
      total,
      breakdown: { 5: star5, 4: star4, 3: star3, 2: star2, 1: star1 },
    };
  }
}
