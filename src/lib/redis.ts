/**
 * Redis singleton — null-safe.
 * When REDIS_URL is not set, all callers degrade gracefully to in-memory fallback.
 */

let _redis: import("ioredis").Redis | null = null;
let _initialized = false;

export async function getRedis(): Promise<import("ioredis").Redis | null> {
  if (_initialized) return _redis;
  _initialized = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const { Redis } = await import("ioredis");
    _redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    _redis.on("error", (err) => {
      // Log but don't crash — app runs degraded without Redis
      console.warn("[redis] connection error:", err.message);
    });

    await _redis.connect();
    console.info("[redis] connected");
    return _redis;
  } catch (err) {
    console.warn("[redis] failed to connect, running without Redis:", (err as Error).message);
    _redis = null;
    return null;
  }
}

/** Synchronous accessor — only safe after getRedis() has been called once */
export function getRedisSync(): import("ioredis").Redis | null {
  return _redis;
}
