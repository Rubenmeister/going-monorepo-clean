import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import {
  AGENT_IDS,
  topicNameForAgent,
} from '@going-platform/cerebro-contracts';
import { EventHandlerService } from './event-handler.service';

/**
 * Suscriptor a las 6 subscriptions del cerebro (una por agente).
 *
 * Convención de naming: la subscription se llama `cerebro-<topic>` —
 * ver scripts/cerebro/bootstrap-pubsub.sh.
 *
 * Diseño:
 *   - Una subscription por agente (no fan-out a una sola), así si un agente
 *     mete spike de eventos no tapa los demás.
 *   - Auth nativa con el SA de Cloud Run (cerebro-service-sa).
 *   - Si CEREBRO_SUBSCRIBE_ENABLED=false, el service arranca pero no
 *     consume — útil para deploys de prueba sin procesar eventos reales.
 */
@Injectable()
export class PubSubSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubSubSubscriberService.name);
  private client?: PubSub;
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly handler: EventHandlerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.get<string>('CEREBRO_SUBSCRIBE_ENABLED') === 'true';
    if (!enabled) {
      this.logger.warn(
        'CEREBRO_SUBSCRIBE_ENABLED!=true — subscriber dormant. Setear true para empezar a consumir eventos.',
      );
      return;
    }

    const projectId = this.config.get<string>('GCP_PROJECT');
    if (!projectId) {
      this.logger.error('GCP_PROJECT no configurado — subscriber no puede arrancar');
      return;
    }

    this.client = new PubSub({ projectId });

    for (const agentId of AGENT_IDS) {
      const topicName = topicNameForAgent(agentId);
      const subName = `cerebro-${topicName}`;
      try {
        const sub = this.client.subscription(subName, {
          flowControl: {
            // Procesamos eventos secuencialmente por agente para mantener
            // orden temporal en el log + Mongo. La carga es muy baja
            // (~1 evento cada 6h-30min), no necesitamos paralelismo.
            maxMessages: 5,
          },
        });

        sub.on('message', (msg: Message) => this.onMessage(msg, topicName));
        sub.on('error', (err: Error) => {
          this.logger.error(`Subscription ${subName} error: ${err.message}`);
        });

        this.subscriptions.push(sub);
        this.logger.log(`✅ Suscrito a ${subName} (topic ${topicName})`);
      } catch (err) {
        this.logger.error(`Fallo suscribiendo a ${subName}: ${(err as Error).message}`);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const sub of this.subscriptions) {
      try {
        await sub.close();
      } catch {/* shutdown best-effort */}
    }
    if (this.client) {
      try {
        await this.client.close();
      } catch {/* shutdown best-effort */}
    }
  }

  /**
   * Handler de mensaje. Decodifica JSON, delega al EventHandler. Si el
   * handler devuelve false (transient error), NACK para que Pub/Sub
   * reintente con backoff. Si devuelve true, ACK.
   */
  private async onMessage(msg: Message, topicName: string): Promise<void> {
    let json: unknown;
    try {
      json = JSON.parse(msg.data.toString('utf8'));
    } catch {
      this.logger.warn(`JSON inválido en topic ${topicName}, ack para descartar`);
      msg.ack();
      return;
    }

    try {
      const ok = await this.handler.handle(json, { topicName });
      if (ok) {
        msg.ack();
      } else {
        msg.nack();
      }
    } catch (err) {
      this.logger.error(
        `Handler exception para ${topicName}: ${(err as Error).message}`,
      );
      msg.nack();
    }
  }
}
