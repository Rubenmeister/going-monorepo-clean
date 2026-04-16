/**
 * DriverScheduleController — Gestión de agenda del conductor
 *
 * El conductor registra en qué rutas y horarios quiere trabajar.
 * El motor de llenado (TripFillService) monitorea las reservas y
 * confirma el viaje automáticamente cuando hay pasajeros.
 *
 * Endpoints:
 *   GET  /drivers/me/schedule          — Obtener agenda registrada
 *   POST /drivers/me/schedule          — Guardar/actualizar agenda
 *   GET  /drivers/me/schedule/today    — Viajes programados para hoy
 *   POST /drivers/me/schedule/opportunistic — Activar modo oportunista
 */
import {
  Controller, Get, Post, Body, UseGuards,
  Logger, Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

// ── Going routes config ───────────────────────────────────────────────────────
const GOING_ROUTES = {
  sierra_centro: {
    label: 'Sierra Centro → Quito',
    stops: ['Riobamba', 'Ambato', 'Latacunga', 'Quito'],
    estimatedDurationH: 2.5,
  },
  costa_quito: {
    label: 'Costa → Quito',
    stops: ['El Carmen', 'La Concordia', 'Santo Domingo', 'Quito'],
    estimatedDurationH: 3.5,
  },
  sierra_norte: {
    label: 'Sierra Norte → Quito',
    stops: ['Ibarra', 'Otavalo', 'Quito'],
    estimatedDurationH: 2.0,
  },
} as const;

// ── Schema de disponibilidad ──────────────────────────────────────────────────

interface ScheduleSlot {
  routeId:    string;
  time:       string;   // "08:30"
  days:       number[]; // 0=Dom, 1=Lun, ... 6=Sab
  returnTrip: boolean;  // si hace el viaje de regreso
}

@Schema({ timestamps: true, collection: 'driver_schedules' })
class DriverScheduleModel {
  @Prop({ required: true, index: true, unique: true }) driverId: string;
  @Prop({ type: [Object], default: [] })               slots: ScheduleSlot[];
  @Prop({ default: false })                            opportunisticMode: boolean;
  @Prop()                                              currentCity?: string;
  @Prop()                                              opportunisticUntil?: Date;
}

type DriverScheduleDoc = DriverScheduleModel & Document;
const DriverScheduleSchema = SchemaFactory.createForClass(DriverScheduleModel);

export { DriverScheduleModel, DriverScheduleSchema };

// ─────────────────────────────────────────────────────────────────────────────

@Controller('drivers')
export class DriverScheduleController {
  private readonly logger = new Logger(DriverScheduleController.name);

  constructor(
    @InjectModel(DriverScheduleModel.name)
    private readonly scheduleModel: Model<DriverScheduleDoc>,
  ) {}

  // ── GET /drivers/me/schedule ──────────────────────────────────────────────

  @Get('me/schedule')
  @UseGuards(JwtAuthGuard)
  async getSchedule(@CurrentUser('id') driverId: string) {
    const schedule = await this.scheduleModel.findOne({ driverId }).lean();
    return {
      slots:             schedule?.slots              ?? [],
      opportunisticMode: schedule?.opportunisticMode  ?? false,
      currentCity:       schedule?.currentCity        ?? null,
      opportunisticUntil:schedule?.opportunisticUntil ?? null,
    };
  }

  // ── POST /drivers/me/schedule ─────────────────────────────────────────────

  @Post('me/schedule')
  @UseGuards(JwtAuthGuard)
  async saveSchedule(
    @CurrentUser('id') driverId: string,
    @Body() body: { slots: ScheduleSlot[] },
  ) {
    const { slots } = body;

    // Validar que las rutas existan
    const validRouteIds = Object.keys(GOING_ROUTES);
    const validSlots = slots.filter(s => validRouteIds.includes(s.routeId));

    await this.scheduleModel.findOneAndUpdate(
      { driverId },
      { driverId, slots: validSlots },
      { upsert: true, new: true },
    );

    this.logger.log(`Driver ${driverId} saved ${validSlots.length} schedule slots`);

    // Calcular estimado semanal
    const weeklyEstimate = validSlots.reduce((total, slot) => {
      const route = GOING_ROUTES[slot.routeId as keyof typeof GOING_ROUTES];
      if (!route) return total;
      // ~$10/asiento × 3 asientos SUV = $30 por viaje
      const perTrip = 30;
      const tripsPerWeek = slot.days.length * (slot.returnTrip ? 2 : 1);
      return total + (perTrip * tripsPerWeek);
    }, 0);

    return {
      saved: true,
      slots: validSlots,
      weeklyEstimate,
      message: `Agenda guardada con ${validSlots.length} horario${validSlots.length > 1 ? 's' : ''}`,
    };
  }

  // ── GET /drivers/me/schedule/today ────────────────────────────────────────

  @Get('me/schedule/today')
  @UseGuards(JwtAuthGuard)
  async getTodayTrips(@CurrentUser('id') driverId: string) {
    const schedule = await this.scheduleModel.findOne({ driverId }).lean();
    if (!schedule?.slots?.length) return { trips: [] };

    const today = new Date();
    const todayDow = today.getDay(); // 0=Dom ... 6=Sab
    const todayStr = today.toISOString().split('T')[0];

    // Filtrar slots del día de hoy
    const todaySlots = schedule.slots.filter(s => s.days.includes(todayDow));

    const trips = todaySlots.flatMap(slot => {
      const route = GOING_ROUTES[slot.routeId as keyof typeof GOING_ROUTES];
      if (!route) return [];

      const result = [{
        routeId:        slot.routeId,
        routeLabel:     route.label,
        stops:          route.stops,
        departureTime:  slot.time,
        date:           todayStr,
        direction:      'ida' as const,
        estimatedArrival: addHours(slot.time, route.estimatedDurationH),
        status:         getTripStatus(slot.time),
      }];

      if (slot.returnTrip) {
        const returnTime = addHours(slot.time, route.estimatedDurationH + 1.5);
        result.push({
          routeId:        slot.routeId,
          routeLabel:     `${route.label.split('→')[1]?.trim()} → ${route.stops[0]}`,
          stops:          [...route.stops].reverse(),
          departureTime:  returnTime,
          date:           todayStr,
          direction:      'vuelta' as const,
          estimatedArrival: addHours(returnTime, route.estimatedDurationH),
          status:         getTripStatus(returnTime),
        });
      }

      return result;
    });

    // Ordenar por hora
    trips.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    return { trips, date: todayStr };
  }

  // ── POST /drivers/me/schedule/opportunistic ───────────────────────────────
  /**
   * El conductor activa el modo oportunista cuando llega a otra ciudad.
   * El sistema lo marcará disponible para viajes cortos durante 2 horas.
   */
  @Post('me/schedule/opportunistic')
  @UseGuards(JwtAuthGuard)
  async activateOpportunistic(
    @CurrentUser('id') driverId: string,
    @Body() body: { city: string; durationHours?: number },
  ) {
    const hours = Math.min(body.durationHours ?? 2, 3); // máx 3 horas
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);

    await this.scheduleModel.findOneAndUpdate(
      { driverId },
      {
        driverId,
        opportunisticMode: true,
        currentCity:       body.city,
        opportunisticUntil: until,
      },
      { upsert: true, new: true },
    );

    this.logger.log(`Driver ${driverId} activated opportunistic mode in ${body.city} until ${until.toISOString()}`);

    return {
      activated: true,
      city:      body.city,
      until:     until.toISOString(),
      message:   `Modo oportunista activado en ${body.city} hasta las ${until.toLocaleTimeString('es-EC')}`,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(hours * 60);
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function getTripStatus(timeStr: string): 'upcoming' | 'active' | 'completed' {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const tripTime = new Date();
  tripTime.setHours(h, m, 0, 0);
  const diffMins = (tripTime.getTime() - now.getTime()) / 60000;

  if (diffMins > 60)  return 'upcoming';
  if (diffMins > -180) return 'active';
  return 'completed';
}
