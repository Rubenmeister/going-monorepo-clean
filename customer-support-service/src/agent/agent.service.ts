import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI, Content, FunctionDeclarationSchemaType } from '@google-cloud/vertexai';
import { ConversationService } from './conversation.service';
import { getSystemPrompt, detectLanguage, detectCanton, SupportedLang } from '../knowledge-base/system-prompt';
import { LocationService } from '../knowledge-base/location.service';
import { BookingService } from '../booking/booking.service';
import { FARES, applyDynamicPricing } from 'pricing';

// [CREAR_VIAJE:origen=X,destino=Y,servicio=Z,modalidad=compartido|privado] o con ,hora=ISO
const BOOKING_TAG_RE = /\[CREAR_VIAJE:origen=([^,\]]+),destino=([^,\]]+),servicio=([^,\]]+)(?:,modalidad=([^,\]]+))?(?:,hora=([^\]]+))?\]/i;

/**
 * Tools que Gemini puede llamar para responder con datos LIVE en lugar
 * de adivinar desde el system prompt.
 *
 * Por ahora: 1 sola tool (get_quote). Roadmap: get_ride_history,
 * get_ride_status, find_drivers_nearby, book_ride.
 *
 * get_quote: calcula precio aplicando recargos dinámicos del MOMENTO
 * (hora pico, nocturno, feriado, fin de semana, segmento). Antes Gemini
 * solo veía la tabla base estática inyectada en el system prompt — no
 * sabía que a las 11pm el domingo el precio sube ~30%. Con esta tool
 * llama get_quote() y devuelve el precio que el cliente realmente pagará.
 */
const TOOLS = [{
  functionDeclarations: [{
    name: 'get_quote',
    description:
      'Calcula el precio EXACTO de un viaje aplicando recargos dinámicos ' +
      '(hora pico mañana/tarde, nocturno, fin de semana, feriado nacional). ' +
      'Usa esto SIEMPRE que el usuario pregunte cuánto cuesta un viaje. ' +
      'NO inventes precios — siempre llama esta función.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        origen: {
          type: FunctionDeclarationSchemaType.STRING,
          description:
            'Ciudad o lugar de origen en minúsculas con guión bajo. ' +
            'Ej: "quito", "ambato", "santo_domingo", "el_carmen", "aeropuerto"',
        },
        destino: {
          type: FunctionDeclarationSchemaType.STRING,
          description: 'Ciudad o lugar destino, mismo formato que origen',
        },
        modalidad: {
          type: FunctionDeclarationSchemaType.STRING,
          description:
            '"compartido" (precio por asiento) o "privado" (vehículo completo)',
        },
        fecha_hora: {
          type: FunctionDeclarationSchemaType.STRING,
          description:
            'ISO datetime del viaje (ej: "2026-05-17T23:00:00-05:00"). ' +
            'Si el usuario no especifica, omitir — se asume "ahora".',
        },
      },
      required: ['origen', 'destino', 'modalidad'],
    },
  }],
}];

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
        tools: TOOLS,
        // maxOutputTokens 600 → 250: respuestas más cortas (<100 palabras
        // típicas) reduce ~1 seg de latencia y mejora UX (lectura rápida
        // por WhatsApp). El bot no necesita escribir párrafos largos.
        generationConfig: { maxOutputTokens: 250 },
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }],
        },
      });

      const chat = model.startChat({ history });
      let result = await chat.sendMessage(userMessage);
      let candidate = result.response.candidates?.[0];

      // ── Function calling loop ─────────────────────────────────────────
      // Gemini puede devolver functionCall en lugar de texto. Ejecutamos
      // la función real (usa libs/pricing) y mandamos el resultado de
      // vuelta para que Gemini componga la respuesta natural.
      let functionCallTurns = 0;
      while (functionCallTurns < 3) {
        const fnCall = candidate?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
        if (!fnCall) break;
        functionCallTurns++;
        this.logger.log(`[tools] Gemini llamó: ${fnCall.name}(${JSON.stringify(fnCall.args)})`);

        const fnResult = this.executeTool(fnCall.name, fnCall.args);
        // sendMessage con functionResponse — Gemini ve el resultado y compone respuesta
        result = await chat.sendMessage([{
          functionResponse: {
            name: fnCall.name,
            response: { result: fnResult },
          },
        }] as any);
        candidate = result.response.candidates?.[0];
      }

      assistantMessage = candidate?.content?.parts?.find((p: any) => p.text)?.text || '';

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

  // ────────────────────────────────────────────────────────────────────
  //  Function calling — dispatcher + tools
  // ────────────────────────────────────────────────────────────────────

  /**
   * Dispatch del function call de Gemini al handler real. Cada tool
   * devuelve un objeto plano serializable (Vertex lo pasa a Gemini como
   * `functionResponse`). Si falla, devuelve { error } y Gemini compone
   * una disculpa natural.
   */
  private executeTool(name: string, args: any): any {
    try {
      switch (name) {
        case 'get_quote':
          return this.toolGetQuote(args);
        default:
          this.logger.warn(`[tools] tool desconocido: ${name}`);
          return { error: `Tool ${name} no implementado` };
      }
    } catch (err) {
      this.logger.error(`[tools] error ejecutando ${name}: ${(err as Error).message}`);
      return { error: (err as Error).message };
    }
  }

  /**
   * get_quote: calcula precio EXACTO usando libs/pricing. Mismo código que
   * payment-service usa para cobrar — sin desincronización.
   *
   * Returns shape esperado por Gemini para componer respuesta natural:
   *   {
   *     base_price: 15,
   *     final_price: 19.50,
   *     surcharges: { time: '+20% nocturno', weekend: '+10%' },
   *     currency: 'USD',
   *     per_seat: true  // (compartido) o false (privado)
   *   }
   */
  private toolGetQuote(args: any): any {
    const origen   = String(args.origen   || '').toLowerCase().replace(/\s+/g, '_');
    const destino  = String(args.destino  || '').toLowerCase().replace(/\s+/g, '_');
    const modalidad = (args.modalidad === 'privado' ? 'privado' : 'compartido') as 'privado' | 'compartido';
    const dateTime = args.fecha_hora ? new Date(args.fecha_hora) : new Date();
    if (isNaN(dateTime.getTime())) {
      return { error: 'fecha_hora inválida — usar formato ISO 8601' };
    }

    // Lookup en tabla FARES (direccional — probar ambos órdenes).
    const sharedFares: Record<string, number> = FARES.shared as any;
    const key1 = `${origen}-${destino}`;
    const key2 = `${destino}-${origen}`;
    let basePrice = sharedFares[key1] ?? sharedFares[key2];

    // Si no es ruta compartida conocida, devolver no_route_found para
    // que Gemini sugiera al usuario contactar soporte o usar la app.
    if (basePrice === undefined) {
      return {
        error: 'ruta_no_listada',
        message: `No tengo tarifa fija para ${origen} → ${destino}. Las rutas con tarifa pre-definida son: ${Object.keys(sharedFares).slice(0, 10).join(', ')}...`,
      };
    }

    // applyDynamicPricing aplica TODOS los recargos del momento.
    const pricing = applyDynamicPricing({
      basePrice,
      mode: modalidad,
      dateTime,
      clientSegment: 'public',
    });

    // Componer surcharges en formato humano para Gemini.
    const surcharges: Record<string, string> = {};
    if (pricing.timeSurchargeRate > 0) {
      surcharges.tiempo = `+${(pricing.timeSurchargeRate * 100).toFixed(0)}%`;
    }
    if (pricing.clientSurchargeRate > 0) {
      surcharges.segmento = `+${(pricing.clientSurchargeRate * 100).toFixed(0)}%`;
    }

    return {
      origen,
      destino,
      modalidad,
      base_price: basePrice,
      final_price: pricing.adjustedPrice,
      surcharges,
      currency: 'USD',
      per_seat: modalidad === 'compartido',
      datetime_used: dateTime.toISOString(),
    };
  }
}
