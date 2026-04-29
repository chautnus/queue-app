# Pending Implementation — Tech Spec v1.2.5

## Module Map

```
src/lib/
├── redis.ts              # Redis singleton (ioredis) — null-safe khi không có REDIS_URL
├── sse-pubsub.ts         # Redis Pub/Sub bridge cho SSE fan-out đa instance
├── sse.ts                # (modify) tích hợp sse-pubsub khi Redis có sẵn
├── ticket.ts             # (modify) pessimistic locking SELECT...FOR UPDATE trong tx
├── join-service.ts       # Business logic tạo ticket (extract từ join route)
├── qr-signature.ts       # HMAC-SHA256 sign/verify URL trong QR payload
├── rate-limit.ts         # Sliding window rate limiter (Redis hoặc in-memory)
├── idempotency.ts        # Idempotency-Key store với TTL 120s
├── api-response.ts       # Response envelope { success, data, error, meta }
├── audit.ts              # Audit log Staff/Admin actions (IP + requestId)
└── pii.ts                # PII masking cho logs

src/app/api/
├── health/
│   ├── ready/route.ts    # GET /health/ready — kiểm tra DB + Redis
│   └── live/route.ts     # GET /health/live — process uptime
└── queues/[id]/
    └── join/route.ts     # (modify) thêm rate-limit, idempotency, HMAC verify
```

## Data Flow

```
POST /api/queues/[id]/join
  │
  ├─ rate-limit.ts       → 429 nếu vượt 5 req/min/IP
  ├─ idempotency.ts      → 200 cached nếu key đã thấy (TTL 120s)
  ├─ qr-signature.ts     → 400 nếu HMAC signature không hợp lệ
  └─ join-service.ts
       ├─ prisma.$transaction
       │    ├─ ticket.ts  → SELECT...FOR UPDATE (gapless numbering)
       │    └─ ticket.create + deviceRegistration.upsert
       └─ sse.ts → broadcastToQueue
            └─ sse-pubsub.ts → Redis PUBLISH (fan-out đa instance)

GET /api/queues/[id]/sse
  └─ sse.ts
       └─ sse-pubsub.ts → Redis SUBSCRIBE → push đến client

Staff/Admin actions
  └─ audit.ts → log { action, userId, ip, requestId, timestamp }
       └─ pii.ts → mask phone/email trước khi log
```

## Env Vars mới cần thêm
```
REDIS_URL=redis://...    # Optional — nếu không có thì dùng in-memory fallback
QR_SECRET=...            # Required khi enable HMAC QR validation
```

## Priority thực thi
1. redis.ts (dependency của các module khác)
2. api-response.ts (dùng trong health routes và join route)
3. ticket.ts — pessimistic locking
4. join-service.ts — extract từ join route
5. sse-pubsub.ts → sse.ts update
6. qr-signature.ts → join route + qr route update
7. rate-limit.ts → join route update
8. idempotency.ts → join route update
9. audit.ts + pii.ts
10. health/ready + health/live routes
