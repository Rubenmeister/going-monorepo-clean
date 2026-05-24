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
      // 1. Upload media (Meta Graph API — tiende a ser el step más lento
      //    del envío porque sube el binario completo). Timing separado del
      //    send para identificar si el cuello es la subida o el dispatch.
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', 'audio/ogg');
      formData.append(
        'file',
        new Blob([audioBuffer], { type: 'audio/ogg' }),
        'reply.ogg',
      );

      const tUpload = Date.now();
      const uploadRes = await fetch(`${META_GRAPH}/${this.phoneNumberId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: formData,
      });
      const dtUpload = Date.now() - tUpload;

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        this.logger.error(`[wa-upload] failed in ${dtUpload}ms: ${uploadRes.status} ${err}`);
        return false;
      }

      const uploadData = (await uploadRes.json()) as { id?: string };
      const mediaId = uploadData.id;
      if (!mediaId) return false;

      // 2. Send audio message referenciando el mediaId (sin payload pesado —
      //    solo el ID + metadata). Suele ser <500ms.
      const tSend = Date.now();
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
      const dtSend = Date.now() - tSend;

      if (!sendRes.ok) {
        const err = await sendRes.text();
        this.logger.error(`[wa-send] failed in ${dtSend}ms: ${sendRes.status} ${err}`);
        return false;
      }
      this.logger.log(`[wa-audio] ${audioBuffer.length}B → mediaId=${mediaId} (upload=${dtUpload}ms, send=${dtSend}ms, total=${dtUpload + dtSend}ms)`);
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
    if (!this.accessToken) {
      this.logger.error('[downloadMedia] no access token bound');
      return null;
    }

    try {
      this.logger.log(`[downloadMedia] fetching metadata for media ${mediaId}`);
      const metaRes = await fetch(`${META_GRAPH}/${mediaId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const mediaData = (await metaRes.json()) as { url?: string; mime_type?: string; file_size?: number; error?: any };
      if (mediaData.error) {
        this.logger.error(`[downloadMedia] Meta returned error: ${JSON.stringify(mediaData.error)}`);
        return null;
      }
      if (!mediaData.url) {
        this.logger.error(`[downloadMedia] metadata missing url (mime=${mediaData.mime_type}, size=${mediaData.file_size})`);
        return null;
      }
      this.logger.log(`[downloadMedia] metadata ok (mime=${mediaData.mime_type}, size=${mediaData.file_size}b), downloading binary`);

      const audioRes = await fetch(mediaData.url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!audioRes.ok) {
        const text = await audioRes.text();
        this.logger.error(`[downloadMedia] binary fetch failed: ${audioRes.status} ${text.slice(0, 200)}`);
        return null;
      }
      const buf = Buffer.from(await audioRes.arrayBuffer());
      this.logger.log(`[downloadMedia] downloaded ${buf.length} bytes`);
      return buf;
    } catch (err) {
      this.logger.error(`[downloadMedia] exception: ${(err as Error).message}`, (err as Error).stack);
      return null;
    }
  }
}
