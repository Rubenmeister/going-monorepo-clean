import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../infrastructure/telegram.service';
import { IncidentDocument } from '../infrastructure/schemas/incident.schema';

/**
 * Notificador de incidentes SOS al equipo de operadores. Manda 1 mensaje
 * de texto + 1 ubicación nativa de Telegram a TODOS los chat IDs en
 * OPERATOR_TELEGRAM_CHAT_IDS (igual lista que usa customer-support para
 * handoffs).
 *
 * Política de RED:
 *   - Notifica a TODOS los operadores (no round-robin) — emergencia real.
 *   - Mensaje con 🔴🚨 destacado, prioridad explícita, link al Maps,
 *     incident ID para que el operador responda con "/resolver <id>".
 *   - Si Telegram falla, log pero NO arroja — el cliente ya recibió ack
 *     del SOS, el operador se entera de algún otro lado (cerebro event).
 */
@Injectable()
export class OpsNotifierService {
  private readonly logger = new Logger(OpsNotifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly telegram: TelegramService,
  ) {}

  private operatorChatIds(): string[] {
    const raw = this.config.get<string>('OPERATOR_TELEGRAM_CHAT_IDS') ?? '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Saneo de campos controlados por el cliente antes de interpolarlos en el
   * Markdown de Telegram (auditoría Bloque 2 #4). Quita los caracteres de
   * control de Markdown legacy (` * _ [ ]) para que una descripción/rideId
   * maliciosos no puedan inyectar formato, links falsos, ni romper el parseo
   * (que suprimiría la alerta SOS). El TelegramService además reintenta en
   * texto plano como segunda barrera.
   */
  private md(value: unknown): string {
    return String(value ?? '').replace(/[`*_[\]]/g, '');
  }

  async notify(incident: IncidentDocument): Promise<void> {
    const chatIds = this.operatorChatIds();
    if (chatIds.length === 0) {
      this.logger.warn('SOS incident creado pero NO hay operadores en OPERATOR_TELEGRAM_CHAT_IDS — emergencia sin notificar');
      return;
    }

    const [lng, lat] = incident.location.coordinates;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const typeEmoji = TYPE_EMOJI[incident.emergencyType] ?? '⚠️';
    const typeLabel = TYPE_LABEL[incident.emergencyType] ?? incident.emergencyType;

    const lines: string[] = [
      `🔴🚨 *SOS — EMERGENCIA* ${typeEmoji}`,
      `Tipo: *${typeLabel}*`,
      `Canal: ${this.md(incident.channel)}`,
      `Cliente: \`${this.md(incident.userId)}\``,
      ``,
      `📍 Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      `🗺️ [Abrir en Google Maps](${mapsUrl})`,
    ];

    if (incident.accuracyM != null) {
      lines.push(`📡 Precisión GPS: ±${Math.round(incident.accuracyM)}m`);
    }

    if (incident.rideId) {
      lines.push('', `🚗 Viaje activo: \`${this.md(incident.rideId)}\``);
    }

    if (incident.description) {
      lines.push('', `Descripción del cliente:`, `_${this.md(incident.description).slice(0, 500)}_`);
    }

    if (incident.emergencyDialerTriggered) {
      lines.push('', `☎️ El cliente *llamó al 911* desde la app — coordinar con autoridades.`);
    }

    lines.push(
      '',
      `Incident ID: \`${incident._id}\``,
      `Para tomarlo: PATCH /incidents/${incident._id} con \`status: in_progress\``,
    );

    const text = lines.join('\n');

    // Fire-and-forget en paralelo. Si alguno falla no bloquea a los otros.
    const results = await Promise.allSettled(
      chatIds.flatMap(chatId => [
        this.telegram.sendMessage(chatId, text),
        // Location nativa: bonus UX, se abre in-app.
        this.telegram.sendLocation(chatId, lat, lng),
      ]),
    );

    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length;
    if (failed > 0) {
      this.logger.warn(`[ops-notifier] ${failed} envíos a Telegram fallaron de ${results.length} totales`);
    } else {
      this.logger.log(`[ops-notifier] alerta SOS enviada a ${chatIds.length} operador(es)`);
    }
  }
}

const TYPE_EMOJI: Record<string, string> = {
  medical:           '🚑',
  accident:          '🚗💥',
  robbery:           '🦹',
  harassment:        '⚠️',
  vehicle_breakdown: '🔧',
  other:             '❗',
};

const TYPE_LABEL: Record<string, string> = {
  medical:           'Médica',
  accident:          'Accidente de tránsito',
  robbery:           'Robo / Asalto',
  harassment:        'Acoso / Amenaza',
  vehicle_breakdown: 'Vehículo averiado',
  other:             'Otra emergencia',
};
