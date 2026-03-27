import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Firestore, Timestamp } from '@google-cloud/firestore';

interface Coords {
  latitude: number;
  longitude: number;
}

export interface BookingResult {
  success: boolean;
  rideId?: string;
  estimatedTotal?: number;
  eta?: number;
  scheduledAt?: Date;
  error?: string;
}

// Viaje programado en memoria (para recordatorio)
interface ScheduledReminder {
  phoneNumber: string;
  rideId: string;
  origen: string;
  destino: string;
  scheduledAt: Date;
  timer: ReturnType<typeof setTimeout>;
}

@Injectable()
export class BookingService implements OnModuleInit {
  private readonly logger = new Logger(BookingService.name);
  private reminders = new Map<string, ScheduledReminder>();
  private readonly jwtSecret: string;
  private readonly db: Firestore;

  constructor(private config: ConfigService) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('[BookingService] JWT_SECRET es requerido — sin él los tokens son inseguros y el transport-service rechazará las peticiones');
    }
    this.jwtSecret = secret;

    const gcpProject = this.config.get<string>('GCP_PROJECT');
    this.db = new Firestore({ projectId: gcpProject });
  }

  // ─── Al iniciar: restaurar recordatorios pendientes desde Firestore ───────
  async onModuleInit(): Promise<void> {
    try {
      const now = new Date();
      const snap = await this.db.collection('scheduled_reminders')
        .where('sent', '==', false)
        .where('scheduledAt', '>', Timestamp.fromDate(now))
        .get();

      this.logger.log(`[reminders] Restaurando ${snap.size} recordatorio(s) pendientes desde Firestore`);

      snap.docs.forEach(doc => {
        const data = doc.data();
        const scheduledAt: Date = (data.scheduledAt as Timestamp).toDate();
        this.scheduleReminder(
          data.phoneNumber,
          doc.id,
          data.origen || '',
          data.destino || '',
          scheduledAt,
          false, // no persistir de nuevo, ya está en Firestore
        );
      });
    } catch (e) {
      this.logger.error('[reminders] Error restaurando recordatorios:', (e as Error).message);
    }
  }

  async geocodeAddress(address: string): Promise<Coords | null> {
    const token = this.config.get<string>('MAPBOX_TOKEN');
    if (!token) {
      this.logger.warn('MAPBOX_TOKEN not configured');
      return null;
    }
    const encoded = encodeURIComponent(`${address}, Ecuador`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=EC&limit=1`;

    try {
      const res = await fetch(url);
      const data = await res.json() as any;
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { latitude: lat, longitude: lng };
      }
      return null;
    } catch (err) {
      this.logger.error('Mapbox geocoding error', err);
      return null;
    }
  }

  async createRide(
    phoneNumber: string,
    origin: Coords,
    destination: Coords,
    serviceType = 'standard',
    scheduledAt?: Date,
  ): Promise<BookingResult> {
    const transportUrl = this.config.get<string>(
      'TRANSPORT_SERVICE_URL',
      'https://transport-service-lw44cnhdeq-uc.a.run.app',
    );
    const token = jwt.sign(
      {
        sub: `whatsapp-${phoneNumber}`,
        email: `wa.${phoneNumber.replace(/\D/g, '')}@going.com.ec`,
        role: 'user',
      },
      this.jwtSecret,
      { expiresIn: '5m' },
    );

    try {
      const body: any = {
        pickupLatitude: origin.latitude,
        pickupLongitude: origin.longitude,
        dropoffLatitude: destination.latitude,
        dropoffLongitude: destination.longitude,
        serviceType,
      };
      if (scheduledAt) {
        body.scheduledAt = scheduledAt.toISOString();
      }

      const res = await fetch(`${transportUrl}/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Transport service error ${res.status}: ${errText}`);
        return { success: false, error: errText };
      }

      const ride = await res.json() as any;
      const result: BookingResult = {
        success: true,
        rideId: ride.rideId,
        estimatedTotal: ride.fare?.estimatedTotal,
        eta: ride.eta,
        scheduledAt,
      };

      // Si es viaje programado, configurar recordatorio 15 min antes
      if (scheduledAt && ride.rideId) {
        this.scheduleReminder(phoneNumber, ride.rideId, '', '', scheduledAt, true);
      }

      return result;
    } catch (err) {
      this.logger.error('Transport service call error', err);
      return { success: false, error: String(err) };
    }
  }

  // Enviar mensaje de WhatsApp via Twilio (outbound)
  async sendWhatsApp(to: string, message: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken  = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from       = this.config.get<string>('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured for outbound');
      return;
    }

    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    try {
      const body = new URLSearchParams({ From: from, To: toNumber, Body: message });
      const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${creds}`,
        },
        body,
      });
      this.logger.log(`WhatsApp reminder sent to ${to}`);
    } catch (err) {
      this.logger.error('Twilio outbound error', err);
    }
  }

  private scheduleReminder(
    phoneNumber: string,
    rideId: string,
    origen: string,
    destino: string,
    scheduledAt: Date,
    persist = true,  // false al restaurar desde Firestore (ya está guardado)
  ): void {
    // Recordatorio 15 minutos antes
    const reminderTime = new Date(scheduledAt.getTime() - 15 * 60 * 1000);
    const delay = reminderTime.getTime() - Date.now();

    if (delay <= 0) return; // Ya pasó el tiempo

    this.logger.log(`Recordatorio programado para ${reminderTime.toISOString()} (ride ${rideId})`);

    // Persistir en Firestore para sobrevivir reinicios del servidor
    if (persist) {
      this.db.collection('scheduled_reminders').doc(rideId).set({
        phoneNumber,
        origen,
        destino,
        scheduledAt: Timestamp.fromDate(scheduledAt),
        sent: false,
        createdAt: Timestamp.now(),
      }).catch(e => this.logger.error(`[reminders] Error guardando en Firestore:`, e));
    }

    const timer = setTimeout(async () => {
      const hora = scheduledAt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });
      await this.sendWhatsApp(
        phoneNumber,
        `⏰ *Recordatorio GOING*\nTu viaje está programado para las ${hora}.\n🆔 ID: ${rideId}\n¡Prepárate! El conductor llegará pronto. 🚗`,
      );
      // Marcar como enviado en Firestore
      this.db.collection('scheduled_reminders').doc(rideId)
        .update({ sent: true, sentAt: Timestamp.now() })
        .catch(e => this.logger.error(`[reminders] Error marcando como enviado:`, e));
      this.reminders.delete(rideId);
    }, delay);

    this.reminders.set(rideId, { phoneNumber, rideId, origen, destino, scheduledAt, timer });
  }
}
