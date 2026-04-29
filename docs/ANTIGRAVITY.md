# ANTIGRAVITY.md

> Snapshot Version: 2.2
> Project: queue-app
> Last Updated: 2026-04-29

## Project Overview
FreeQueue is a modern, web-based queue management system that allows businesses to manage customer queues via QR codes and real-time updates.

## Technical Stack
- **Framework**: Next.js 16 (App Router)
- **Authentication**: Auth.js v5 (NextAuth)
- **Database**: Prisma with PostgreSQL
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand
- **Real-time**: SSE / Redis (ioredis)
- **i18n**: next-intl

## Key Architectural Patterns
- **Edge-ready**: Designed for deployment on Railway/Vercel.
- **Service Layer**: Business logic separated into `src/lib/services`.
- **Public/Private split**: Clear distinction between `/dashboard` (admin) and `/q`, `/display` (public).

## Documentation System
- [ARCH.md](file:///c:/dev/queue-app/docs/ARCH.md): High-level architecture and data flow.
- [DEVLOG.md](file:///c:/dev/queue-app/docs/DEVLOG.md): Development history and major decisions.
- [BUGLOG.md](file:///c:/dev/queue-app/docs/BUGLOG.md): Tracking known issues and fixes.
- [RTM.md](file:///c:/dev/queue-app/docs/RTM.md): Requirement Traceability Matrix.

## Deployment
- **Platform**: Railway
- **Config**: `railway.toml`
- **Build**: `nixpacks`
