import { Body, Controller, Get, HttpCode, Logger, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';
import { detectLanguage } from '../knowledge-base/system-prompt';
import { TelegramService } from '../infrastructure/telegram.service';
import { VoiceService } from '../infrastructure/voice.service';

/**
 * Going – Telegram Bot Controller.
 *
 * Webhook único en POST /telegram/webhook que recibe Updates del Bot API.
 * Formato del payload: https://core.telegram.org/bots/api#update
 *
 * Tipos manejados:
 *  - message.text       → respuesta texto
 *  - message.voice      → STT → AgentService → TTS → respuesta audio
 *  - message.location   → tag GPS estándar de Going
 *  - message.contact    → ignorado por ahora
 *
 * Env vars:
 *  - TELEGRAM_BOT_TOKEN       — token del bot (BotFather)
 *  - TELEGRAM_WEBHOOK_SECRET  — opcional; si está, validamos header secret
 */
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly conversationService: ConversationService,
    private readonly telegramService: TelegramService,
    private readonly voiceService: VoiceService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Healthcheck simple para verificar que el bot está deployado.
   * No interfiere con el webhook (que es POST).
   */
  @Get('health')
  health() {
    return { ok: true, hasToken: Boolean(this.config.get<string>('TELEGRAM_BOT_TOKEN')) };
  }

  @Post('webhook')
  @HttpCode(200)
  async handleUpdate(@Body() body: any, @Res() res: any) {
    // Telegram espera 200 rápido; cualquier delay > 30s causa retries duplicados.
    res.status(200).send('OK');

    try {
      // Validación opcional del secret (configurado al hacer setWebhook).
      // Si TELEGRAM_WEBHOOK_SECRET está seteado, validamos header.
      const expectedSecret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
      if (expectedSecret) {
        const provided = (res.req?.headers ?? {})['x-telegram-bot-api-secret-token'];
        if (provided !== expectedSecret) {
          this.logger.warn('Telegram webhook: invalid secret token, ignoring');
          return;
        }
      }

      const message = body?.message;
      if (!message) return; // edited_message, callback_query, etc. — ignored por ahora

      const chatId: number = message.chat?.id;
      if (!chatId) return;

      let messageText = '';
      let wasVoice   = false;

      // ── Tipo: texto ─────────────────────────────────────────────
      if (typeof message.text === 'string') {
        messageText = message.text;

        // Comandos rápidos (no pasan por Gemini, ahorran latencia + tokens).
        const cmd = messageText.trim().toLowerCase();
        if (cmd === '/start') {
          await this.telegramService.sendMessage(
            chatId,
            '¡Bienvenido a Going Ecuador! 🚗\n\n' +
            'Soy el asistente oficial. Puedes pedirme:\n' +
            '• Un viaje (ej. "Quito a Cumbayá")\n' +
            '• Un envío de paquete\n' +
            '• Información de tours, alojamiento o servicios\n' +
            '• Hablar con una persona si lo prefieres\n\n' +
            'O simplemente mándame una nota de voz 🎤 — entiendo audio en español e inglés.\n\n' +
            'Comandos: /help · /chat-id',
          );
          return;
        }
        if (cmd === '/help') {
          await this.telegramService.sendMessage(
            chatId,
            '*Comandos disponibles*\n\n' +
            '/start - mensaje de bienvenida\n' +
            '/chat-id - tu ID de chat (para operadores)\n' +
            '/help - esta ayuda\n\n' +
            'Para todo lo demás, escríbeme en lenguaje natural — texto o audio.',
          );
          return;
        }
        if (cmd === '/chat-id') {
          await this.telegramService.sendMessage(
            chatId,
            `Tu Telegram chat ID es: \`${chatId}\`\n\n` +
            'Si eres operador de Going, pasa este ID al admin para activarte ' +
            'como receptor de escalamientos.',
          );
          return;
        }
      }
      // ── Tipo: ubicación ─────────────────────────────────────────
      else if (message.location) {
        const { latitude, longitude } = message.location;
        const label = message.venue?.title ?? '';
        messageText = `[UBICACION_GPS:lat=${latitude},lng=${longitude},label=${label}]`;
        this.logger.log(`Telegram GPS from ${chatId}: ${latitude},${longitude}`);
      }
      // ── Tipo: voice (OGG_OPUS, hasta ~1 min) ────────────────────
      else if (message.voice?.file_id) {
        wasVoice = true;
        await this.telegramService.sendChatAction(chatId, 'typing');
        const audio = await this.telegramService.downloadFile(message.voice.file_id);
        if (!audio) {
          await this.telegramService.sendMessage(chatId, 'No pude descargar tu audio. Intenta de nuevo.');
          return;
        }
        messageText = await this.voiceService.transcribe(audio);
        if (!messageText) {
          await this.telegramService.sendMessage(chatId, 'No pude entender el audio 🎤 Por favor escribe tu mensaje. / I couldn\'t understand the audio. Please type your message.');
          return;
        }
        this.logger.log(`Telegram audio transcribed for ${chatId}: "${messageText.slice(0, 80)}"`);
      }
      // ── Tipo: audio file (no voice note) ────────────────────────
      else if (message.audio?.file_id) {
        wasVoice = true;
        const audio = await this.telegramService.downloadFile(message.audio.file_id);
        if (audio) messageText = await this.voiceService.transcribe(audio);
        if (!messageText) {
          await this.telegramService.sendMessage(chatId, 'No pude entender el audio. Por favor escribe tu mensaje.');
          return;
        }
      }
      else {
        this.logger.log(`Unsupported Telegram message from ${chatId}: ${Object.keys(message).join(',')}`);
        return;
      }

      messageText = messageText.trim();
      if (!messageText) return;

      this.logger.log(`Incoming TG message from ${chatId}: "${messageText.slice(0, 50)}"`);

      // userId persistente por chat de Telegram. Prefijo `tg:` para no
      // colisionar con números de WhatsApp (que son numéricos también).
      const userId = `tg:${chatId}`;

      const conv = await this.conversationService.getOrCreate(userId, 'telegram');
      if (conv.state === 'HUMAN_ACTIVE') return;

      await this.telegramService.sendChatAction(chatId, wasVoice ? 'record_voice' : 'typing');

      const reply = await this.agentService.respond(userId, messageText);

      if (wasVoice) {
        const lang = detectLanguage(messageText);
        const audio = await this.voiceService.synthesize(reply, lang, conv.agentGender);
        if (audio) {
          const sent = await this.telegramService.sendVoice(chatId, audio);
          if (sent) return;
        }
        // Fallback a texto si TTS o sendVoice fallan
        await this.telegramService.sendMessage(chatId, reply);
      } else {
        await this.telegramService.sendMessage(chatId, reply);
      }

    } catch (err) {
      this.logger.error('Error processing Telegram update', err);
    }
  }

  /**
   * Endpoint helper para registrar el webhook tras deploy. Llamar una vez:
   *   POST /telegram/setup-webhook?url=https://customer-support-service-...run.app
   * (le pega el path /telegram/webhook al url base que pases).
   *
   * Protegido por TELEGRAM_WEBHOOK_SECRET — si no está seteado, devuelve 403.
   */
  @Post('setup-webhook')
  async setupWebhook(@Query('url') baseUrl: string, @Query('secret') secret?: string) {
    const expectedSecret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!expectedSecret || secret !== expectedSecret) {
      return { ok: false, error: 'Unauthorized — TELEGRAM_WEBHOOK_SECRET required' };
    }

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
    if (!baseUrl)   return { ok: false, error: 'Missing ?url= query param' };

    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/telegram/webhook`;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: expectedSecret,
        allowed_updates: ['message'],
      }),
    });
    const data = await res.json();
    return { ok: res.ok, data, webhookUrl };
  }
}
