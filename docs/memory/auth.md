# Auth System — FreeQueue

## Dual Auth Architecture

FreeQueue có **2 NextAuth instances riêng biệt**:

| | Admin Auth | Staff Auth |
|--|--|--|
| Config | `src/lib/auth.ts` | `src/lib/staff-auth.ts` |
| Route | `/api/auth/[...nextauth]` | `/api/staff-auth/[...nextauth]` |
| Secret | `NEXTAUTH_SECRET` | `STAFF_AUTH_SECRET` |
| Login page | `/login` | `/staff/login` |
| Provider | Credentials (email/pw) | Credentials (email/pw) |
| Session type | JWT | JWT |

## Middleware Protection

`src/middleware.ts` — bảo vệ routes:
- `/dashboard/*` → yêu cầu admin session
- `/staff/work/*` → yêu cầu staff session
- Public: `/`, `/q/*`, `/display/*`, `/about`, `/privacy`, `/terms`

## Get User Helpers

```ts
// Admin route
import { auth } from "@/lib/auth";
const session = await auth();
if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

// Staff route — kiểm tra CẢ HAI auth instance
import { getStaffUser } from "@/lib/get-staff-user";
const staffUser = await getStaffUser(request);
if (!staffUser) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

## `get-staff-user.ts` — tại sao cần
- Staff có thể đăng nhập từ cả 2 interface (admin dashboard + staff login)
- File này check cả `staffAuth` session lẫn `auth` session
- Fix lỗi 401 khi staff dùng admin account

## Session Types

```ts
// Admin session (src/types/next-auth.d.ts)
session.user.id: string
session.user.email: string
session.user.name: string

// Staff session
staffSession.user.id: string
staffSession.user.email: string
staffSession.user.staffId?: string
```
