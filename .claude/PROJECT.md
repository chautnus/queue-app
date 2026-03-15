# Queue App — Project Notes

## Infrastructure

| Layer | Service | Chi tiết |
|---|---|---|
| Source code | GitHub (private) | `chautnus/queue-app` |
| Hosting | Railway | Project ID: `8b54b33e-f5d9-42d0-a6ba-22c88ef84bdb` |
| Database | PostgreSQL trên Railway | `DATABASE_URL` set trong Railway Variables |
| CI/CD | Railway ← GitHub | Auto-deploy khi push lên `main` |

## Railway Variables (đã set đầy đủ)

```
DATABASE_URL                  ✅
NEXT_PUBLIC_VAPID_PUBLIC_KEY  ✅
VAPID_PRIVATE_KEY             ✅
VAPID_EMAIL                   ✅  (code đọc qua VAPID_SUBJECT ?? VAPID_EMAIL)
NEXTAUTH_SECRET               ✅
NEXTAUTH_URL                  ✅
AUTH_SECRET                   ✅
AUTH_URL                      ✅
AUTH_GOOGLE_ID                ✅
AUTH_GOOGLE_SECRET            ✅
```

## Stack

- **Next.js 16** (App Router, Turbopack)
- **PostgreSQL** trên Railway + Prisma ORM
- **NextAuth v5** — 2 instance: admin `/api/auth/` và staff `/api/staff-auth/`
- **SSE** real-time — `src/lib/sse.ts`
- **web-push** VAPID — `src/lib/push.ts`
- **qrcode** sinh QR PNG server-side
- **next-intl** đa ngôn ngữ (cài sẵn, chưa wire)
- **Google AdSense** banner — `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
- **Cloudinary** upload logo

## Workflow

```bash
# Phát triển local
npm run dev             # localhost:3000

# Database
npm run db:generate     # regenerate Prisma client sau khi sửa schema
npm run db:migrate      # tạo/cập nhật bảng
npm run db:studio       # Prisma Studio GUI

# Deploy
git add . && git commit -m "..." && git push origin main
# → Railway tự build & deploy
```

## Phase Status

| Phase | Status | Ghi chú |
|---|---|---|
| 1 — Foundation | ✅ Done | Build OK, deploy Railway |
| 2 — Queue CRUD | 🟡 Partial | Wizard 5 bước xong, chưa test DB thật |
| 3 — Customer Flow | 🟡 Partial | State machine xong, chưa test E2E |
| 4 — Real-time + Push | 🟡 Partial | SSE + web-push xong, chưa test |
| 5 — Staff Flow | 🟡 Partial | Session + work screen xong, chưa test |
| 6 — Admin Monitor | 🟡 Partial | LiveMonitor + QR download xong |
| 7 — Reports + Polish | ❌ Todo | CSV export, daily report, i18n, PWA icons |

## Việc tiếp theo

1. **Chạy migration** — tạo bảng trong DB Railway
2. **Test E2E** — register → tạo queue → quét QR → nhân viên phục vụ
3. **Phase 7** — báo cáo, i18n, PWA icons

## Key Design Decisions

- **Device ID**: SHA-256 fingerprint, lưu `localStorage` key `dq_{queueId}_device`
- **Ticket number**: Atomic `INSERT ON CONFLICT DO UPDATE` — table `DailyTicketCounter`
- **QR**: JWT ký bằng `queue.qrSecret` — FIXED (100yr) hoặc DAILY (hết ngày theo timezone)
- **SSE**: In-memory Map cho single instance — muốn scale thêm thì thay bằng Redis pub/sub
- **CAPTCHA**: Math challenge server-side, token base64url exp 5 phút
- **2 NextAuth**: Admin và staff tách biệt hoàn toàn
