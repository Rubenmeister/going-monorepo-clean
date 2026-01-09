import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

describe('PrismaHealthIndicator', () => {
  let indicator: PrismaHealthIndicator;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    indicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  it('should return healthy if prisma query succeeds', async () => {
    (prismaService.$queryRaw as jest.Mock).mockResolvedValue([1]);
    const result = await indicator.isHealthy('prisma');
    expect(result).toEqual({ prisma: { status: 'up' } });
  });

  it('should throw HealthCheckError if prisma query fails', async () => {
    const error = new Error('Connection failed');
    (prismaService.$queryRaw as jest.Mock).mockRejectedValue(error);

    await expect(indicator.isHealthy('prisma')).rejects.toThrow(HealthCheckError);
  });

  it('should skip check if prisma is not available', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: null,
        },
      ],
    }).compile();

    const standaloneIndicator = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    const result = await standaloneIndicator.isHealthy('prisma');
    expect(result).toEqual({
      prisma: {
        status: 'up',
        message: 'Prisma not available, skipping check',
      },
    });
  });
});
