import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

/**
 * RedisIoAdapter — hace que los emits de Socket.io se propaguen entre PODS vía
 * Redis pub/sub (Redis Labs, autorizado). Sin esto, con >1 instancia de Cloud
 * Run (escala a 10) un pasajero conectado al pod A NO recibía ubicación, ETA,
 * proximidad, 'conductor aceptó' ni 'completado' emitidos desde el pod B —
 * falla silenciosa del tiempo real bajo tráfico (auditoría #3).
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
    // Clientes pub/sub dedicados (persistentes) — distintos del REDIS_CLIENT de
    // comandos (que usa maxRetriesPerRequest:0 / enableOfflineQueue:false).
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
