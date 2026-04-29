# Features — FreeQueue

## Trạng thái dữ liệu (từ PRD v2.0.0)

**Queue states**: `INACTIVE` → `ACTIVE` → `PAUSED` → `CLOSED`

**Ticket states**: `WAITING` → `CALLED` → `SERVING` → `COMPLETED` | `ABSENT` | `CANCELLED`

> Mỗi giai đoạn ticket phải lưu timestamp để phục vụ reporting (wait time = CALLED − WAITING, service time = COMPLETED − SERVING).

---

## Sprint History

### Sprint 1–4: Core Features
- Admin auth (NextAuth v5), dashboard CRUD queues
- Customer join via QR code, ticket display
- Staff interface: session, call next, complete
- Display board (public monitor)

### Sprint 5
- i18n tất cả admin pages (next-intl)
- Logo trong QR code (sharp composite)
- Reports: avg wait/serve time per stream
- LiveMonitor avg wait + avg serve time stats

### Sprint 6
- QR logo fix: bỏ qua `/uploads/` path (Railway không có local files)
- Hardcoded text cleanup (Vietnamese + English)
- Browser language auto-detect (`detectBrowserLocale()`)
- Indonesian locale (8th language: en vi fr es zh tl th id)
- AdBanner placements: customer screen + dashboard sidebar + landing page
- StreamAssignMode: khách chọn luồng trước khi join
- Staff auth unification (`get-staff-user.ts`)

### Sprint 7 (hoàn thành 2026-04-11)
- Đổi tên: QueueApp/QueueDrop → **FreeQueue** (15 files, 8 locale files)
- Email contact: `support@freequeue.app`
- SEO: OG tags + Twitter Card trong `layout.tsx`
- JSON-LD `SoftwareApplication` schema trong `LandingPage.tsx`
- `public/robots.txt`: block `/dashboard/`, `/staff/`, `/api/`
- `src/app/sitemap.ts`: auto-generate `/sitemap.xml`

### Sprint 8 (hoàn thành 2026-04-12) — Tech Spec v1.2.5 Pending Items
- **Pessimistic locking** `SELECT ... FOR UPDATE` trong `ticket.ts` — gapless ticket numbering
- **Redis Pub/Sub SSE fan-out** — `src/lib/redis.ts` + `src/lib/sse-pubsub.ts`, tích hợp vào `sse.ts`
- **HMAC QR signature** — `src/lib/qr-signature.ts`, verify trong `join/route.ts`
- **Rate limiting** 5 req/min — `src/lib/rate-limit.ts` (Redis ZSET + in-memory fallback)
- **Idempotency-Key** TTL 120s — `src/lib/idempotency.ts` (Redis + in-memory fallback)
- **API Response Envelope** `{ success, data, error, meta }` — `src/lib/api-response.ts`
- **Health endpoints** `/api/health/live` + `/api/health/ready` (DB + Redis check)
- **Audit logging** + **PII masking** — `src/lib/audit.ts` + `src/lib/pii.ts`
- **join-service.ts** — extract business logic từ `join/route.ts` để tái sử dụng

### Sprint 9 (hoàn thành 2026-04-12) — Staff Create Ticket + Reassign Counter
- **Staff tạo số thay cho khách** — `POST /api/staff/session/[id]/create-ticket`
  - Tái sử dụng `createTicket()` từ `join-service.ts`, không cần CAPTCHA/rate-limit
  - `deviceId = "STAFF:{sessionId}:{timestamp}"` — mỗi lần tạo là slot riêng, không bị 409
- **Staff chuyển quầy** — `POST /api/staff/session/[id]/reassign-ticket`
  - Cập nhật `staffSessionId` trên Ticket
  - SSE broadcast `ticket:reassigned` tới queue + `session:ticket_assigned` tới session nhận
  - Push notification tới điện thoại khách: "Vui lòng đến quầy {counter}"
- **API peers** — `GET /api/staff/session/[id]/peers` — danh sách quầy ACTIVE cùng queue
- **Split WorkScreen.tsx** (305L → 4 files): `WorkScreen.tsx` / `useWorkScreenActions.ts` / `WorkActions.tsx` / `WorkFooter.tsx`
- **StaffCreateTicketPanel.tsx** — panel tạo số inline (stream selector, tên, SĐT, success state)
- **StaffReassignPanel.tsx** — radio list quầy peer, xác nhận chuyển
- 16 translation keys × 8 locales (en/vi/fr/es/zh/tl/th/id)

## Tính năng hiện có

### Queue Management (Admin)
- Tạo/sửa/xóa queue: tên, slug, prefix vé, logo, streams
- Brand settings: upload logo lên Cloudinary
- Reports: daily stats, customer history, serving time

### Customer Flow
- Scan QR → chọn stream (nếu có) → điền tên/SĐT → nhận vé
- Realtime update: số thứ tự, số người chờ, avg wait time
- Push notification khi sắp đến lượt
- Rating sau khi phục vụ xong

### Staff Interface
- Login riêng (staff auth) → chọn queue + stream → bắt đầu session
- Call next, complete, pause, absent, end session
- Realtime hiển thị mã kiểm tra (check code) bên dưới số thứ tự
- **[Sprint 9]** Tạo số thay cho khách (walk-in) — nút "Tạo số" trên WorkScreen
- **[Sprint 9]** Chuyển quầy — reassign ticket sang quầy khác + push notification tới khách

### Display Board
- Public URL: `/display/[queueId]`
- Hiển thị: số đang phục vụ per stream, số chờ, logo

### System
- 8 ngôn ngữ: EN, VI, FR, ES, ZH, TL, TH, ID
- Auto-detect browser language
- Google AdSense integration (cần set env vars để activate)
- PWA: manifest, service worker, push notifications

## Pending / Backlog

### Kiến trúc (SYSTEM LOCK — phải /split-plan trước)
- Split `QueueWizard.tsx` (1196 dòng) — ưu tiên cao nhất
- Split `LiveMonitor.tsx` (346 dòng)
- Split `CustomerFlow.tsx` (313 dòng)
- ~~Split `WorkScreen.tsx`~~ ✅ Hoàn thành Sprint 9

### Từ Tech Spec v1.2.5
**Đã implement (Sprint 8):** Redis Pub/Sub, Pessimistic locking, HMAC QR, Rate limiting, Idempotency-Key, API Response Envelope, Health endpoints, Audit logging, PII masking

**Còn lại:**
- `__Host-` cookie prefix trong production (§2.1)
- Degraded mode: fallback polling 15s khi Redis lỗi (§4.2)
- DB Partitioning theo tháng (§3.2)

### Ops
- Custom domain setup (Railway → Networking → Custom Domain)
- Google AdSense approval (cần domain thật, không phải *.railway.app)
