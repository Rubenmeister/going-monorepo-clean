import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule } from '@going-monorepo-clean/prisma-client';

// Domain Ports
import { I_EXPERIENCE_REPOSITORY } from '@going-monorepo-clean/domains-experience-core';

// Infrastructure Implementations  
import { PrismaExperienceRepository } from './persistence/prisma-experience.repository';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    {
      provide: I_EXPERIENCE_REPOSITORY,
      useClass: PrismaExperienceRepository,
    },
  ],
  exports: [I_EXPERIENCE_REPOSITORY],
})
export class InfrastructureModule {}