import { Injectable, Logger } from '@nestjs/common';

interface LockoutEntry {
  attempts: number;
  lockedUntil: number | null;
}

@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger('AccountLockout');
  private readonly attempts = new Map<string, LockoutEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  recordFailedAttempt(email: string): void {
    const entry = this.attempts.get(email) ?? { attempts: 0, lockedUntil: null };
    entry.attempts += 1;

    if (entry.attempts >= this.MAX_ATTEMPTS) {
      entry.lockedUntil = Date.now() + this.LOCKOUT_DURATION_MS;
      this.logger.warn(
        `Account locked: ${email} after ${entry.attempts} failed attempts (locked for 15 min)`,
      );
    }

    this.attempts.set(email, entry);
  }

  isLocked(email: string): boolean {
    const entry = this.attempts.get(email);
    if (!entry || !entry.lockedUntil) return false;

    if (Date.now() > entry.lockedUntil) {
      this.attempts.delete(email);
      return false;
    }

    return true;
  }

  getRemainingLockTime(email: string): number {
    const entry = this.attempts.get(email);
    if (!entry || !entry.lockedUntil) return 0;
    const remaining = entry.lockedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  resetAttempts(email: string): void {
    this.attempts.delete(email);
  }
}
