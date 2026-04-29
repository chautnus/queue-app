# Changelog Index

| Sprint | Ngày | Nội dung chính |
|--------|------|----------------|
| Sprint 1–4 | 2026-Q1 | Core: auth, queue CRUD, customer flow, staff interface, display board |
| Sprint 5 | 2026-03 | i18n admin pages, QR logo, reports avg time, LiveMonitor stats |
| Sprint 6 | 2026-04-01 | QR logo fix (local path skip), hardcoded text, auto-detect lang, Indonesian, AdBanner, StreamAssignMode, staff auth unification |
| Sprint 7 | 2026-04-11 | Rename → FreeQueue, SEO (OG/Twitter/JSON-LD/sitemap/robots.txt) |

## Sprint 7 — 2026-04-11

### Đổi tên QueueApp/QueueDrop → FreeQueue
- 8 locale files: `common.appName`, tất cả text content
- `src/app/layout.tsx`: title, appleWebApp.title
- `src/components/LandingPage.tsx`, `DashboardSidebar.tsx`, `PublicFooter.tsx`
- `src/components/AboutPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`
- `src/app/about/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`: metadata
- Email: `support@queueapp.dev` → `support@freequeue.app`

### SEO
- `src/app/layout.tsx`: thêm `openGraph` + `twitter` metadata
- `src/components/LandingPage.tsx`: JSON-LD `SoftwareApplication` schema
- `public/robots.txt`: Allow `/`, Disallow `/dashboard/ /staff/ /api/`
- `src/app/sitemap.ts`: Next.js Metadata API → `/sitemap.xml`

### AdSense (không có code mới)
- Implementation đã đúng — ads không hiện vì `NEXT_PUBLIC_ADSENSE_CLIENT_ID` trống
- Cần: set env var trên Railway + Google approval domain

## Sprint 6 — 2026-04-01

### QR Logo Fix
- `src/app/api/queues/[id]/qr/route.ts`: skip `/uploads/` path
- `src/app/api/queues/[id]/staff-qr/route.ts`: cùng fix

### i18n
- `src/i18n/config.ts`: thêm `detectBrowserLocale()`, thêm `"id"` locale
- `src/components/LocaleProvider.tsx`: auto-detect khi không có stored locale
- `src/i18n/locales/id.json`: Indonesian translations

### AdBanner Placements
- `src/components/customer/TicketDisplay.tsx`: slot customer
- `src/components/layout/DashboardSidebar.tsx`: slot admin
- `src/components/LandingPage.tsx`: slot landing

### Staff Auth Fix
- `src/lib/get-staff-user.ts`: check cả 2 auth instances → fix 401
