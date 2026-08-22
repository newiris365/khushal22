/**
 * Short-lived token revocation denylist to handle immediate JWT invalidation upon logout (#9)
 */
class TokenDenylist {
  private denylist = new Map<string, number>(); // token -> expiresAt (ms)
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically clean expired tokens every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  add(token: string, ttlSeconds: number = 15 * 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.denylist.set(token, expiresAt);
  }

  has(token: string): boolean {
    const expiresAt = this.denylist.get(token);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.denylist.delete(token);
      return false;
    }
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, expiresAt] of this.denylist.entries()) {
      if (now > expiresAt) {
        this.denylist.delete(token);
      }
    }
  }
}

export const tokenDenylist = new TokenDenylist();
