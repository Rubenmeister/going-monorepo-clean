import { AccountLockoutService } from '@going-monorepo-clean/shared-domain';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;

  beforeEach(() => {
    service = new AccountLockoutService();
  });

  it('should not be locked initially', () => {
    expect(service.isLocked('test@example.com')).toBe(false);
  });

  it('should not lock after fewer than 5 failed attempts', () => {
    for (let i = 0; i < 4; i++) {
      service.recordFailedAttempt('test@example.com');
    }
    expect(service.isLocked('test@example.com')).toBe(false);
  });

  it('should lock after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailedAttempt('test@example.com');
    }
    expect(service.isLocked('test@example.com')).toBe(true);
  });

  it('should return remaining lock time when locked', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailedAttempt('test@example.com');
    }
    const remaining = service.getRemainingLockTime('test@example.com');
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(15 * 60); // 15 minutes max
  });

  it('should return 0 remaining time when not locked', () => {
    expect(service.getRemainingLockTime('test@example.com')).toBe(0);
  });

  it('should reset attempts on successful login', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailedAttempt('test@example.com');
    }
    expect(service.isLocked('test@example.com')).toBe(true);

    service.resetAttempts('test@example.com');
    expect(service.isLocked('test@example.com')).toBe(false);
  });

  it('should track attempts per email independently', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailedAttempt('locked@example.com');
    }
    service.recordFailedAttempt('safe@example.com');

    expect(service.isLocked('locked@example.com')).toBe(true);
    expect(service.isLocked('safe@example.com')).toBe(false);
  });

  it('should unlock after lockout duration expires', () => {
    for (let i = 0; i < 5; i++) {
      service.recordFailedAttempt('test@example.com');
    }
    expect(service.isLocked('test@example.com')).toBe(true);

    // Simulate time passing by manipulating the internal state
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000); // 16 min later

    expect(service.isLocked('test@example.com')).toBe(false);

    jest.restoreAllMocks();
  });
});
