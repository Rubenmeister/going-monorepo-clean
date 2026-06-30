import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ConversationService, type Audience } from './conversation.service';
import { getSystemPrompt, detectLanguage, detectCanton, SupportedLang } from '../knowledge-base/system-prompt';
import { detectDriverIntent } from '../knowledge-base/driver-support';
import { BudgetService, TEXT_PRICING } from '../infrastructure/budget.service';
import { LocationService } from '../knowledge-base/location.service';
import { BookingService } from '../booking/booking.service';
import {
  findRoute,
  listActiveCities,
  type Modality,
  type VehicleId,
} from '@going-platform/going-kb';

// [CREAR_VIAJE:origen=X,destino=Y,servicio=Z,modalidad=compartido|privado] o con ,hora=ISO
const BOOKING_TAG_RE = /\[CREAR_VIAJE:origen=([^,\]]+),destino=([^,\]]+),servicio=([^,\]]+)(?:,modalidad=([^,\]]+))?(?:,hora=([^\]]+))?\]/i;

// NOTA: Tool use con Claude (futuro post-migración) — Anthropic SDK soporta
// tools nativos con schema JSON estándar. Cuando reactivemos function calling,
// el formato es:
//   tools: [{
//     name: 'get_quote',
//     description: '...',
//     input_schema: { type: 'object', properties: {...}, required: [...] }
//   }]
// Y el response.content puede tener bloques 'tool_use' que ejecutamos +
// devolvemos como 'tool_result'. Mucho más simple que Vertex FunctionDeclaration.
//
// Por ahora: sin tools. El system prompt tiene la tabla FARES inyectada
// como string — Claude responde directamente.

// GPT-4.1-nano — migración 2026-05-20 desde Claude Haiku (cuya cuenta
// quedó sin créditos). OpenAI nano: 2-4s típico, $0.10/M input tokens
// (8x más barato que Claude). Gemini Flash 2.5 vía VertexAI legacy SDK
// tomaba 60-120s (broken) — por eso esta migración.
const OPENAI_MODEL = 'gpt-4.1-nano';
// Claude primario (decisión Rubén 30-jun). Going está construido con Claude.
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private openai: OpenAI;
  private anthropic: Anthropic | null = null;

  constructor(
    private config: ConfigService,
    private conversationService: ConversationService,
    private bookingService: BookingService,
    private locationService: LocationService,
    private budget: BudgetService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY no configurada — fallback OpenAI no disponible');
    }
    this.openai = new OpenAI({ apiKey: apiKey || '' });

    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      this.logger.log('Anthropic (Claude) habilitado como modelo primario ✓');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY no configurada — solo OpenAI disponible (sin primario Claude)');
    }
  }

  /**
   * Genera la respuesta del LLM con Claude primario + OpenAI fallback y guarda
   * de presupuesto. Según el estado del tope mensual:
   *   ok   → intenta Claude, si falla cae a OpenAI nano
   *   soft → directo a OpenAI nano (más barato), se salta Claude
   * (el caso 'hard' se maneja antes en respond(): deriva a humano).
   * Registra el gasto estimado por tokens en BudgetService.
   */
  private async generate(
    systemPrompt: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
  ): Promise<string> {
    const status = this.budget.status();
    const order: ('claude' | 'openai')[] =
      status === 'ok' && this.anthropic ? ['claude', 'openai'] : ['openai'];
    if (status === 'soft') {
      this.logger.warn(`[budget] tope $${this.budget.budget()} alcanzado (gasto ~$${this.budget.spent().toFixed(2)}) — degradando a OpenAI nano`);
    }

    const msgs = [...history, { role: 'user' as const, content: userMessage }];

    for (const provider of order) {
      try {
        if (provider === 'claude' && this.anthropic) {
          const t0 = Date.now();
          const resp = await this.anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 400,
            system: systemPrompt,
            messages: msgs.map((m) => ({ role: m.role, content: m.content })),
          });
          const text = resp.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('')
            .trim();
          const u = resp.usage;
          const cost = (u?.input_tokens || 0) * TEXT_PRICING.claude.in + (u?.output_tokens || 0) * TEXT_PRICING.claude.out;
          this.budget.record(cost);
          this.logger.log(`[claude] ${text.length} chars en ${Date.now() - t0}ms (in=${u?.input_tokens} out=${u?.output_tokens} ~$${cost.toFixed(4)})`);
          if (text) return text;
        } else {
          const t0 = Date.now();
          const resp = await this.openai.chat.completions.create({
            model: OPENAI_MODEL,
            max_completion_tokens: 250,
            messages: [{ role: 'system', content: systemPrompt }, ...msgs],
          });
          const text = (resp.choices[0]?.message?.content || '').trim();
          const u = resp.usage;
          const cost = (u?.prompt_tokens || 0) * TEXT_PRICING.openai.in + (u?.completion_tokens || 0) * TEXT_PRICING.openai.out;
          this.budget.record(cost);
          this.logger.log(`[openai] ${text.length} chars en ${Date.now() - t0}ms (in=${u?.prompt_tokens} out=${u?.completion_tokens} ~$${cost.toFixed(4)})`);
          if (text) return text;
        }
      } catch (err) {
        this.logger.error(`[llm:${provider}] error: ${(err as Error).message} — probando siguiente proveedor`);
      }
    }
    throw new Error('todos los proveedores LLM fallaron');
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
    opts?: { lang?: SupportedLang; audience?: Audience },
  ): Promise<string | null> {
    // ⚠️ AWAIT obligatorio.
    //
    // Antes este llamado era fire-and-forget (sin await). Para userIds que
    // YA existían en Mongo no hacía diferencia porque getOrCreate hitea el
    // cache y devuelve la misma instancia. Pero para userIds NUEVOS (caso
    // típico del chat anónimo público — cada sesión genera un userId
    // distinto `web_anon_*`), ocurre esta race condition:
    //
    //   1) addMessage() arranca → su `await getOrCreate` golpea mongo
    //   2) respond() continúa → su propio `await getOrCreate` golpea mongo
    //      en paralelo
    //   3) Ninguno encuentra el doc → AMBOS crean conv objects distintos
    //      (con timestamps `Date.now()` diferentes)
    //   4) El último en hacer `this.conversations.set(userId, conv)`
    //      sobrescribe el cache
    //   5) addMessage.push() empuja su msg al conv "A"
    //      respond lee del cache el conv "B" → messages vacío
    //   6) Bot devuelve "Disculpa, no recibí tu mensaje" aunque el user
    //      sí escribió algo. Es invisible en logs porque el msg sí se
    //      persistió en mongo (vía la otra rama del race).
    //
    // El await asegura que addMessage termine ANTES de que respond llame a
    // getOrCreate — la segunda llamada hitea el cache poblado por la primera.
    await this.conversationService.addMessage(userId, 'user', userMessage);

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
    // Audiencia: rol explícito (JWT del app autenticado) > audiencia ya fijada
    // en la conversación > heurística de intención (canales anónimos). Una vez
    // detectado 'driver', queda fijo para el resto de la conversación.
    let audience: Audience = opts?.audience ?? conv.audience ?? 'passenger';
    if (audience !== 'driver' && detectDriverIntent(userMessage)) {
      audience = 'driver';
    }
    conv.audience = audience;

    const canton = detectCanton(userMessage);
    const baseSystemPrompt = getSystemPrompt(lang, canton, conv.agentGender, audience);

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

    // Guarda de presupuesto: si el gasto del mes superó 1.5× el tope, no
    // gastamos más en IA — derivamos a una persona del equipo por WhatsApp.
    if (this.budget.status() === 'hard') {
      this.logger.warn(`[budget] tope duro superado (~$${this.budget.spent().toFixed(2)} / $${this.budget.budget()}) — derivando a humano`);
      await this.conversationService.requestHandoff(userId, 'Tope de gasto de IA alcanzado', 'NORMAL');
      return lang === 'en'
        ? "We're experiencing very high demand right now. I'm connecting you with our team via WhatsApp so we can help you properly 🙏"
        : 'Estamos con muy alta demanda en este momento. Te conecto con nuestro equipo por WhatsApp para ayudarte mejor 🙏';
    }

    // Historial (user/assistant) sin el último mensaje del usuario, que va aparte.
    const history = allMessages.slice(0, -1).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content.trim(),
    }));

    let assistantMessage = '';
    try {
      assistantMessage = await this.generate(systemPrompt, history, userMessage);
    } catch (error) {
      this.logger.error('LLM error (todos los proveedores fallaron)', error as any);
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
   * get_quote: calcula precio EXACTO usando @going-platform/going-kb (única
   * fuente de verdad). El KB lee de knowledge-base/pricing/ que es editable
   * sin código.
   *
   * Returns shape esperado por Gemini para componer respuesta natural:
   *   {
   *     base_price: 20,
   *     final_price: 24.00,
   *     surcharges: { hora_pico: '+15%', corporativo: '+25%' },
   *     currency: 'USD',
   *     per_seat: true  // (compartido) o false (privado)
   *     revisar: false   // true si la tarifa está pendiente de validación
   *   }
   *
   * Args aceptados (Gemini puede no enviarlos todos):
   *   origen, destino — strings de ciudad/canton (ej. "quito", "ambato")
   *   modalidad       — 'compartido' | 'privado'
   *   vehiculo        — opcional: 'suv'|'suv_xl'|'van'|'minibus'|'bus'
   *                     (default 'suv' que es el más común)
   *   fecha_hora      — opcional: ISO 8601. Default = ahora.
   *   tipo_cliente    — opcional: 'retail'|'corporate'. Default 'retail'.
   *   zona_origen     — opcional: solo aplica para Quito
   *                     ('centro_norte'|'sur'|'cumbaya_tumbaco'|...)
   */
  private toolGetQuote(args: any): any {
    const origenCanton  = normalizeCanton(args.origen);
    const destinoCanton = normalizeCanton(args.destino);
    const modalidad = (args.modalidad === 'privado' ? 'private' : 'shared') as Modality;
    const vehiculo  = normalizeVehicle(args.vehiculo);
    const zonaOrigen = args.zona_origen
      ? String(args.zona_origen).toLowerCase().replace(/\s+/g, '_')
      : undefined;
    const tipoCliente = args.tipo_cliente === 'corporate'
      ? 'corporate' as const
      : 'retail' as const;
    const dateTime = args.fecha_hora ? new Date(args.fecha_hora) : new Date();
    if (isNaN(dateTime.getTime())) {
      return { error: 'fecha_hora inválida — usar formato ISO 8601' };
    }

    // Lookup en el knowledge base (probar ambas direcciones porque
    // muchas rutas son bidireccionales).
    let fare = findRoute({
      origin:      { canton: origenCanton, zone: zonaOrigen },
      destination: { canton: destinoCanton },
      modality:    modalidad,
      vehicle:     vehiculo,
      when:        dateTime,
      clientType:  tipoCliente,
    });

    if (!fare) {
      // Probar dirección inversa (rutas bidireccionales tipo Ibarra↔Otavalo).
      fare = findRoute({
        origin:      { canton: destinoCanton },
        destination: { canton: origenCanton },
        modality:    modalidad,
        vehicle:     vehiculo,
        when:        dateTime,
        clientType:  tipoCliente,
      });
    }

    if (!fare) {
      const sugerencias = listActiveCities()
        .slice(0, 8)
        .map(c => c.name)
        .join(', ');
      return {
        error: 'ruta_no_listada',
        message:
          `No tengo tarifa para ${origenCanton} → ${destinoCanton} en modalidad ${modalidad}, ` +
          `vehículo ${vehiculo}. Ciudades cubiertas: ${sugerencias}...`,
      };
    }

    // Componer surcharges en formato humano (para que Gemini explique al
    // cliente). Solo incluir los que realmente suman.
    const surcharges: Record<string, string> = {};
    for (const item of fare.breakdown) {
      if (item.type === 'base') continue;
      const tag = surchargeTag(item.type);
      if (item.multiplier && item.multiplier !== 1) {
        surcharges[tag] = `+${((item.multiplier - 1) * 100).toFixed(0)}% (${item.label})`;
      } else if (item.amount_usd !== 0) {
        const sign = item.amount_usd > 0 ? '+' : '';
        surcharges[tag] = `${sign}$${item.amount_usd.toFixed(2)} (${item.label})`;
      }
    }

    return {
      origen:         origenCanton,
      destino:        destinoCanton,
      modalidad:      modalidad === 'shared' ? 'compartido' : 'privado',
      vehiculo,
      base_price:     fare.basePrice,
      final_price:    fare.finalPrice,
      surcharges,
      currency:       'USD',
      per_seat:       modalidad === 'shared',
      datetime_used:  dateTime.toISOString(),
      route_id:       fare.routeId,
      revisar:        fare.revisar,
      trusted:        fare.trusted,
    };
  }
}

// ─── Helpers de normalización ──────────────────────────────────────

function normalizeCanton(input: any): string {
  return String(input || '').toLowerCase().trim().replace(/\s+/g, '_');
}

function normalizeVehicle(input: any): VehicleId {
  const v = String(input || 'suv').toLowerCase().replace(/\s+/g, '_');
  const valid: VehicleId[] = ['auto', 'suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus'];
  return (valid.includes(v as VehicleId) ? v : 'suv') as VehicleId;
}

function surchargeTag(type: string): string {
  // Friendly tags que Gemini puede leer y explicar.
  switch (type) {
    case 'origin_zone_surcharge': return 'recargo_zona';
    case 'hora_del_dia':           return 'hora';
    case 'dia_de_la_semana':       return 'dia';
    case 'feriado':                return 'feriado';
    case 'client_type':            return 'tipo_cliente';
    case 'discount':               return 'descuento';
    default:                       return 'otro';
  }
}
