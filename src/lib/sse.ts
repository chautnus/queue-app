// Server-Sent Events channel registry
// In-memory for single-instance deployment.
// For multi-instance: swap Map with Redis pub/sub (ioredis) without changing broadcast() signature.

export type QueueEventType =
  | "ticket:created"
  | "ticket:called"
  | "ticket:serving"
  | "ticket:completed"
  | "ticket:absent"
  | "stats:updated"
  | "session:updated";

export type QueueEvent = {
  type: QueueEventType;
  data: Record<string, unknown>;
};

type Controller = ReadableStreamDefaultController<string>;

const queueChannels = new Map<string, Set<Controller>>();
const sessionChannels = new Map<string, Set<Controller>>();

function subscribe(
  channels: Map<string, Set<Controller>>,
  key: string,
  controller: Controller
) {
  if (!channels.has(key)) channels.set(key, new Set());
  channels.get(key)!.add(controller);
}

function unsubscribe(
  channels: Map<string, Set<Controller>>,
  key: string,
  controller: Controller
) {
  channels.get(key)?.delete(controller);
  if (channels.get(key)?.size === 0) channels.delete(key);
}

function broadcastTo(
  channels: Map<string, Set<Controller>>,
  key: string,
  event: QueueEvent
) {
  const channel = channels.get(key);
  if (!channel) return;

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  const stale: Controller[] = [];

  for (const controller of channel) {
    try {
      controller.enqueue(payload);
    } catch {
      stale.push(controller);
    }
  }

  stale.forEach((c) => channel.delete(c));
}

// Public API

export function subscribeToQueue(queueId: string, controller: Controller) {
  subscribe(queueChannels, queueId, controller);
}

export function unsubscribeFromQueue(queueId: string, controller: Controller) {
  unsubscribe(queueChannels, queueId, controller);
}

export function broadcastToQueue(queueId: string, event: QueueEvent) {
  broadcastTo(queueChannels, queueId, event);
}

export function subscribeToSession(sessionId: string, controller: Controller) {
  subscribe(sessionChannels, sessionId, controller);
}

export function unsubscribeFromSession(
  sessionId: string,
  controller: Controller
) {
  unsubscribe(sessionChannels, sessionId, controller);
}

export function broadcastToSession(sessionId: string, event: QueueEvent) {
  broadcastTo(sessionChannels, sessionId, event);
}

// SSE stream factory helper
export function createSSEStream(
  subscribeFunc: (controller: Controller) => void,
  unsubscribeFunc: (controller: Controller) => void
): Response {
  let controller: Controller;

  const stream = new ReadableStream<string>({
    start(c) {
      controller = c;
      subscribeFunc(controller);
      // Send initial heartbeat
      controller.enqueue(": heartbeat\n\n");
    },
    cancel() {
      unsubscribeFunc(controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
