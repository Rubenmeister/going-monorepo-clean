import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

/**
 * RedisIoAdapter — propaga los emits de Socket.io entre PODS vía Redis pub/sub
 * (Redis Labs, autorizado). tracking-service escala a 5 instancias en Cloud Run;
 * sin esto, un pasajero conectado al pod A NO recibía la ubicación del conductor
 * emitida desde el pod B — falla silenciosa del tiempo real bajo tráfico
 * (auditoría Bloque 2 #12). Mismo patrón que transport-service (#3).
 *
 * Degradación gentil: si Redis no conecta, se sigue con el adapter en memoria
 * (funciona con 1 pod) en vez de tumbar el arranque.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(url: string): Promise<void> {
    const pubClient = new Redis(url, { lazyConnect: true, connectTimeout: 5000 });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log('Socket.io Redis adapter listo (propagación multi-pod)');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
