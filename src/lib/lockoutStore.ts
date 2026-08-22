/**
 * Self-cleaning account lockout store to prevent unbounded memory growth (#7)
 */
interface LockoutEntry {
  count: number;
  lockUntil: number;
  lastAttempt: number;
}

class LockoutStore {
  private attempts = new Map<string, LockoutEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically sweep entries older than 30 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  get(email: string): LockoutEntry | undefined {
    const entry = this.attempts.get(email);
    if (!entry) return undefined;

    const now = Date.now();
    // If lock duration has expired and no attempt in 30 mins, clear record
    if (entry.lockUntil < now && now - entry.lastAttempt > 30 * 60 * 1000) {
      this.attempts.delete(email);
      return undefined;
    }
    return entry;
  }

  recordFailure(email: string, lockoutMinutes: number = 30, maxAttempts: number = 5): { isLocked: boolean; attemptsCount: number; lockUntil: number } {
    const now = Date.now();
    const current = this.get(email) || { count: 0, lockUntil: 0, lastAttempt: now };
    const newCount = current.count + 1;

    if (newCount >= maxAttempts) {
      const lockUntil = now + lockoutMinutes * 60 * 1000;
      const entry: LockoutEntry = {
        count: newCount,
        lockUntil,
        lastAttempt: now
      };
      this.attempts.set(email, entry);
      return { isLocked: true, attemptsCount: newCount, lockUntil };
    } else {
      const entry: LockoutEntry = {
        count: newCount,
        lockUntil: 0,
        lastAttempt: now
      };
      this.attempts.set(email, entry);
      return { isLocked: false, attemptsCount: newCount, lockUntil: 0 };
    }
  }

  clear(email: string): void {
    this.attempts.delete(email);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [email, entry] of this.attempts.entries()) {
      if (entry.lockUntil < now && now - entry.lastAttempt > 30 * 60 * 1000) {
        this.attempts.delete(email);
      }
    }
  }
}

export const loginLockoutStore = new LockoutStore();
