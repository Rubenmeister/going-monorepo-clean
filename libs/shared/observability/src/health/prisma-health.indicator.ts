import { Injectable, Optional } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(@Optional() private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.prisma) {
      return this.getStatus(key, true, { message: 'Prisma not available, skipping check' });
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false, { message: e.message }),
      );
    }
  }
}
