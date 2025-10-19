// Client-side rate limiting utility for API protection
// Prevents excessive calls to external APIs (Gemini, Cloudinary)

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  key: string; // Unique key for this rate limit
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if the request should be allowed
   * @returns true if allowed, false if rate limited
   */
  checkLimit(): boolean {
    const now = Date.now();
    const key = `ratelimit_${this.config.key}`;
    const stored = localStorage.getItem(key);

    let entry: RateLimitEntry;

    if (stored) {
      entry = JSON.parse(stored);

      // Check if window has expired
      if (now > entry.resetTime) {
        // Reset the counter
        entry = { count: 0, resetTime: now + this.config.windowMs };
      }
    } else {
      // First request in this window
      entry = { count: 0, resetTime: now + this.config.windowMs };
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return false; // Rate limited
    }

    // Increment counter and save
    entry.count++;
    localStorage.setItem(key, JSON.stringify(entry));

    return true; // Allowed
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    const key = `ratelimit_${this.config.key}`;
    const stored = localStorage.getItem(key);

    if (!stored) return this.config.maxRequests;

    const entry: RateLimitEntry = JSON.parse(stored);
    const now = Date.now();

    if (now > entry.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get time until reset (in milliseconds)
   */
  getTimeUntilReset(): number {
    const key = `ratelimit_${this.config.key}`;
    const stored = localStorage.getItem(key);

    if (!stored) return 0;

    const entry: RateLimitEntry = JSON.parse(stored);
    const now = Date.now();

    return Math.max(0, entry.resetTime - now);
  }
}

// Pre-configured rate limiters for different services
export const geminiRateLimiter = new RateLimiter({
  maxRequests: 50, // 50 requests per window
  windowMs: 60 * 1000, // 1 minute
  key: 'gemini_api'
});

export const cloudinaryRateLimiter = new RateLimiter({
  maxRequests: 20, // 20 uploads per window
  windowMs: 60 * 1000, // 1 minute
  key: 'cloudinary_api'
});

export const generalApiLimiter = new RateLimiter({
  maxRequests: 100, // 100 general API calls per window
  windowMs: 60 * 1000, // 1 minute
  key: 'general_api'
});