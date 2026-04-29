/**
 * Redis Pub/Sub bridge for SSE fan-out across multiple app instances.
 * When Redis is unavailable, publish/subscribe are no-ops
 * and the in-memory channels in sse.ts handle single-instance delivery.
 */
import { getRedis } from "@/lib/redis";
import type { QueueEvent } from "@/lib/sse";

const QUEUE_CHANNEL_PREFIX = "sse:queue:";
const SESSION_CHANNEL_PREFIX = "sse:session:";

type EventHandler = (event: QueueEvent) => void;

// Separate subscriber client (Redis requires dedicated connection for subscribe mode)
let _subscriber: import("ioredis").Redis | null = null;
const _handlers = new Map<string, Set<EventHandler>>();

async function getSubscriber(): Promise<import("ioredis").Redis | null> {
  if (_subscriber) return _subscriber;
  const redis = await getRedis();
  if (!redis) return null;

  _subscriber = redis.duplicate();
  _subscriber.on("message", (channel: string, message: string) => {
    const handlers = _handlers.get(channel);
    if (!handlers) return;
    try {
      const event: QueueEvent = JSON.parse(message);
      handlers.forEach((h) => h(event));
    } catch {
      // malformed message — ignore
    }
  });

  return _subscriber;
}

/** Publish an SSE event to all instances via Redis */
export async function publishEvent(channel: string, event: QueueEvent): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  await redis.publish(channel, JSON.stringify(event)).catch(() => {});
}

/** Subscribe to Redis channel; returns unsubscribe fn */
export async function subscribeChannel(
  channel: string,
  handler: EventHandler
): Promise<() => void> {
  const sub = await getSubscriber();
  if (!sub) return () => {};

  if (!_handlers.has(channel)) {
    _handlers.set(channel, new Set());
    await sub.subscribe(channel).catch(() => {});
  }
  _handlers.get(channel)!.add(handler);

  return () => {
    _handlers.get(channel)?.delete(handler);
    if (_handlers.get(channel)?.size === 0) {
      _handlers.delete(channel);
      sub.unsubscribe(channel).catch(() => {});
    }
  };
}

export function queueChannel(queueId: string) {
  return `${QUEUE_CHANNEL_PREFIX}${queueId}`;
}

export function sessionChannel(sessionId: string) {
  return `${SESSION_CHANNEL_PREFIX}${sessionId}`;
}
