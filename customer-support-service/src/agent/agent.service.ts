import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI, Content } from '@google-cloud/vertexai';
import { ConversationService } from './conversation.service';
import { getSystemPrompt, detectLanguage, detectCanton, SupportedLang } from '../knowledge-base/system-prompt';
import { LocationService } from '../knowledge-base/location.service';
import { BookingService } from '../booking/booking.service';

// [CREAR_VIAJE:origen=X,destino=Y,servicio=Z,modalidad=compartido|privado] o con ,hora=ISO
const BOOKING_TAG_RE = /\[CREAR_VIAJE:origen=([^,\]]+),destino=([^,\]]+),servicio=([^,\]]+)(?:,modalidad=([^,\]]+))?(?:,hora=([^\]]+))?\]/i;

// Modelo estable (sin sufijo -preview-XX-XX). El preview que se usaba antes
// fue deprecado por Vertex (403 PERMISSION_DENIED con "or it may not exist").
const GEMINI_MODEL = 'gemini-2.5-flash';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private vertexAI: VertexAI;

  constructor(
    private config: ConfigService,
    private conversationService: ConversationService,
    private bookingService: BookingService,
    private locationService: LocationService,
  ) {
    this.vertexAI = new VertexAI({
      project: this.config.get<string>('GCP_PROJECT') || 'going-5d1ae',
      location: 'us-central1',
    });
  }

  /**
   * Genera respuesta del agente para un mensaje del usuario.
   *
   * @param opts.lang  — idioma override (Item 6 — Fase 8). Si lo pasás,
   *                     se usa en lugar de la detección por regex. Útil
   *                     para audio (donde STT ya detectó el idioma con
   *                     más confiabilidad). Si no se pasa, detectLanguage
   *                     analiza el texto del mensaje.
   */
  async respond(
    userId: string,
    userMessage: string,
    opts?: { lang?: SupportedLang },
  ): Promise<string | null> {
    this.conversationService.addMessage(userId, 'user', userMessage);

    // Idioma efectivo: override (STT) > regex sobre texto
    const lang: SupportedLang = opts?.lang ?? detectLanguage(userMessage);

    const { needed, priority } = this.conversationService.detectHandoffTrigger(userMessage);
    if (needed) {
      await this.conversationService.requestHandoff(userId, userMessage, priority);
      // Mensaje de handoff multilingüe — fallback a español para fr/de/qu
      const handoffMsg: Record<SupportedLang, string> = {
        es: '🙋 Te estoy conectando con un miembro del equipo Going. Por favor espera un momento...',
        en: "🙋 I'm connecting you with a Going team member. Please wait a moment...",
        fr: '🙋 Je vous mets en relation avec un membre de l\'équipe Going. Un moment, s\'il vous plaît...',
        de: '🙋 Ich verbinde Sie mit einem Mitglied des Going-Teams. Bitte warten Sie einen Moment...',
        qu: '🙋 Going equipoman kunan kichashpa. Ama llakikuychu, shuk ratulla shuyay...',
      };
      return handoffMsg[lang];
    }

    const conv = await this.conversationService.getOrCreate(userId);

    // Si la conversación ya está en escalación o un humano la atiende,
    // el bot se calla. El mensaje queda guardado para que el operador
    // tenga contexto cuando entre. Devolvemos null para que el caller
    // sepa que no hay respuesta.
    if (conv.state === 'HANDOFF_REQUESTED' || conv.state === 'HUMAN_ACTIVE') {
      this.logger.log(`Bot silenciado para ${userId} (state=${conv.state}) — mensaje guardado`);
      return null;
    }
    const canton = detectCanton(userMessage);
    const baseSystemPrompt = getSystemPrompt(lang, canton, conv.agentGender);

    // Augmentation: detectar parroquias/cantones/provincias mencionados en
    // el mensaje y agregar su info geográfica al system prompt. Esto hace
    // que Gemini conozca coords exactas (para tarifa) y atractivos turísticos
    // sin tener que adivinar.
    const mentions = this.locationService.extractMentions(userMessage);
    let geoContext = '';
    if (mentions.length > 0) {
      const lines: string[] = ['', '[Contexto geográfico de Ecuador — usa estos datos al responder]'];
      const ambig: string[] = [];
      for (const m of mentions) {
        if (m.parishes.length === 1) {
          lines.push(`• ${m.query} → ${this.locationService.describe(m.parishes[0])}`);
        } else if (m.level === 'parroquia' && m.parishes.length > 1) {
          // Ambigüedad real: misma parroquia en distintas provincias
          const opciones = m.parishes
            .map(p => `${p.parroquia} (${p.canton}, ${p.provincia})`)
            .join(' / ');
          ambig.push(`"${m.query}" es ambigua — opciones: ${opciones}. Pregunta al cliente cuál es.`);
        } else {
          // Cantón/provincia que abarca varias parroquias: mostrar resumen
          const sample = m.parishes.slice(0, 3).map(p => p.parroquia).join(', ');
          const more = m.parishes.length > 3 ? ` y ${m.parishes.length - 3} más` : '';
          lines.push(`• ${m.query} es un ${m.level} con parroquias: ${sample}${more}`);
        }
      }
      if (ambig.length > 0) {
        lines.push('', '[Importante]');
        lines.push(...ambig);
      }
      geoContext = lines.join('\n');
    }

    const systemPrompt = baseSystemPrompt + geoContext;

    const allMessages = conv.messages.slice(-10)
      .filter(m => m.content && m.content.trim().length > 0);

    if (allMessages.length === 0) {
      return lang === 'en'
        ? "Sorry, I didn't receive your message. Please try again."
        : 'Disculpa, no recibí tu mensaje. Por favor intenta de nuevo.';
    }

    // Build Vertex AI history (all messages except the last user one)
    const history: Content[] = allMessages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content.trim() }],
    }));

    let assistantMessage = '';

    try {
      const model = this.vertexAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: { maxOutputTokens: 600 },
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }],
        },
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      assistantMessage = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } catch (error) {
      this.logger.error('Gemini API error', error);
      return lang === 'en'
        ? "Sorry, I'm having trouble right now. Please try again in a moment."
        : 'Disculpa, estoy teniendo problemas en este momento. Por favor intenta de nuevo en un momento.';
    }

    // Check if Gemini wants to create a booking
    const match = BOOKING_TAG_RE.exec(assistantMessage);
    if (match) {
      const [, origen, destino, servicio, modalidad, horaStr] = match;
      const cleanMessage = assistantMessage.replace(BOOKING_TAG_RE, '').trim();

      // FIX 8: Date validation for scheduled rides
      let scheduledAt: Date | undefined;
      if (horaStr) {
        scheduledAt = new Date(horaStr);
        if (isNaN(scheduledAt.getTime())) {
          this.logger.warn(`Invalid date string from AI: ${horaStr}, using current time + 30min`);
          scheduledAt = new Date(Date.now() + 30 * 60 * 1000);
        }
      }

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

      const esCompartido = (modalidad || '').toLowerCase() === 'compartido';
      let finalMessage: string;
      if (result.success) {
        const fare = result.estimatedTotal ? `$${result.estimatedTotal.toFixed(2)}` : 'por calcular';
        const tipoLabel = esCompartido ? 'Compartido' : 'Privado';

        if (scheduledAt) {
          const hora = scheduledAt.toLocaleTimeString('es-EC', {
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil',
          });
          const fecha = scheduledAt.toLocaleDateString('es-EC', {
            weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil',
          });
          finalMessage = lang === 'en'
            ? `${cleanMessage}\n\n✅ *Ride scheduled!*\n📅 ${fecha} at ${hora}\n🆔 ID: ${result.rideId}\n💵 Est. fare: ${fare}\n🚗 A preliminary driver will be assigned and confirmed the day before your trip.\n⏰ You'll receive a WhatsApp reminder 15 min before.`
            : `${cleanMessage}\n\n✅ *¡Viaje programado!* (${tipoLabel})\n📅 ${fecha} a las ${hora}\n🆔 ID: ${result.rideId}\n💵 Tarifa estimada: ${fare}\n🚗 Se asignará un conductor preliminar y se confirmará el definitivo el día anterior.\n⏰ Recibirás un recordatorio por WhatsApp 15 min antes. 🔔`;
        } else {
          const eta = result.eta ? `~${Math.ceil(result.eta / 60)} min` : 'en breve';
          finalMessage = lang === 'en'
            ? `${cleanMessage}\n\n✅ *Ride booked!* (${tipoLabel})\n🆔 ID: ${result.rideId}\n💵 Est. fare: ${fare}\n🚗 Driver assigned and arriving in: ${eta}`
            : `${cleanMessage}\n\n✅ *¡Viaje confirmado!* (${tipoLabel})\n🆔 ID: ${result.rideId}\n💵 Tarifa: ${fare}\n🚗 Conductor asignado — llega en: ${eta}`;
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

    // Normal response
    this.conversationService.addMessage(userId, 'assistant', assistantMessage);
    return assistantMessage;
  }
}
