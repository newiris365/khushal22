/**
 * In-memory TTL Cache with automatic expiration and cleanup
 */
export class TTLCache<V = any> {
  private cache = new Map<string, { value: V; expiresAt: number }>();
  private defaultTtlMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(defaultTtlSeconds: number = 60) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    // Clean up expired items every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  get(key: string): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlSeconds?: number): void {
    const ttl = ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.cache.set(key, { value, expiresAt: Date.now() + ttl });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global caches for high-traffic read paths
export const methodConfigCache = new TTLCache<boolean>(60);
export const methodFullConfigCache = new TTLCache<Record<string, any>>(60);
export const holidayCache = new TTLCache<{ isHoliday: boolean; holidayName?: string }>(60);
