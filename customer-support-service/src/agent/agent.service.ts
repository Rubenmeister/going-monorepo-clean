import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ConversationService } from './conversation.service';
import { getSystemPrompt, detectLanguage, detectCanton } from '../knowledge-base/system-prompt';
import { BookingService } from '../booking/booking.service';

// [CREAR_VIAJE:origen=X,destino=Y,servicio=Z] o con ,hora=ISO
const BOOKING_TAG_RE = /\[CREAR_VIAJE:origen=([^,\]]+),destino=([^,\]]+),servicio=([^,\]]+)(?:,hora=([^\]]+))?\]/i;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private client: Anthropic;

  constructor(
    private config: ConfigService,
    private conversationService: ConversationService,
    private bookingService: BookingService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY')?.trim(),
    });
  }

  async respond(userId: string, userMessage: string): Promise<string> {
    this.conversationService.addMessage(userId, 'user', userMessage);

    const { needed, priority } = this.conversationService.detectHandoffTrigger(userMessage);
    if (needed) {
      this.conversationService.requestHandoff(userId, userMessage, priority);
      const lang = detectLanguage(userMessage);
      return lang === 'en'
        ? "🙋 I'm connecting you with a Going team member. Please wait a moment..."
        : '🙋 Te estoy conectando con un miembro del equipo Going. Por favor espera un momento...';
    }

    const conv = this.conversationService.getOrCreate(userId);
    const lang = detectLanguage(userMessage);
    const canton = detectCanton(userMessage);
    const systemPrompt = getSystemPrompt(lang, canton, conv.agentGender);

    const messages = conv.messages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let assistantMessage = '';

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages,
      });

      assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

    } catch (error) {
      this.logger.error('Claude API error', error);
      return lang === 'en'
        ? "Sorry, I'm having trouble right now. Please try again in a moment."
        : 'Disculpa, estoy teniendo problemas en este momento. Por favor intenta de nuevo en un momento.';
    }

    // Check if Claude wants to create a booking
    const match = BOOKING_TAG_RE.exec(assistantMessage);
    if (match) {
      const [, origen, destino, servicio, horaStr] = match;
      const cleanMessage = assistantMessage.replace(BOOKING_TAG_RE, '').trim();
      const scheduledAt = horaStr ? new Date(horaStr) : undefined;

      // Geocode both locations in parallel
      const [originCoords, destCoords] = await Promise.all([
        this.bookingService.geocodeAddress(origen.trim()),
        this.bookingService.geocodeAddress(destino.trim()),
      ]);

      if (!originCoords || !destCoords) {
        const errorMsg = lang === 'en'
          ? `${cleanMessage}\n\n⚠️ Couldn't locate one of the addresses. Please be more specific.`
          : `${cleanMessage}\n\n⚠️ No pude ubicar una de las direcciones. Por favor sé más específico (ej: "Quito, Pichincha").`;
        this.conversationService.addMessage(userId, 'assistant', errorMsg);
        return errorMsg;
      }

      const result = await this.bookingService.createRide(
        userId, originCoords, destCoords, servicio.trim(), scheduledAt,
      );

      let finalMessage: string;
      if (result.success) {
        const fare = result.estimatedTotal ? `$${result.estimatedTotal.toFixed(2)}` : 'por calcular';

        if (scheduledAt) {
          const hora = scheduledAt.toLocaleTimeString('es-EC', {
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil',
          });
          const fecha = scheduledAt.toLocaleDateString('es-EC', {
            weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil',
          });
          finalMessage = lang === 'en'
            ? `${cleanMessage}\n\n✅ *Ride scheduled!*\n📅 ${fecha} at ${hora}\n🆔 ID: ${result.rideId}\n💵 Est. fare: ${fare}\n⏰ You'll receive a WhatsApp reminder 15 min before.`
            : `${cleanMessage}\n\n✅ *¡Viaje programado!*\n📅 ${fecha} a las ${hora}\n🆔 ID: ${result.rideId}\n💵 Tarifa estimada: ${fare}\n⏰ Recibirás un recordatorio por WhatsApp 15 min antes. 🔔`;
        } else {
          const eta = result.eta ? `~${Math.ceil(result.eta / 60)} min` : 'en breve';
          finalMessage = lang === 'en'
            ? `${cleanMessage}\n\n✅ *Ride booked!*\n🆔 ID: ${result.rideId}\n💵 Est. fare: ${fare}\n🕐 Driver arriving in: ${eta}`
            : `${cleanMessage}\n\n✅ *¡Viaje creado!*\n🆔 ID: ${result.rideId}\n💵 Tarifa estimada: ${fare}\n🕐 Conductor llegará en: ${eta}`;
        }
      } else {
        finalMessage = lang === 'en'
          ? `${cleanMessage}\n\n⚠️ Couldn't create the ride right now. Please try through the GOING app.`
          : `${cleanMessage}\n\n⚠️ No se pudo crear el viaje ahora. Por favor intenta desde la app GOING.`;
        this.logger.error('Ride creation failed', result.error);
      }

      this.conversationService.addMessage(userId, 'assistant', finalMessage);
      return finalMessage;
    }

    // Normal response (no booking)
    this.conversationService.addMessage(userId, 'assistant', assistantMessage);
    return assistantMessage;
  }
}
