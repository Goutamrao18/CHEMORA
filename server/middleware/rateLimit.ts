import type { Request, Response, NextFunction } from 'express';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

let sharedRedis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    sharedRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn('⚠️ Could not connect to Upstash Redis for middleware limiter, using memory fallback:', err);
  }
}

export function isRedisConfigured(): boolean {
  return sharedRedis !== null;
}

export interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60,000 ms = 1 minute) */
  windowMs: number;
  /** Maximum number of allowed requests per IP within windowMs */
  max: number;
  /** Custom error message or JSON payload when rate limit is exceeded */
  message?: string | Record<string, any>;
  /** HTTP status code on limit breach (default: 429) */
  statusCode?: number;
  /** Descriptive name for logging / diagnostics */
  name?: string;
  /** Optional custom key generator (defaults to client IP) */
  keyGenerator?: (req: Request) => string;
  /** Optional predicate to skip rate limiting for specific requests */
  skip?: (req: Request) => boolean;
  /** Maximum number of unique keys to hold in memory before aggressive purge (default: 5000) */
  maxTrackedKeys?: number;
  /** In production (NODE_ENV=production), fail closed if Upstash Redis is missing or throws (returns 503) */
  failClosedInProd?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Robustly extracts and normalizes the client IP address from Express requests,
 * accounting for reverse proxies (Vercel, Cloud Run, Nginx), Cloudflare, and IPv6 /64 masking.
 * Fixes RL-01 (X-Forwarded-For spoofing bypass) and RL-08 (IPv6 rotation).
 */
export function getClientIp(req: Request): string {
  // 1. Prefer Vercel's trusted edge client IP header if present
  const vercelIp = req.headers['x-vercel-forwarded-for'];
  if (typeof vercelIp === 'string' && vercelIp.trim().length > 0) {
    return normalizeIp(vercelIp.trim());
  }

  // 2. Prefer Express req.ip when 'trust proxy' is enabled (safely parsed from proxy chain)
  if (req.ip && typeof req.ip === 'string') {
    return normalizeIp(req.ip);
  }

  // 3. Fallback to Cloudflare connecting IP
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim().length > 0) {
    return normalizeIp(cfIp.trim());
  }

  // 4. Fallback to standard real IP header
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim().length > 0) {
    return normalizeIp(realIp.trim());
  }

  // 5. Fallback to socket remote address
  if (req.socket?.remoteAddress) {
    return normalizeIp(req.socket.remoteAddress);
  }

  return '127.0.0.1';
}

export function normalizeIp(ip: string): string {
  let cleaned = ip.trim();
  // Strip IPv4-mapped IPv6 address (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.slice(7);
  }

  // RL-08: IPv6 subnet masking (/64) to prevent rotation abuse
  if (cleaned.includes(':')) {
    const segments = cleaned.split(':');
    if (segments.length >= 4) {
      cleaned = segments.slice(0, 4).join(':') + '::/64';
    }
  }

  // Sanitize to reasonable length to avoid memory exploits
  return cleaned.slice(0, 80) || '127.0.0.1';
}

/**
 * Creates an Express sliding-window rate limiting middleware.
 * Uses distributed Upstash Redis sliding window when configured (RL-02),
 * with graceful in-memory sliding window fallback for local development.
 * Implements standard RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After).
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP. Please try again later.',
    statusCode = 429,
    name = 'rate-limiter',
    keyGenerator = getClientIp,
    skip,
    maxTrackedKeys = 5000,
    failClosedInProd = false,
  } = options;

  let upstashLimiter: Ratelimit | null = null;
  if (sharedRedis) {
    try {
      const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
      upstashLimiter = new Ratelimit({
        redis: sharedRedis,
        limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
        prefix: `rl:${name}`,
      });
    } catch {}
  }

  // Stores timestamps array per client key: Map<key, number[]>
  const hitMap = new Map<string, number[]>();

  // Periodic cleanup to prevent unbounded memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hitMap.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hitMap.delete(key);
      } else {
        hitMap.set(key, valid);
      }
    }

    if (hitMap.size > maxTrackedKeys) {
      let toDelete = hitMap.size - Math.floor(maxTrackedKeys * 0.8);
      for (const key of hitMap.keys()) {
        hitMap.delete(key);
        toDelete--;
        if (toDelete <= 0) break;
      }
    }
  }, Math.min(windowMs, 30_000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    // Always skip CORS preflight checks
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Custom skip rule if defined
    if (skip && skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const isProd = process.env.NODE_ENV === 'production';

    // 1. Try Upstash distributed sliding-window limiter if configured (RL-02)
    if (upstashLimiter) {
      try {
        const result = await upstashLimiter.limit(key);
        const resetInSeconds = Math.max(1, Math.ceil((result.reset - now) / 1000));

        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', Math.max(0, result.remaining));
        res.setHeader('RateLimit-Reset', resetInSeconds);

        if (!result.success) {
          res.setHeader('Retry-After', resetInSeconds);
          const payload =
            typeof message === 'string'
              ? {
                  error: message,
                  retryAfter: resetInSeconds,
                  limit: max,
                  remaining: 0,
                  resetInSeconds,
                  name,
                }
              : {
                  ...message,
                  retryAfter: resetInSeconds,
                  limit: max,
                  remaining: 0,
                  resetInSeconds,
                  name,
                };

          return res.status(statusCode).json(payload);
        }

        return next();
      } catch (redisErr) {
        if (isProd && failClosedInProd) {
          console.error(`[RateLimiter:FailClosed] Upstash error on ${name}:`, redisErr);
          res.setHeader('Retry-After', 60);
          return res.status(503).json({
            error: 'Authentication and security service temporarily unavailable. Please try again later.',
            retryAfter: 60,
          });
        }
        // Fall back gracefully to memory limiter below
      }
    } else if (isProd && failClosedInProd) {
      console.error(`[RateLimiter:FailClosed] Upstash Redis is missing in production for ${name}. Failing closed.`);
      res.setHeader('Retry-After', 60);
      return res.status(503).json({
        error: 'Authentication and security service temporarily unavailable. Please try again later.',
        retryAfter: 60,
      });
    }

    // 2. In-memory sliding window fallback
    const timestamps = hitMap.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    const hitCount = validTimestamps.length;
    const remaining = Math.max(0, max - hitCount);
    const oldestHit = validTimestamps.length > 0 ? validTimestamps[0] : now;
    const resetInSeconds = Math.max(1, Math.ceil((oldestHit + windowMs - now) / 1000));

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, remaining - 1));
    res.setHeader('RateLimit-Reset', resetInSeconds);

    if (hitCount >= max) {
      res.setHeader('Retry-After', resetInSeconds);
      const payload =
        typeof message === 'string'
          ? {
              error: message,
              retryAfter: resetInSeconds,
              limit: max,
              remaining: 0,
              resetInSeconds,
              name,
            }
          : {
              ...message,
              retryAfter: resetInSeconds,
              limit: max,
              remaining: 0,
              resetInSeconds,
              name,
            };

      return res.status(statusCode).json(payload);
    }

    validTimestamps.push(now);
    hitMap.set(key, validTimestamps);
    return next();
  };

  // Attach diagnostic & testing helpers to middleware function
  middleware.reset = (key?: string) => {
    if (key) {
      hitMap.delete(key);
    } else {
      hitMap.clear();
    }
  };

  middleware.getKeyCount = (key: string): number => {
    const now = Date.now();
    const timestamps = hitMap.get(key) || [];
    return timestamps.filter((t) => now - t < windowMs).length;
  };

  middleware.size = (): number => hitMap.size;

  return middleware;
}

/**
 * 1. AI Rate Limiter:
 * Strictly protects expensive LLM generation & vision processing routes (/api/assistant).
 * Limits to 20 requests per minute per IP.
 */
export const aiRateLimiter = createRateLimiter({
  name: 'ai-limiter',
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests / minute
  message: 'Too many AI Assistant requests from this IP. Please wait a minute before submitting further chemistry inquiries.',
});

/**
 * 2. Database Rate Limiter:
 * Protects database storage, Supabase API quotas, and persistent JSON operations
 * across account management and reviews endpoints (/api/account, /api/reviews).
 * Limits to 60 operations per minute per IP.
 */
export const databaseRateLimiter = createRateLimiter({
  name: 'database-limiter',
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests / minute
  message: 'Too many database operations from this IP. Please slow down and try again shortly.',
});

/**
 * 3. Authentication Rate Limiter:
 * High-security rate limiter for sensitive authentication mutations (/api/account/login, /api/account/signup, /api/account/password).
 * Protects against credential stuffing and brute force password guessing attacks.
 * Limits to 10 attempts per 15 minutes per IP.
 */
export const authRateLimiter = createRateLimiter({
  name: 'auth-limiter',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts / 15 minutes (strictly stops brute force within 10 tries)
  failClosedInProd: true, // FAIL CLOSED in production when Upstash is missing or throws
  message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
});

/**
 * 4. General API Rate Limiter:
 * Overarching baseline protection for all /api/* routes against denial of service and automated flooding.
 * Limits to 120 requests per minute per IP.
 */
export const apiRateLimiter = createRateLimiter({
  name: 'api-general-limiter',
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests / minute
  message: 'Too many requests to the CHEMORA API from this IP. Please slow down.',
});
