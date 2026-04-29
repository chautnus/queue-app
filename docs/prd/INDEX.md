# PRD Index

| File | Version | Nội dung |
|------|---------|----------|
| [../queueapp-prd-rewritten.md](../queueapp-prd-rewritten.md) | v2.0.0 ✅ | Vision, personas, business rules, user journeys, screen inventory, AC |
| [../queueapp-ui-spec.md](../queueapp-ui-spec.md) | v2.0.0 ✅ | Base components, screen contracts, state-dependent UI, interaction rules |
| [../queueapp-implementation-spec.md](../queueapp-implementation-spec.md) | v1.2.5 | Tech architecture, auth/security, concurrency, API contract, engineering standards |
| [../ADSENSE_SETUP.md](../ADSENSE_SETUP.md) | — | Hướng dẫn cài đặt Google AdSense |
| ~~../queueapp-product-spec_old.md~~ | v1.1.0 legacy | Thay thế bởi PRD v2.0.0 |
| ~~../REQUIREMENTS_old.md~~ | legacy | Thay thế bởi 3 file spec trên |

---

## PRD v2.0.0 — Tóm tắt nhanh

### Business Rules quan trọng
- **Queue states**: `INACTIVE` → `ACTIVE` → `PAUSED` → `CLOSED`
- **Ticket states**: `WAITING` → `CALLED` → `SERVING` → `COMPLETED` / `ABSENT` / `CANCELLED`
- **1 ticket/thiết bị/queue** — duplicate bị chặn theo device
- **Mã verify 4 số** — staff xác thực tại quầy
- **Vé hết hiệu lực cuối ngày** vận hành
- **Stream**: nhóm dịch vụ, prefix riêng (A001, B001…), nhiều counter/stream
- **Custom Fields**: HIDDEN / OPTIONAL / REQUIRED

### Screen Inventory
| Nhóm | Screens |
|------|---------|
| Public | `/`, `/login`, `/register`, `/q/[queueId]`, `/q/[queueId]/guide`, `/display/[queueId]`, `/about`, `/terms`, `/privacy` |
| Admin | `/dashboard/queues`, `/dashboard/queues/new`, `/dashboard/queues/[id]`, `/dashboard/queues/[id]/edit`, `/dashboard/reports`, `/dashboard/brand`, `/dashboard/settings` |
| Staff | `/staff/login`, `/staff/join/[queueId]`, `/staff/work/[sessionId]` |

### Out of Scope (v2.0.0)
Native mobile app, thanh toán, đặt lịch trước, AI staffing forecast, multi-tenant billing, offline-first sync.

### KPIs Báo cáo
avg wait time, avg service time, tickets completed/day, absent rate, active staff count, join conversion rate, rating average.

---

## UI Spec v2.0.0 — Tóm tắt nhanh

### Base Components
`Button` (primary/secondary/ghost/danger/warning) · `Input` · `Textarea` · `Select` · `Checkbox` · `Badge` · `Card` · `Table` · `Toast` · `Modal` · `Skeleton` · `EmptyState` · `ErrorStateBlock` · `QrPreviewBlock` · `TicketDisplayBlock`

### Cross-screen Rules
- Mobile-first cho tất cả customer-facing screens
- Mọi data screen: định nghĩa loading + empty + error state
- Mọi form: validation state rõ ràng (inline, không dùng Toast thay thế)
- Destructive actions: bắt buộc confirm step
- Toast: auto-dismiss 2.5s, không thay lỗi inline

### Staff Work Screen — Key Interactions
- `CallNext` → `POST /api/staff/session/[id]/next` — disable khi paused/ended/pending
- `Absent` → `POST /api/staff/session/[id]/absent` — chỉ active khi có current ticket
- `Accept` (manual verify) → `POST /api/staff/session/[id]/complete` — cần verify code 4 chữ số, hỗ trợ Enter

---

## Tech Spec v1.2.5 — Pending Implementation

| Item | Spec Ref | Priority |
|------|----------|----------|
| Redis Pub/Sub SSE fan-out | §1.2 | 🔴 High |
| Pessimistic locking ticket counter | §3.1 | 🔴 High |
| HMAC signature trong QR URL | §2.2 | 🟠 Medium |
| Rate limiting join (5 req/min) | §2.2 | 🟠 Medium |
| Idempotency-Key header | §2.2 | 🟠 Medium |
| API Response Envelope chuẩn hóa | §4.1 | 🟡 Low |
| `/health/ready` + `/health/live` | §4.2 | 🟡 Low |
| Audit logging + PII masking | §5 | 🟡 Low |
