import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }

  async onModuleInit() {
    // Non-blocking connection to allow Cloud Run to start and listen on PORT immediately
    this.logger.log('Initiating non-blocking connection to PostgreSQL database...');
    
    this.$connect()
      .then(() => {
        this.logger.log('Successfully connected to PostgreSQL database');
      })
      .catch((error) => {
        this.logger.error('Failed to connect to PostgreSQL database asynchronously', error);
        // We do not throw here to allow the process to stay alive and listen on PORT.
        // Subsequent database operations will fail if the connection is not established.
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }

  /**
   * Execute operations within a transaction
   * All operations succeed or all fail together
   */
  async executeTransaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
  ): Promise<T> {
    return (this as any).$transaction(fn);
  }

  /**
   * Clean database for testing purposes
   * WARNING: This deletes all data!
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be used in test environment');
    }
    
    const tablenames = await (this as any).$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await (this as any).$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
  }
}
