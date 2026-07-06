import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ConversationService, type Audience } from './conversation.service';
import { getSystemPrompt, detectLanguage, detectCanton, SupportedLang } from '../knowledge-base/system-prompt';
import { detectDriverIntent } from '../knowledge-base/driver-support';
import { BudgetService, TEXT_PRICING } from '../infrastructure/budget.service';
import { VertexTranslateService } from '../infrastructure/vertex-translate.service';

// Idiomas "cola larga": el agente responde en ES y Gemini-Vertex traduce.
// es/en tienen prompts dedicados (no se traducen).
const PIVOT_LANGS: SupportedLang[] = ['fr', 'de', 'qu'];
import { LocationService } from '../knowledge-base/location.service';
import { BookingService } from '../booking/booking.service';
import {
  findRoute,
  listActiveCities,
  consultarConocimiento,
  getRentalQuote,
  getShippingQuote,
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
// gpt-4.1-mini (subido desde nano 3-jul): sigue mucho mejor las instrucciones
// (menos alucinación de cifras, menos voseo). Sigue barato para soporte y dentro
// del tope mensual. Revertir a 'gpt-4.1-nano' si el costo se vuelve un problema.
const OPENAI_MODEL = 'gpt-4.1-mini';
// Claude primario (decisión Rubén 30-jun). Going está construido con Claude.
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// Herramienta get_quote para OpenAI function-calling. El system prompt YA
// instruye "llama a get_quote" (PASO 6 / REGLA CRÍTICA), pero antes no existía
// la tool → el agente prometía cotizar sin poder. Esto la conecta de verdad;
// el precio sale de toolGetQuote() → @going-platform/going-kb (única fuente).
// Claude usa otro formato (tool_use / input_schema); ya está cableado en la rama
// Claude vía ANTHROPIC_TOOLS (derivado de estas defs) — el modelo PRIMARIO también
// cotiza y consulta la KB en vivo, no solo el fallback OpenAI.
const GET_QUOTE_TOOL_OPENAI = {
  type: 'function' as const,
  function: {
    name: 'get_quote',
    description:
      'Calcula el precio EXACTO de un viaje Going entre dos ciudades/cantones de Ecuador. ' +
      'LLÁMALA DE INMEDIATO en cuanto el usuario pida un precio/tarifa/cuánto cuesta una ruta, ' +
      'con lo que ya tengas (origen, destino, modalidad). NO pidas fecha ni número de pasajeros ' +
      'para cotizar: no afectan el precio (privado = vehículo completo; compartido = por asiento). ' +
      'Si mencionan el aeropuerto de Quito, pasa origen "aeropuerto quito". Para empresas usa ' +
      'tipo_cliente "corporate". NUNCA inventes precios: el número SIEMPRE viene de esta herramienta.',
    parameters: {
      type: 'object',
      properties: {
        origen:       { type: 'string', description: 'Ciudad o cantón de origen, ej. "santo domingo", "quito"' },
        destino:      { type: 'string', description: 'Ciudad o cantón de destino' },
        modalidad:    { type: 'string', enum: ['compartido', 'privado'], description: 'compartido (por asiento) o privado (vehículo completo)' },
        vehiculo:     { type: 'string', description: 'opcional: suv(4)|suv_xl(5)|van(7)|van_xl(12)|minibus(20)|bus(30)|bus_40(40). Si piden un bus de 40 usa bus_40. Default suv.' },
        fecha_hora:   { type: 'string', description: 'opcional: fecha/hora ISO 8601; default ahora' },
        tipo_cliente: { type: 'string', enum: ['retail', 'corporate'], description: 'opcional; default retail' },
      },
      required: ['origen', 'destino', 'modalidad'],
    },
  },
};

// Herramienta de renta de vehículo por tiempo (chofer incluido).
const RENTAL_TOOL_OPENAI = {
  type: 'function' as const,
  function: {
    name: 'get_rental_quote',
    description:
      'Cotiza la RENTA de un vehículo por tiempo (con chofer). Dos modos: ' +
      '"local" = dentro de la misma ciudad, por horas (unidad: hora, medio_dia o dia); ' +
      '"por_dias" = a otra ciudad, indica origen, destino y días. ' +
      'Úsala cuando pidan alquilar/rentar un vehículo por horas o días, un tour, o "todo el día". NUNCA inventes.',
    parameters: {
      type: 'object',
      properties: {
        vehiculo: { type: 'string', enum: ['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus', 'bus_40'], description: 'suv/suv_xl/van=pequeño, van_xl/minibus=mediano, bus/bus_40=grande.' },
        modo: { type: 'string', enum: ['local', 'por_dias'], description: 'local (por horas en la ciudad) o por_dias (a otra ciudad).' },
        unidad: { type: 'string', enum: ['hora', 'medio_dia', 'dia'], description: 'Solo modo local. Default dia.' },
        origen: { type: 'string', description: 'Solo por_dias. Ciudad de origen (default Quito).' },
        destino: { type: 'string', description: 'Solo por_dias. Ciudad de destino.' },
        dias: { type: 'number', description: 'Solo por_dias. Número de días (default 1).' },
      },
      required: ['vehiculo', 'modo'],
    },
  },
};

// Herramienta de envío de paquetes (interurbano, plano por tamaño).
const SHIPPING_TOOL_OPENAI = {
  type: 'function' as const,
  function: {
    name: 'get_shipping_quote',
    description:
      'Cotiza el ENVÍO de un paquete (crowdshipping interurbano, puerta a puerta). ' +
      'El precio es PLANO por tamaño e igual para cualquier ruta. Úsala cuando pregunten cuánto cuesta enviar/mandar un paquete o encomienda. ' +
      'Pasa el tamaño (pequeno/mediano/grande) o el peso en kg. NUNCA inventes.',
    parameters: {
      type: 'object',
      properties: {
        tamano: { type: 'string', enum: ['pequeno', 'mediano', 'grande'], description: 'pequeno (0-5kg), mediano (6-15kg), grande (16-30kg).' },
        peso_kg: { type: 'number', description: 'Peso del paquete en kg (si no sabes el tamaño, lo infiere).' },
      },
      required: [],
    },
  },
};

// Herramienta de conocimiento: turismo/historia/geografía, faq, políticas,
// legal y guías (inscripción/apps). Lee el Centro de Información Going.
const CONSULTAR_TOOL_OPENAI = {
  type: 'function' as const,
  function: {
    name: 'consultar_conocimiento',
    description:
      'Consulta el Centro de Información de Going para responder con datos reales sobre: ' +
      'turismo, historia y geografía de una CIUDAD (tema "turismo" + ciudad); preguntas frecuentes ("faq"); ' +
      'políticas de cancelación, reembolsos, mascotas, corporativo ("politicas"); términos y privacidad ("legal"); ' +
      'y cómo inscribirse o descargar la app ("guias"). Úsala SIEMPRE que pregunten por estos temas, en vez de inventar.',
    parameters: {
      type: 'object',
      properties: {
        tema: {
          type: 'string',
          enum: ['turismo', 'faq', 'politicas', 'legal', 'guias'],
          description: 'Tema a consultar.',
        },
        ciudad: {
          type: 'string',
          description: 'Solo para tema "turismo": nombre de la ciudad (ej. "Quito", "Baños", "Cuenca", "Otavalo").',
        },
      },
      required: ['tema'],
    },
  },
};

// Mismas 4 herramientas en formato Anthropic (name + description + input_schema).
// Se derivan de las defs OpenAI para no duplicar los esquemas → una sola fuente.
const ANTHROPIC_TOOLS: Anthropic.Tool[] = [
  GET_QUOTE_TOOL_OPENAI,
  RENTAL_TOOL_OPENAI,
  SHIPPING_TOOL_OPENAI,
  CONSULTAR_TOOL_OPENAI,
].map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters as Anthropic.Tool.InputSchema,
}));

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
    private vertexTranslate: VertexTranslateService,
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
        const text =
          provider === 'claude' && this.anthropic
            ? await this.generateClaude(systemPrompt, msgs)
            : await this.generateOpenAI(systemPrompt, msgs);
        if (text) return text;
      } catch (err) {
        this.logger.error(`[llm:${provider}] error: ${(err as Error).message} — probando siguiente proveedor`);
      }
    }
    throw new Error('todos los proveedores LLM fallaron');
  }

  /**
   * Claude con tool-use (get_quote, renta, envíos, consultar_conocimiento).
   * Bucle igual que OpenAI: si el modelo pide una tool, la ejecutamos, le
   * devolvemos el tool_result y volvemos a llamar para que redacte con el dato
   * real. Máx 3 vueltas (guard anti-loop). Antes Claude (el PRIMARIO) respondía
   * SIN tools → no cotizaba ni consultaba la KB salvo que cayera a OpenAI.
   */
  private async generateClaude(
    systemPrompt: string,
    msgs: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = msgs.map((m) => ({ role: m.role, content: m.content }));
    for (let round = 0; round < 3; round++) {
      const t0 = Date.now();
      const resp = await this.anthropic!.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        // Prompt caching: el system prompt (~6k tokens, estable por idioma/
        // audiencia) se cachea (ephemeral, TTL ~5min) → Claude ~10× más barato
        // en mensajes seguidos con el mismo prompt.
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages,
        tools: ANTHROPIC_TOOLS,
      });
      const u: any = resp.usage;
      const inP = TEXT_PRICING.claude.in;
      const freshIn = u?.input_tokens || 0;
      const cacheW = u?.cache_creation_input_tokens || 0; // escritura: 1.25× input
      const cacheR = u?.cache_read_input_tokens || 0;     // lectura: 0.10× input
      const cost =
        freshIn * inP + cacheW * inP * 1.25 + cacheR * inP * 0.1 + (u?.output_tokens || 0) * TEXT_PRICING.claude.out;
      this.budget.record(cost);

      const toolUses = resp.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );
      if (resp.stop_reason === 'tool_use' && toolUses.length > 0) {
        // El modelo pidió herramientas: adjuntamos su turno + los tool_result.
        messages.push({ role: 'assistant', content: resp.content });
        const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
          const result = this.executeTool(tu.name, tu.input as any);
          this.logger.log(`[claude:tool] ${tu.name}(${JSON.stringify(tu.input)}) → ${JSON.stringify(result).slice(0, 160)}`);
          return { type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) };
        });
        messages.push({ role: 'user', content: results });
        continue; // siguiente vuelta: el modelo redacta con el resultado
      }

      const text = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
      this.logger.log(`[claude] ${text.length} chars en ${Date.now() - t0}ms (in=${freshIn} cacheW=${cacheW} cacheR=${cacheR} out=${u?.output_tokens} ~$${cost.toFixed(4)}) round=${round}`);
      return text;
    }
    this.logger.warn('[claude] máx vueltas de tool alcanzado sin respuesta final');
    return '';
  }

  /**
   * OpenAI con function-calling (get_quote). Bucle: si el modelo pide la tool,
   * la ejecutamos, le devolvemos el resultado y volvemos a llamar para que
   * componga la respuesta con el precio real. Máx 3 vueltas (guard anti-loop).
   */
  private async generateOpenAI(
    systemPrompt: string,
    msgs: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    const messages: any[] = [{ role: 'system', content: systemPrompt }, ...msgs];
    for (let round = 0; round < 3; round++) {
      const t0 = Date.now();
      const resp = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_completion_tokens: 300,
        messages,
        tools: [GET_QUOTE_TOOL_OPENAI, RENTAL_TOOL_OPENAI, SHIPPING_TOOL_OPENAI, CONSULTAR_TOOL_OPENAI],
        tool_choice: 'auto',
      });
      const u = resp.usage;
      const cost = (u?.prompt_tokens || 0) * TEXT_PRICING.openai.in + (u?.completion_tokens || 0) * TEXT_PRICING.openai.out;
      this.budget.record(cost);
      const choice = resp.choices[0]?.message;
      if (!choice) return '';

      const toolCalls = choice.tool_calls ?? [];
      if (toolCalls.length > 0) {
        // El modelo pidió herramientas: adjuntamos su turno + los resultados.
        messages.push(choice);
        for (const tc of toolCalls) {
          if (tc.type !== 'function') continue;
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments || '{}'); } catch { /* args vacío */ }
          const result = this.executeTool(tc.function.name, args);
          this.logger.log(`[openai:tool] ${tc.function.name}(${tc.function.arguments}) → ${JSON.stringify(result).slice(0, 160)}`);
          messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        }
        continue; // siguiente vuelta: el modelo redacta con el resultado
      }

      const text = (choice.content || '').trim();
      this.logger.log(`[openai] ${text.length} chars en ${Date.now() - t0}ms (in=${u?.prompt_tokens} out=${u?.completion_tokens} ~$${cost.toFixed(4)}) round=${round}`);
      return text;
    }
    this.logger.warn('[openai] máx vueltas de tool alcanzado sin respuesta final');
    return '';
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

    // Pivote de traducción: si el idioma es fr/de/qu y Vertex está activo, el
    // agente responde en ESPAÑOL y luego traducimos con Gemini (mejor calidad).
    const usePivot = PIVOT_LANGS.includes(lang) && this.vertexTranslate.enabled;
    const promptLang: SupportedLang = usePivot ? 'es' : lang;

    const canton = detectCanton(userMessage);
    const baseSystemPrompt = getSystemPrompt(promptLang, canton, conv.agentGender, audience);

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

    // Normal response — para fr/de/qu traducimos desde ES con Gemini-Vertex.
    if (usePivot) {
      const translated = await this.vertexTranslate.translate(assistantMessage, lang);
      if (translated) assistantMessage = translated;
      else this.logger.warn(`[pivot] traducción a ${lang} no disponible — devuelvo español`);
    }
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
        case 'consultar_conocimiento':
          return consultarConocimiento(args?.tema, args?.ciudad);
        case 'get_rental_quote':
          return this.toolGetRental(args);
        case 'get_shipping_quote':
          return getShippingQuote(args?.tamano, typeof args?.peso_kg === 'number' ? args.peso_kg : undefined);
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
  /** Adaptador de get_rental_quote → going-kb.getRentalQuote (normaliza args). */
  private toolGetRental(args: any): any {
    const vehicle = normalizeVehicle(args?.vehiculo);
    const mode = args?.modo === 'por_dias' ? 'por_dias' : 'local';
    if (mode === 'local') {
      const unit = ['hora', 'medio_dia', 'dia'].includes(args?.unidad) ? args.unidad : 'dia';
      return getRentalQuote({ vehicle, mode: 'local', unit });
    }
    let originCanton = normalizeCanton(args?.origen) || 'quito';
    let zone: string | undefined;
    if (originCanton.includes('aeropuerto')) { originCanton = 'quito'; zone = 'aeropuerto'; }
    const destino = normalizeCanton(args?.destino);
    const days = Math.max(1, parseInt(String(args?.dias), 10) || 1);
    return getRentalQuote({ vehicle, mode: 'por_dias', days, origin: { canton: originCanton, zone }, destination: { canton: destino } });
  }

  private toolGetQuote(args: any): any {
    let origenCanton  = normalizeCanton(args.origen);
    const destinoCanton = normalizeCanton(args.destino);
    const modalidad = (args.modalidad === 'privado' ? 'private' : 'shared') as Modality;
    const vehiculo  = normalizeVehicle(args.vehiculo);
    let zonaOrigen = args.zona_origen
      ? String(args.zona_origen).toLowerCase().replace(/\s+/g, '_')
      : undefined;
    // Si el origen menciona aeropuerto, es la zona 'aeropuerto' de Quito
    // (la matriz guarda esas rutas como { canton: quito, zone: aeropuerto }).
    if (origenCanton.includes('aeropuerto')) { origenCanton = 'quito'; zonaOrigen = 'aeropuerto'; }
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
  const valid: VehicleId[] = ['auto', 'suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus', 'bus_40'];
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
