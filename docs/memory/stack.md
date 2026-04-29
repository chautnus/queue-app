# Tech Stack

## Framework & Runtime (Version-Pinned)
- **Node.js 22.x LTS** — runtime trên Railway
- **Next.js 16.0.x** — App Router, Server Components, SSE, Turbopack (hiện tại: 16.1.6)
- **React 19** — Client components dùng `"use client"`
- **TypeScript**

## Database
- **PostgreSQL** (Neon, pgbouncer pooling)
- **Prisma 6** ORM — schema tại `prisma/schema.prisma`
- Deploy: `prisma db push` chạy trong `startCommand` của `railway.toml`

## Auth
- **NextAuth v5** — 2 instance riêng biệt:
  - Admin: `src/lib/auth.ts` → `/api/auth/[...nextauth]`
  - Staff: `src/lib/staff-auth.ts` → `/api/staff-auth/[...nextauth]`

## Storage & CDN
- **Cloudinary** — logo upload (server-side only, không expose secret ra client)
- Upload API: `src/app/api/upload/logo/route.ts`

## i18n
- **next-intl** — 8 locale: `en, vi, fr, es, zh, tl, th, id`
- Config: `src/i18n/config.ts`
- Locale files: `src/i18n/locales/*.json`
- Auto-detect browser language, persist vào `localStorage`

## Realtime
- **SSE (Server-Sent Events)** — `src/lib/sse.ts`
- Customer SSE: `/api/queues/[id]/sse`
- Staff SSE: `/api/staff/sse/[sessionId]`
- **Redis 7.x Pub/Sub** ⏳ — SSE distributed fan-out (theo impl spec §1.2 — chưa implement)
  - Mọi instance subscribe vào channel Redis chung
  - Client reconnect: Exponential Backoff + Jitter, sau đó fetch snapshot

## Notifications
- **Web Push API** với VAPID keys — `src/lib/push.ts`

## QR Code
- **qrcode** + **sharp** — QR với logo overlay
- `src/lib/qr.ts` — `generateQrPngWithLogo(url, logoUrl?, baseUrl?)`

## Monetization
- **Google AdSense** — conditional load khi có `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
- Component: `src/components/AdBanner.tsx`

## Deployment
- **Railway** — `railway.toml` với startCommand prisma + next start
- **robots.txt**: `public/robots.txt`
- **sitemap.xml**: `src/app/sitemap.ts` (Next.js Metadata API)

## Env Vars quan trọng
```
DATABASE_URL=                        # Neon pgbouncer URL
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STAFF_AUTH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=       # Để trống = tắt ads
NEXT_PUBLIC_ADSENSE_SLOT_LANDING=
NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER=
NEXT_PUBLIC_ADSENSE_SLOT_ADMIN=
NEXT_PUBLIC_BASE_URL=                # Dùng cho sitemap
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
REDIS_URL=                           # ⏳ Khi implement Redis SSE fan-out
QR_SECRET=                           # ⏳ Khi implement HMAC QR signature
```
