import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente único de WhatsApp (Meta Cloud API / Graph v19.0).
 *
 * Centraliza el acceso a Meta para evitar duplicación entre el inbound
 * (WhatsAppController) y los outbound programados (BookingService —
 * recordatorios de viaje 15 min antes).
 *
 * Env vars requeridas:
 *   WHATSAPP_PHONE_NUMBER_ID  – Phone Number ID en Meta Business Suite
 *   META_WA_ACCESS_TOKEN      – System User token con whatsapp_business_messaging
 *
 * Decisión: dejamos Twilio fuera por completo. Meta Cloud API cubre todo
 * el flujo (inbound + outbound) y elimina dependencia + costo redundante.
 */
const META_GRAPH = 'https://graph.facebook.com/v19.0';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly config: ConfigService) {}

  private get phoneNumberId(): string {
    return this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';
  }

  private get accessToken(): string {
    return this.config.get<string>('META_WA_ACCESS_TOKEN') ?? '';
  }

  /** Envía un mensaje de texto plano a un número de WhatsApp. */
  async sendText(to: string, text: string): Promise<boolean> {
    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.error('Missing WHATSAPP_PHONE_NUMBER_ID or META_WA_ACCESS_TOKEN');
      return false;
    }

    try {
      const res = await fetch(`${META_GRAPH}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Meta send text failed: ${res.status} ${err}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error('sendText error', err);
      return false;
    }
  }

  /**
   * Sube un buffer de audio (OGG_OPUS) a Meta y envía como voice note.
   * El caller (típicamente WhatsAppController) genera el TTS con VoiceService.
   */
  async sendAudio(to: string, audioBuffer: Buffer): Promise<boolean> {
    if (!this.phoneNumberId || !this.accessToken) return false;

    try {
      // 1. Upload media
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', 'audio/ogg');
      formData.append(
        'file',
        new Blob([audioBuffer], { type: 'audio/ogg' }),
        'reply.ogg',
      );

      const uploadRes = await fetch(`${META_GRAPH}/${this.phoneNumberId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        this.logger.error(`Meta media upload failed: ${uploadRes.status} ${err}`);
        return false;
      }

      const uploadData = (await uploadRes.json()) as { id?: string };
      const mediaId = uploadData.id;
      if (!mediaId) return false;

      // 2. Send audio message referenciando el mediaId
      const sendRes = await fetch(`${META_GRAPH}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'audio',
          audio: { id: mediaId },
        }),
      });

      if (!sendRes.ok) {
        const err = await sendRes.text();
        this.logger.error(`Meta send audio failed: ${sendRes.status} ${err}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error('sendAudio error', err);
      return false;
    }
  }

  /**
   * Descarga el binario de un media inbound (audio recibido del usuario).
   * Dos pasos: GET /{mediaId} → URL firmada → GET URL → bytes.
   * Devuelve null si falla; el caller debe tener fallback a texto.
   */
  async downloadMedia(mediaId: string): Promise<Buffer | null> {
    if (!this.accessToken) return null;

    try {
      const metaRes = await fetch(`${META_GRAPH}/${mediaId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const mediaData = (await metaRes.json()) as { url?: string };
      if (!mediaData.url) return null;

      const audioRes = await fetch(mediaData.url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return Buffer.from(await audioRes.arrayBuffer());
    } catch (err) {
      this.logger.error('downloadMedia error', err);
      return null;
    }
  }
}
