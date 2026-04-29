# Architecture (ARCH.md)

## System Overview
The Queue App is a multi-tenant queue management system.

## Data Flow
1. **Admin** creates a queue in `/dashboard`.
2. **Customer** scans a QR code to join the queue via `/q/[id]`.
3. **Staff** manages the queue via `/staff`.
4. **Display Board** shows real-time status via `/display/[id]`.

## Key Components
- **Auth**: Auth.js v5 handles both Admin (Google/Credentials) and Staff (separate instance).
- **Real-time**: Uses Server-Sent Events (SSE) for low-latency updates on the display board and customer screens.
- **Database**: Prisma acts as the ORM for PostgreSQL.
