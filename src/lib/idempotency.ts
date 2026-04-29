/**
 * Idempotency-Key store with TTL.
 * Prevents duplicate ticket creation when client retries with same key.
 * Uses Redis when available; in-memory Map as fallback.
 * TTL: 120 seconds (per Tech Spec §2.2).
 */
import { getRedisSync } from "@/lib/redis";

const TTL_MS = 120_000;
const TTL_S = 120;
const KEY_PREFIX = "idem:";

type StoredResponse = { status: number; body: unknown };

// In-memory fallback
const _store = new Map<string, { response: StoredResponse; expiresAt: number }>();

/** Check if key was seen and return cached response, or null if first time */
export async function getIdempotentResponse(
  key: string
): Promise<StoredResponse | null> {
  const redis = getRedisSync();

  if (redis) {
    const raw = await redis.get(`${KEY_PREFIX}${key}`).catch(() => null);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredResponse;
    } catch {
      return null;
    }
  }

  // In-memory fallback
  const entry = _store.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    _store.delete(key);
    return null;
  }
  return entry.response;
}

/** Store a response for the given idempotency key */
export async function setIdempotentResponse(
  key: string,
  response: StoredResponse
): Promise<void> {
  const redis = getRedisSync();

  if (redis) {
    await redis
      .set(`${KEY_PREFIX}${key}`, JSON.stringify(response), "EX", TTL_S)
      .catch(() => {});
    return;
  }

  // In-memory fallback with cleanup
  _store.set(key, { response, expiresAt: Date.now() + TTL_MS });
  if (_store.size > 10_000) {
    const now = Date.now();
    for (const [k, v] of _store) {
      if (v.expiresAt < now) _store.delete(k);
    }
  }
}

/** Extract Idempotency-Key header from request */
export function getIdempotencyKey(req: Request): string | null {
  return req.headers.get("idempotency-key");
}
