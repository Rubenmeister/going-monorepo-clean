import { AccountLockoutService } from './account-lockout.service';

// ConfigService falso: devuelve el default salvo override explícito. Sin
// REDIS_URL/REDIS_HOST el servicio arranca en modo degradado (sin conexión).
const makeConfig = (overrides: Record<string, unknown> = {}) =>
  ({
    get: jest.fn((key: string, def?: unknown) =>
      key in overrides ? overrides[key] : def
    ),
  }) as never;

// Redis falso en memoria con los métodos que usa el servicio.
function makeFakeRedis() {
  const store = new Map<string, unknown>();
  return {
    store,
    incr: jest.fn(async (k: string) => {
      const v = ((store.get(k) as number) || 0) + 1;
      store.set(k, v);
      return v;
    }),
    expire: jest.fn(async () => 1),
    setEx: jest.fn(async (k: string, _ttl: number, v: unknown) => {
      store.set(k, v);
    }),
    exists: jest.fn(async (k: string) => (store.has(k) ? 1 : 0)),
    ttl: jest.fn(async () => 900),
    del: jest.fn(async (k: string) => {
      store.delete(k);
    }),
    rPush: jest.fn(async () => 1),
    get: jest.fn(async (k: string) => store.get(k) ?? null),
  };
}

describe('AccountLockoutService', () => {
  describe('modo degradado (sin Redis)', () => {
    let service: AccountLockoutService;
    beforeEach(() => {
      service = new AccountLockoutService(makeConfig());
    });

    it('isAccountLocked devuelve false (fail-open)', async () => {
      expect(await service.isAccountLocked('u1')).toBe(false);
    });

    it('recordFailedAttempt no bloquea cuando no hay persistencia', async () => {
      const r = await service.recordFailedAttempt('u1', 'a@b.com', '1.2.3.4');
      expect(r.isLocked).toBe(false);
    });
  });

  describe('con Redis (anti fuerza-bruta)', () => {
    let service: AccountLockoutService;
    let redis: ReturnType<typeof makeFakeRedis>;

    beforeEach(() => {
      service = new AccountLockoutService(makeConfig());
      redis = makeFakeRedis();
      (service as unknown as { redisClient: unknown }).redisClient = redis;
    });

    it('incrementa el contador en cada intento fallido', async () => {
      const r = await service.recordFailedAttempt('u1', 'a@b.com', 'ip');
      expect(r.attemptCount).toBe(1);
      expect(r.isLocked).toBe(false);
    });

    it('bloquea la cuenta al alcanzar el máximo de intentos (5)', async () => {
      let r;
      for (let i = 0; i < 5; i++) {
        r = await service.recordFailedAttempt('u1', 'a@b.com', 'ip');
      }
      expect(r?.attemptCount).toBe(5);
      expect(r?.isLocked).toBe(true);
      expect(r?.lockoutUntil).toBeInstanceOf(Date);
    });

    it('un intento sobre una cuenta ya bloqueada la mantiene bloqueada', async () => {
      redis.store.set('lockout:locked:u1', 'x');
      const r = await service.recordFailedAttempt('u1', 'a@b.com', 'ip');
      expect(r.isLocked).toBe(true);
    });

    it('recordSuccessfulLogin limpia el contador de intentos', async () => {
      await service.recordFailedAttempt('u1', 'a@b.com', 'ip');
      const ok = await service.recordSuccessfulLogin('u1');
      expect(ok).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('lockout:attempts:u1');
    });

    it('unlockAccount elimina el bloqueo y registra auditoría', async () => {
      redis.store.set('lockout:locked:u1', 'x');
      const ok = await service.unlockAccount('u1', 'admin-1');
      expect(ok).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('lockout:locked:u1');
      expect(redis.rPush).toHaveBeenCalled();
    });

    it('isAccountLocked refleja el estado real en Redis', async () => {
      expect(await service.isAccountLocked('u1')).toBe(false);
      redis.store.set('lockout:locked:u1', 'x');
      expect(await service.isAccountLocked('u1')).toBe(true);
    });
  });

  describe('backoff exponencial (calculateLockoutDuration)', () => {
    let service: AccountLockoutService;
    beforeEach(() => {
      service = new AccountLockoutService(makeConfig());
    });
    const calc = (n: number) =>
      (
        service as unknown as {
          calculateLockoutDuration: (n: number) => number;
        }
      ).calculateLockoutDuration(n);

    it('el primer bloqueo dura 15 minutos', () => {
      expect(calc(5)).toBe(15);
    });

    it('crece con cada bloqueo sucesivo (×1.5)', () => {
      // attemptCount=10 → 2 bloqueos → 15*1.5 = 22.5 → 23
      expect(calc(10)).toBe(23);
    });

    it('se topa en 480 minutos (8 horas)', () => {
      expect(calc(1000)).toBe(480);
    });
  });
});
