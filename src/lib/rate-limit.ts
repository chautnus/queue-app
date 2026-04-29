/**
 * Sliding-window rate limiter.
 * Uses Redis ZSET when available; falls back to in-memory Map.
 * Default: 5 requests per 60 seconds per key.
 */
import { getRedisSync } from "@/lib/redis";

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60_000;

// In-memory fallback: key → sorted list of timestamps
const _store = new Map<string, number[]>();

export type RateLimitResult = { allowed: boolean; remaining: number };

export async function checkRateLimit(
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  const redis = getRedisSync();
  if (redis) {
    return redisRateLimit(redis, key, limit, windowMs);
  }
  return memoryRateLimit(key, limit, windowMs);
}

async function redisRateLimit(
  redis: import("ioredis").Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const rkey = `rl:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(rkey, 0, windowStart);
  pipeline.zadd(rkey, now, `${now}-${Math.random()}`);
  pipeline.zcard(rkey);
  pipeline.pexpire(rkey, windowMs);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (_store.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  _store.set(key, timestamps);

  // Periodic cleanup to avoid memory leak
  if (_store.size > 5000) {
    for (const [k, ts] of _store) {
      if (ts[ts.length - 1] < windowStart) _store.delete(k);
    }
  }

  return { allowed: timestamps.length <= limit, remaining: Math.max(0, limit - timestamps.length) };
}

/** Build rate-limit key from IP + optional fingerprint */
export function buildRateLimitKey(ip: string, extra?: string): string {
  return extra ? `${ip}:${extra}` : ip;
}

/** Extract client IP from Next.js request */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
