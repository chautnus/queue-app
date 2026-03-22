# QueueApp Bug History

## Sprint 1 (Initial Deploy)
- PostCSS config missing for Tailwind v4 → added postcss.config.mjs
- Node.js version too low for Next.js 16 → set engines >=20.9.0
- npm ci peer dep conflict → added .npmrc with legacy-peer-deps
- Google OAuth crash when env vars missing → made conditional
- SessionProvider missing → added to layout
- UntrustedHost error → added trustHost=true to NextAuth

## Sprint 2 (Core Fixes)
- Staff auth crash on /staff/work → fixed middleware + auth flow
- End session not working → fixed API route
- Display board blank → fixed SSE connection
- Middleware redirect loop → fixed matcher config

## Sprint 3 (Auth & Security)
- Staff API routes using admin auth → created getStaffUser() helper
- Middleware blocking /staff/* routes → removed from matcher
- QR codes using localhost URL → use x-forwarded-host
- CAPTCHA using hardcoded secret → crypto.randomBytes
- SVG upload XSS vector → removed SVG from allowed types
- Missing onDelete cascades → added to StaffSession, Ticket, DailyTicketCounter
- Missing try/catch on 12 API routes → added error handling
- FK constraint violation on queue create → DB schema not synced
- prisma db push fails in Docker build → moved to start command
- Healthcheck timeout too short (30s) → increased to 120s
- Logo upload validation rejects local paths → removed .url() validator
- new Date("") → Invalid Date in create queue → added empty string check

## Sprint 4 (Current)
- [ ] Logo not showing in QR center
- [ ] Logo not showing in display board, dashboard, customer screen
- [ ] PATCH queue any field → internal server error (spread operator clears nullable fields)
- [ ] Customer doesn't see counter name when called
- [ ] Operating hours using DateTime instead of weekly schedule
- [ ] Dashboard missing LanguageSwitcher
