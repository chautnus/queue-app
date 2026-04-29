# Architecture — FreeQueue

## Cấu trúc thư mục

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, Register (admin)
│   ├── about/ privacy/ terms/  # Public pages
│   ├── api/                    # API routes
│   │   ├── auth/               # Admin NextAuth
│   │   ├── staff-auth/         # Staff NextAuth
│   │   ├── queues/[id]/        # Queue CRUD + SSE + QR + join
│   │   ├── staff/session/[id]/ # Staff session actions
│   │   ├── tickets/[id]/       # Push notifications + rating
│   │   ├── reports/            # Analytics API
│   │   └── upload/logo/        # Cloudinary upload
│   ├── dashboard/              # Admin dashboard (protected)
│   ├── display/[queueId]/      # Public display board
│   ├── q/[queueId]/            # Customer queue entry
│   ├── staff/                  # Staff interface
│   └── layout.tsx              # Root layout (metadata, AdSense script)
│
├── components/
│   ├── auth/                   # Login/Register forms
│   ├── customer/               # Customer flow UI
│   ├── dashboard/              # Admin dashboard UI
│   ├── layout/                 # DashboardSidebar
│   ├── queue/                  # QueueWizard, LiveMonitor ⚠ SYSTEM LOCK
│   ├── staff/                  # WorkScreen (split Sprint 9), SessionSetup, panels
│   ├── AdBanner.tsx            # Google AdSense banner
│   ├── LandingPage.tsx         # Landing page (JSON-LD, OG)
│   ├── LocaleProvider.tsx      # i18n + browser detect
│   └── PublicFooter.tsx
│
├── lib/
│   ├── auth.ts                 # Admin NextAuth config
│   ├── staff-auth.ts           # Staff NextAuth config
│   ├── get-staff-user.ts       # Checks both auth instances
│   ├── prisma.ts               # Prisma client singleton
│   ├── qr.ts                   # QR generation với sharp
│   ├── qr-signature.ts         # HMAC-SHA256 sign/verify QR URL (Sprint 8)
│   ├── redis.ts                # Redis singleton — ioredis, null-safe (Sprint 8)
│   ├── sse.ts                  # SSE helpers + Redis fan-out bridge
│   ├── sse-pubsub.ts           # Redis Pub/Sub subscriber bridge (Sprint 8)
│   ├── push.ts                 # Web Push VAPID
│   ├── ticket.ts               # Ticket number — pessimistic lock (Sprint 8)
│   ├── join-service.ts         # createTicket() business logic (Sprint 8)
│   ├── api-response.ts         # ok() / fail() response envelope (Sprint 8)
│   ├── rate-limit.ts           # Sliding window — Redis ZSET + Map fallback (Sprint 8)
│   ├── idempotency.ts          # Idempotency-Key TTL 120s (Sprint 8)
│   ├── audit.ts                # Audit logger Staff/Admin actions (Sprint 8)
│   ├── pii.ts                  # PII masking: email, phone (Sprint 8)
│   ├── wait-time.ts            # Avg wait/serve time calc
│   └── validations/            # Zod schemas
│
└── i18n/
    ├── config.ts               # Locales + detectBrowserLocale()
    ├── request.ts              # next-intl server config
    └── locales/                # en vi fr es zh tl th id
```

## SYSTEM LOCK Files (>250 dòng — cần /split-plan trước khi sửa)

| File | Dòng | Ưu tiên split |
|------|------|---------------|
| `src/components/queue/QueueWizard.tsx` | 1196 | 🔴 CAO NHẤT |
| `src/components/queue/LiveMonitor.tsx` | 346 | 🟠 CAO |
| `src/components/customer/CustomerFlow.tsx` | 313 | 🟠 CAO |
| ~~`src/components/staff/WorkScreen.tsx`~~ | ~~305~~ | ✅ Sprint 9 — đã split thành 4 files |
| `src/components/LandingPage.tsx` | 277 | 🟡 TRUNG BÌNH |

**WorkScreen split result (Sprint 9):**
- `WorkScreen.tsx` — 190L (thin orchestrator)
- `useWorkScreenActions.ts` — 113L (custom hook)
- `WorkActions.tsx` — 151L (action buttons + panels)
- `WorkFooter.tsx` — 31L (footer controls)

## Key Patterns

### API Route Auth Guard
```ts
// Admin route: import { auth } from "@/lib/auth"
const session = await auth(); if (!session) return 401;

// Staff route: import { getStaffUser } from "@/lib/get-staff-user"
const staffUser = await getStaffUser(req); if (!staffUser) return 401;
```

## UI Contract — Quick Reference (từ UI Spec v2.0.0)

> Xem chi tiết từng màn hình trong `docs/queueapp-ui-spec.md`. Dùng Quick Jump by Route để đến đúng section.

**Staff Work Screen** — file quan trọng nhất để implement (`src/components/staff/WorkScreen.tsx`):
- `CurrentTicketCard`: display number + verify code + stream name
- `PrimaryActions`: CallNext / Absent / toggle Enter Code
- `ManualVerifyPanel`: số + code + Accept button (Enter to submit)
- `SessionControls`: Pause/Resume + End Session
- States: loading → idle (no ticket) → active → paused (amber banner) → ended (lock all)

**Customer Queue Page** (`/q/[queueId]`):
- States: loading config → queue unavailable → existing ticket → join flow → ticket display
- Push prompt chỉ hiện SAU khi có ticket
- Rating chỉ hiện khi ticket COMPLETED

**Admin Live Monitor** (`/dashboard/queues/[id]`):
- `QueueStatusPanel` + `SummaryCards` + `StreamBreakdownTable` + `ActiveStaffList` + QR cards
- Live indicator: connected / disconnected badge
- Close queue action phải có confirm dialog

---

## Implementation Status

### Sprint 8 — Tech Spec v1.2.5 (✅ Hoàn thành 2026-04-12)

| Item | Spec Ref | File |
|------|----------|------|
| ✅ Redis Pub/Sub SSE fan-out | §1.2 | `lib/redis.ts` + `lib/sse-pubsub.ts` |
| ✅ Pessimistic locking ticket counter | §3.1 | `lib/ticket.ts` |
| ✅ HMAC signature trong QR URL | §2.2 | `lib/qr-signature.ts` |
| ✅ Rate limiting `POST /join` (5 req/min) | §2.2 | `lib/rate-limit.ts` |
| ✅ Idempotency-Key header (TTL 120s) | §2.2 | `lib/idempotency.ts` |
| ✅ API Response Envelope `ok()/fail()` | §4.1 | `lib/api-response.ts` |
| ✅ `/health/ready` + `/health/live` | §4.2 | `api/health/live` + `api/health/ready` |
| ✅ Audit logging Staff/Admin | §5 | `lib/audit.ts` |
| ✅ PII masking trong logs | §5 | `lib/pii.ts` |
| ✅ join-service.ts extract | — | `lib/join-service.ts` |

### Sprint 9 — Staff Features (✅ Hoàn thành 2026-04-12)

| Item | File |
|------|------|
| ✅ WorkScreen.tsx split (4 files) | `components/staff/Work*.tsx` + `useWorkScreenActions.ts` |
| ✅ Staff tạo số thay khách | `api/staff/session/[id]/create-ticket/route.ts` |
| ✅ Staff chuyển quầy + push notification | `api/staff/session/[id]/reassign-ticket/route.ts` |
| ✅ API peers (danh sách quầy active) | `api/staff/session/[id]/peers/route.ts` |
| ✅ StaffCreateTicketPanel UI | `components/staff/StaffCreateTicketPanel.tsx` |
| ✅ StaffReassignPanel UI | `components/staff/StaffReassignPanel.tsx` |
| ✅ SSE event types mới | `ticket:reassigned`, `session:ticket_assigned` |
| ✅ 16 translation keys × 8 locales | `i18n/locales/*.json` |

### Còn lại (Low Priority)

| Item | Spec Ref | Ghi chú |
|------|----------|---------|
| `__Host-` cookie prefix (production) | §2.1 | NextAuth cookie config |
| Degraded mode (Redis fallback polling 15s) | §4.2 | Khi Redis lỗi |
| DB Partitioning theo tháng | §3.2 | Cần khi data lớn |
| Split `QueueWizard.tsx` (1196L) | — | SYSTEM LOCK |
| Split `LiveMonitor.tsx` (346L) | — | SYSTEM LOCK |
| Split `CustomerFlow.tsx` (313L) | — | SYSTEM LOCK |

---

### Logo URL Logic
- Cloudinary URL: hiển thị bình thường
- `/uploads/...` path: bỏ qua (Railway không có local files) — xử lý trong `qr/route.ts`:
  ```ts
  const effectiveLogoUrl = queue.logoUrl?.startsWith("/uploads/") ? null : queue.logoUrl;
  ```

### SSE Pattern
- Server: `src/lib/sse.ts` — `createSSEStream()`, `broadcastToQueue()`
- Client: `useEffect` + `EventSource` trong LiveMonitor, TicketDisplay
