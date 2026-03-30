import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  private readonly logger = new Logger(VoiceController.name);

  constructor(private readonly voiceService: VoiceService) {}

  /**
   * Parse text command (no audio needed)
   * POST /voice/command
   */
  @Post('command')
  parseTextCommand(
    @Body() body: { text: string; userId: string; platform?: any },
  ) {
    if (!body.text || !body.userId) {
      throw new BadRequestException('text and userId are required');
    }
    const command = this.voiceService.parseCommand(
      body.text,
      body.userId,
      body.platform || 'WEB_SPEECH',
    );
    return { ok: true, command };
  }

  /**
   * Text-to-speech
   * POST /voice/synthesize
   */
  @Post('synthesize')
  async synthesize(
    @Body() body: { text: string; languageCode?: string },
  ) {
    if (!body.text) throw new BadRequestException('text is required');
    const audioBase64 = await this.voiceService.synthesizeSpeech(
      body.text,
      body.languageCode || 'es-US',
    );
    return { ok: true, audioBase64, mimeType: 'audio/mp3' };
  }

  /**
   * Start conversation session
   * POST /voice/session
   */
  @Post('session')
  createSession(@Body() body: { userId: string }) {
    if (!body.userId) throw new BadRequestException('userId is required');
    const session = this.voiceService.createSession(body.userId);
    return { ok: true, sessionId: session.sessionId };
  }

  /**
   * Get session
   * GET /voice/session/:sessionId
   */
  @Get('session/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    const session = this.voiceService.getSession(sessionId);
    if (!session) throw new BadRequestException('Session not found');
    return { ok: true, session };
  }

  /**
   * Command history for user
   * GET /voice/history?userId=xxx
   */
  @Get('history')
  getHistory(@Query('userId') userId: string, @Query('limit') limit?: string) {
    if (!userId) throw new BadRequestException('userId is required');
    const history = this.voiceService.getCommandHistory(userId, limit ? parseInt(limit) : 50);
    return { ok: true, history };
  }
}
