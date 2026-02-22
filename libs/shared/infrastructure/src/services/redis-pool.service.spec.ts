import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  RedisPoolService,
  DEFAULT_REDIS_POOL_CONFIG,
  TTL_STRATEGIES,
} from './redis-pool.service';

describe('RedisPoolService', () => {
  let service: RedisPoolService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisPoolService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<RedisPoolService>(RedisPoolService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize service on module init', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      service.onModuleInit();
      expect(loggerSpy).toHaveBeenCalledWith(
        '[Redis] Pool service initialized'
      );
    });

    it('should start health checks', () => {
      const initialIntervalCount = service['statsInterval'].length;
      service.onModuleInit();
      expect(service['statsInterval'].length).toBeGreaterThan(
        initialIntervalCount
      );
    });
  });

  describe('getConfig', () => {
    it('should return current pool configuration', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.maxConnections).toBeDefined();
      expect(config.minIdleConnections).toBeDefined();
    });

    it('should return configuration with all required properties', () => {
      const config = service.getConfig();
      expect(config).toHaveProperty('maxConnections');
      expect(config).toHaveProperty('minIdleConnections');
      expect(config).toHaveProperty('maxRetriesPerRequest');
      expect(config).toHaveProperty('enableReadyCheck');
      expect(config).toHaveProperty('connectionTimeout');
      expect(config).toHaveProperty('commandTimeout');
      expect(config).toHaveProperty('ttlStrategy');
    });

    it('should return a copy of configuration (immutable)', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('getTTL', () => {
    it('should return TTL for driverLocation key type', () => {
      const ttl = service.getTTL('driverLocation');
      expect(ttl).toBeGreaterThan(0);
      expect(typeof ttl).toBe('number');
    });

    it('should return TTL for userSession key type', () => {
      const ttl = service.getTTL('userSession');
      expect(ttl).toBeGreaterThan(0);
    });

    it('should return TTL for rideState key type', () => {
      const ttl = service.getTTL('rideState');
      expect(ttl).toBeGreaterThan(0);
    });

    it('should return TTL for matchingCache key type', () => {
      const ttl = service.getTTL('matchingCache');
      expect(ttl).toBeGreaterThan(0);
    });

    it('should return TTL for tempData key type', () => {
      const ttl = service.getTTL('tempData');
      expect(ttl).toBeGreaterThan(0);
    });

    it('should return default TTL for unknown key type', () => {
      const ttl = service.getTTL('unknownKeyType' as any);
      expect(ttl).toBeGreaterThan(0);
    });

    it('should respect TTL strategy configuration', () => {
      const config = service.getConfig();
      const strategy = config.ttlStrategy;

      const driverLocationTTL = service.getTTL('driverLocation');
      const expectedTTL = TTL_STRATEGIES[strategy || 'balanced'].driverLocation;
      expect(driverLocationTTL).toBe(expectedTTL);
    });
  });

  describe('getStoreOptions', () => {
    it('should return store configuration', () => {
      const options = service.getStoreOptions();
      expect(options).toBeDefined();
      expect(typeof options).toBe('object');
    });

    it('should include connection pool options', () => {
      const options = service.getStoreOptions();
      expect(options).toHaveProperty('maxRetriesPerRequest');
      expect(options).toHaveProperty('enableReadyCheck');
      expect(options).toHaveProperty('enableOfflineQueue');
    });

    it('should include timeout settings', () => {
      const options = service.getStoreOptions();
      expect(options).toHaveProperty('connectTimeout');
      expect(options).toHaveProperty('commandTimeout');
    });

    it('should include retry strategy function', () => {
      const options = service.getStoreOptions();
      expect(options).toHaveProperty('retryStrategy');
      expect(typeof options.retryStrategy).toBe('function');
    });

    it('should include keep-alive interval', () => {
      const options = service.getStoreOptions();
      expect(options).toHaveProperty('keepAlive');
      expect(options.keepAlive).toBeGreaterThan(0);
    });

    it('should have lazyConnect set to false', () => {
      const options = service.getStoreOptions();
      expect(options.lazyConnect).toBe(false);
    });
  });

  describe('retryStrategy in getStoreOptions', () => {
    it('should implement exponential backoff', () => {
      const options = service.getStoreOptions();
      const retryStrategy = options.retryStrategy;

      const delay1 = retryStrategy(1);
      const delay2 = retryStrategy(2);
      const delay3 = retryStrategy(3);

      expect(delay1).toBeLessThan(delay2);
      expect(delay2).toBeLessThan(delay3);
    });

    it('should cap maximum retry delay', () => {
      const options = service.getStoreOptions();
      const retryStrategy = options.retryStrategy;

      const delay10 = retryStrategy(10);
      expect(delay10).toBeLessThanOrEqual(2000);
    });

    it('should return reasonable delays', () => {
      const options = service.getStoreOptions();
      const retryStrategy = options.retryStrategy;

      for (let i = 1; i <= 5; i++) {
        const delay = retryStrategy(i);
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThanOrEqual(2000);
      }
    });
  });

  describe('getRecommendedConfig', () => {
    it('should provide production configuration', () => {
      const config = service.getRecommendedConfig('production');
      expect(config.maxConnections).toBeGreaterThanOrEqual(50);
      expect(config.minIdleConnections).toBeGreaterThanOrEqual(10);
      expect(config.maxRetriesPerRequest).toBeGreaterThanOrEqual(3);
    });

    it('should provide staging configuration', () => {
      const config = service.getRecommendedConfig('staging');
      expect(config.maxConnections).toBeGreaterThanOrEqual(30);
      expect(config.minIdleConnections).toBeGreaterThanOrEqual(5);
    });

    it('should provide development configuration', () => {
      const config = service.getRecommendedConfig('development');
      expect(config.maxConnections).toBeLessThan(50);
      expect(config.minIdleConnections).toBeLessThan(15);
    });

    it('should have proper timeout values for production', () => {
      const config = service.getRecommendedConfig('production');
      expect(config.connectionTimeout).toBeGreaterThanOrEqual(10000);
      expect(config.commandTimeout).toBeGreaterThanOrEqual(5000);
    });

    it('should use conservative TTL strategy for production', () => {
      const config = service.getRecommendedConfig('production');
      expect(config.ttlStrategy).toBe('conservative');
    });

    it('should use balanced TTL strategy for staging', () => {
      const config = service.getRecommendedConfig('staging');
      expect(config.ttlStrategy).toBe('balanced');
    });

    it('should use aggressive TTL strategy for development', () => {
      const config = service.getRecommendedConfig('development');
      expect(config.ttlStrategy).toBe('aggressive');
    });
  });

  describe('TTL Strategies', () => {
    it('should have three TTL strategies defined', () => {
      expect(TTL_STRATEGIES.aggressive).toBeDefined();
      expect(TTL_STRATEGIES.balanced).toBeDefined();
      expect(TTL_STRATEGIES.conservative).toBeDefined();
    });

    it('should have all key types in aggressive strategy', () => {
      const strategy = TTL_STRATEGIES.aggressive;
      expect(strategy.userSession).toBeDefined();
      expect(strategy.driverLocation).toBeDefined();
      expect(strategy.rideState).toBeDefined();
      expect(strategy.matchingCache).toBeDefined();
      expect(strategy.tempData).toBeDefined();
    });

    it('should have longer TTLs in conservative vs aggressive', () => {
      expect(TTL_STRATEGIES.conservative.driverLocation).toBeGreaterThan(
        TTL_STRATEGIES.aggressive.driverLocation
      );
      expect(TTL_STRATEGIES.conservative.userSession).toBeGreaterThan(
        TTL_STRATEGIES.aggressive.userSession
      );
    });

    it('should have reasonable TTL values', () => {
      Object.values(TTL_STRATEGIES).forEach((strategy) => {
        Object.values(strategy).forEach((ttl) => {
          expect(ttl).toBeGreaterThan(0);
          expect(ttl).toBeLessThan(86400); // Less than 24 hours
        });
      });
    });
  });

  describe('DEFAULT_REDIS_POOL_CONFIG', () => {
    it('should have default config defined', () => {
      expect(DEFAULT_REDIS_POOL_CONFIG).toBeDefined();
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_REDIS_POOL_CONFIG.maxConnections).toBeGreaterThan(0);
      expect(DEFAULT_REDIS_POOL_CONFIG.minIdleConnections).toBeGreaterThan(0);
      expect(DEFAULT_REDIS_POOL_CONFIG.connectionTimeout).toBeGreaterThan(0);
      expect(DEFAULT_REDIS_POOL_CONFIG.commandTimeout).toBeGreaterThan(0);
    });

    it('should have pool constraints', () => {
      expect(DEFAULT_REDIS_POOL_CONFIG.minIdleConnections).toBeLessThanOrEqual(
        DEFAULT_REDIS_POOL_CONFIG.maxConnections
      );
    });
  });

  describe('Configuration from environment', () => {
    it('should use ConfigService to get environment values', () => {
      const mockConfigGet = configService.get as jest.Mock;
      mockConfigGet.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'REDIS_MAX_CONNECTIONS') {
          return 75;
        }
        return defaultValue;
      });

      const newService = new RedisPoolService(configService);
      const config = newService.getConfig();

      expect(config.maxConnections).toBe(75);
      expect(mockConfigGet).toHaveBeenCalledWith(
        'REDIS_MAX_CONNECTIONS',
        expect.any(Number)
      );
    });

    it('should fallback to defaults when env vars not set', () => {
      const config = service.getConfig();
      expect(config.maxConnections).toBe(
        DEFAULT_REDIS_POOL_CONFIG.maxConnections
      );
    });
  });

  describe('Health checks', () => {
    it('should clean up intervals on module destroy', () => {
      service.onModuleInit();
      const intervalCount = service['statsInterval'].length;
      expect(intervalCount).toBeGreaterThan(0);

      service.onModuleDestroy();
      // Intervals should be cleared
      expect(service['statsInterval'].length).toBe(0);
    });

    it('should handle health check errors gracefully', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      service.onModuleInit();

      // Intervals run asynchronously, so this is just a setup test
      expect(service).toBeDefined();
    });
  });
});
