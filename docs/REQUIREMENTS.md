# QueueApp Requirements Document

> Version 1.0.0 | Last updated: 2026-03-21

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Roles](#2-user-roles)
3. [Features List](#3-features-list)
4. [Screen-by-Screen Details](#4-screen-by-screen-details)
5. [API Endpoints](#5-api-endpoints)
6. [Data Model](#6-data-model)
7. [Integrations](#7-integrations)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Deployment](#9-deployment)

---

## 1. Project Overview

### Application Name

**QueueApp** -- a smart, digital queue management platform.

### Purpose

QueueApp replaces traditional paper ticket queue systems with a mobile-first, web-based experience. Businesses create digital queues, share QR codes, and serve customers in real time -- no hardware required, no app download needed. Customers scan a QR code in their mobile browser, receive a ticket number, and get push notifications when their turn arrives.

### Target Users

- **Small to medium businesses**: restaurants, clinics, banks, government offices, salons, retail stores, telecom shops, post offices, hotels, gyms, schools, supermarkets, insurance offices, and vehicle service centers.
- **Enterprise operations**: any organization that needs to manage customer flow across multiple service streams and counters.

### Tech Stack

| Layer            | Technology                                                      |
|------------------|-----------------------------------------------------------------|
| Framework        | Next.js 16 (App Router, React 19, Turbopack dev server)        |
| Language         | TypeScript 5.7                                                  |
| Styling          | Tailwind CSS 4                                                  |
| Database         | PostgreSQL (via Prisma ORM 6)                                   |
| Authentication   | NextAuth v5 (beta 28) with Prisma Adapter                      |
| State Management | Zustand 5, TanStack React Query 5                              |
| Forms            | React Hook Form 7 + Zod validation                             |
| Real-time        | Server-Sent Events (SSE), Web Push (web-push library)          |
| Image Upload     | Cloudinary (with local filesystem fallback)                    |
| QR Generation    | qrcode library                                                  |
| i18n             | next-intl 3                                                     |
| Date Handling    | date-fns 4, date-fns-tz 3                                      |
| JWT              | jose 5                                                          |
| Password Hashing | bcryptjs                                                        |
| Image Processing | sharp                                                           |
| PWA              | Custom service worker + Web App Manifest                       |
| Runtime          | Node.js >= 20.9.0                                               |

---

## 2. User Roles

### Admin (Queue Owner / Manager)

- Registers an account via email/password or Google OAuth.
- Creates, configures, edits, and deletes queues.
- Defines service streams (e.g., "General Inquiry", "Cashier") and counters (e.g., "Counter 1", "Counter 2") within each stream.
- Controls queue status: activate, pause, close.
- Views real-time queue statistics via the LiveMonitor dashboard.
- Downloads customer QR codes and staff QR codes.
- Accesses daily and serving reports with CSV export.
- Uploads brand logos and applies them across queues.
- Manages account settings.
- Default role assigned at registration: `ADMIN`.

### Staff (Counter Operator)

- Logs in via the dedicated staff login portal (email/password).
- Scans or navigates to a staff QR link to join a queue session.
- Selects which service streams and counter to serve.
- Calls the next customer in line.
- Verifies customer identity by entering ticket display number and 4-digit verification code.
- Marks customers as absent when they do not respond.
- Pauses and resumes their own session.
- Ends their shift (session).
- An admin can also act as staff -- the system checks admin auth as a fallback.

### Customer (End User)

- No account required.
- Scans a QR code or opens a direct link to reach the queue page.
- Selects a service stream (if the queue has multiple streams).
- Completes a math-based CAPTCHA challenge.
- Optionally provides personal information (name, phone, age, address, custom fields) as configured by the admin.
- Receives a ticket with a display number (e.g., "A042") and a 4-digit verification code.
- Sees real-time position and estimated wait time.
- Receives web push notifications when their turn arrives.
- Can rate the service (1-5 stars with optional comment) after being served.
- Limited to one active ticket per device per queue.

---

## 3. Features List

### 3.1 Queue Creation and Management

- Multi-step wizard (4 tabs: Basic, Streams & Counters, Customer Settings, QR & Publish) for creating and editing queues.
- Queue fields: name, greeting message, logo, timezone, operating hours (start/end), QR rotation type (Fixed or Daily), business category.
- Queue status lifecycle: INACTIVE -> ACTIVE -> PAUSED -> CLOSED.
- Auto-generated URL slug for each queue.
- HMAC-signed QR secret for secure QR token generation.

### 3.2 Service Streams and Counters

- Multiple service streams per queue, each with a name, ticket prefix (e.g., "A"), and average processing time.
- Multiple counters per stream, each with a name and optional weekly schedule (day-of-week, open/close times).
- Ordering support for both streams and counters.

### 3.3 Customer Data Collection

- Configurable collection mode per field: HIDDEN, OPTIONAL, or REQUIRED.
- Built-in system fields: name, phone number, age, address.
- Custom fields defined as JSON: text, number, or select type with optional stream-conditional display.
- Optional redirect URL that opens in a new tab after ticket issuance.
- Optional queue transfer capability to another queue.

### 3.4 Ticket System

- Sequential ticket numbering per stream per day, using a `DailyTicketCounter` for atomicity.
- Display number format using stream prefix + zero-padded number (e.g., "A042").
- Random 4-digit verification code per ticket for identity verification at the counter.
- Ticket statuses: WAITING -> CALLED -> SERVING -> COMPLETED (or ABSENT / CANCELLED).
- One active ticket per device per queue, enforced via `DeviceRegistration`.
- Timestamps tracked: createdAt, calledAt, servedAt, completedAt.

### 3.5 Real-Time Updates (SSE)

- Server-Sent Events stream per queue (`/api/queues/[id]/sse`) for broadcasting events to all connected clients (customers, display board, admin LiveMonitor).
- Separate SSE stream per staff session (`/api/staff/sse/[sessionId]`) for staff-specific updates.
- Event types: `ticket:created`, `ticket:called`, `ticket:serving`, `ticket:completed`, `ticket:absent`.
- Heartbeat mechanism for connection health.

### 3.6 Web Push Notifications

- VAPID-based web push using the `web-push` library.
- Customer subscribes to push notifications after receiving a ticket.
- Push sent when the customer's ticket is called, including counter name and ticket number.
- Push subscription stored per ticket in the `PushSubscription` table.

### 3.7 QR Code Generation

- Customer QR code: encodes a signed URL pointing to `/q/[queueId]` with an HMAC token.
- Staff QR code: encodes a signed URL pointing to `/staff/join/[queueId]` with a staff-specific HMAC token.
- QR rotation types: FIXED (unchanging) or DAILY (regenerated each day).
- Generated as PNG images, downloadable from the LiveMonitor.
- Production URL used in QR codes (using x-forwarded-host headers on Railway).

### 3.8 Display Board

- Full-screen display page (`/display/[queueId]`) designed for TV or large monitor in a waiting area.
- Shows queue name, a live clock, total waiting count, total serving count.
- Displays currently-serving ticket numbers paired with their counter names in a responsive grid.
- Updates in real time via SSE.
- Dark blue gradient background for high visibility.
- No authentication required (public page).

### 3.9 LiveMonitor Dashboard

- Real-time admin dashboard showing queue statistics.
- Summary cards: total waiting, total serving, active staff count, total tickets today.
- Per-stream breakdown: waiting, called, and serving counts.
- Active staff list with name, counter, and served count.
- Queue status toggle: activate, pause, close.
- Customer QR and Staff QR previews with download and link-copy actions.
- Display board link with copy functionality.
- Live indicator dot when SSE connection is active.

### 3.10 Reporting and Analytics

- **Daily report**: total tickets issued, completed, absent, currently waiting; average wait time; average service time; breakdown by stream; breakdown by staff member.
- **Serving report**: detailed per-ticket data for a given date -- display number, stream, status, timestamps, wait duration, service duration, staff name and counter.
- **Customer CSV export**: full ticket data export with custom field values, downloadable as CSV.
- Date picker and queue selector for filtering.

### 3.11 CAPTCHA Security

- Server-side math-based CAPTCHA (addition or subtraction of single-digit numbers).
- HMAC-signed token with 5-minute expiration to prevent replay attacks.
- Required before a customer can join a queue.

### 3.12 Logo and Brand Management

- Logo upload via `/api/upload/logo` endpoint.
- Supports PNG, JPEG, WebP, and SVG formats; max 10 MB.
- Cloudinary integration when configured (resizes to 400x400 limit); falls back to local filesystem (`public/uploads/logos/`).
- Brand settings page to set a default logo and apply it across all existing queues.

### 3.13 Authentication

- **Admin auth**: NextAuth v5 with Credentials provider (email + bcrypt password) and Google OAuth provider.
- **Staff auth**: Separate NextAuth instance (`/api/staff-auth/[...nextauth]`) for staff portal login.
- Both admin and staff sessions are cookie-based.
- Unified staff user resolution: staff auth checked first, admin auth checked as fallback (admins can act as staff).
- Password hashing: bcrypt with 12 salt rounds.
- Registration creates users with `ADMIN` role by default.

### 3.14 PWA (Progressive Web App)

- Web App Manifest at `/manifest.json` with app name, icons (192px and 512px), standalone display mode, portrait orientation.
- Service worker at `/sw.js` for push notification handling.
- Service worker registration script at `/sw-register.js`.
- Theme color: `#2563eb` (blue).

### 3.15 Customer Rating

- After service, customers can rate 1-5 stars with an optional text comment (max 500 characters).
- Rating stored on the ticket record; each ticket can be rated only once.
- No authentication required (public endpoint).

### 3.16 Device Registration

- Unique device ID generated per queue per device.
- Prevents duplicate ticket issuance: one active ticket per device per queue.
- Used to reconnect customers to their existing ticket on page reload.

### 3.17 Static Pages

- **About** (`/about`): describes QueueApp's purpose, mission, key benefits, and contact information.
- **Terms of Service** (`/terms`): acceptance terms, service description, user responsibilities, data usage, IP, liability, termination, and contact.
- **Privacy Policy** (`/privacy`): data collection, usage, sharing, retention, security, user rights, cookies, and contact.
- All static pages include shared navigation header, footer with links, and AdSense banner slots.

### 3.18 Ad Monetization

- Google AdSense banner integration via the `AdBanner` component.
- Ad slots configurable per placement: landing page, customer page, display board, and staff pages.
- Queue-level ad banner slot override via `adBannerSlotId`.

---

## 4. Screen-by-Screen Details

### 4.1 Landing Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/`                                                                |
| **Purpose**     | Marketing landing page to attract new users.                      |
| **User Role**   | Unauthenticated visitors. Authenticated users are redirected to `/dashboard/queues`. |
| **Key UI**      | Fixed navigation bar with logo, "Log In", and "Get Started" buttons. Hero section with gradient background, headline, subheading, and dual CTAs. "How It Works" 3-step section (Create Queue, Share QR, Serve Customers). Feature grid (6 cards: Real-time Updates, Multiple Services, Display Board, Analytics, Push Notifications, No App Required). CTA section with blue gradient card. AdSense banner. Public footer with links to About, Terms, Privacy, Contact. |
| **Data**        | None (static content).                                             |
| **Actions**     | Navigate to `/register` or `/login`.                               |
| **API Used**    | None.                                                              |

### 4.2 Login Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/login`                                                           |
| **Purpose**     | Admin login via email/password or Google OAuth.                    |
| **User Role**   | Unauthenticated visitors. Authenticated users are redirected to `/dashboard/queues`. |
| **Key UI**      | Centered card with app logo. Email and password input fields. Google OAuth button (shown only when Google credentials are configured). Link to registration page. |
| **Data**        | User credentials.                                                  |
| **Actions**     | Submit login form; navigate to register.                           |
| **API Used**    | `POST /api/auth/[...nextauth]` (NextAuth sign-in).                |

### 4.3 Register Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/register`                                                        |
| **Purpose**     | Create a new admin account.                                        |
| **User Role**   | Unauthenticated visitors. Authenticated users are redirected to `/dashboard/queues`. |
| **Key UI**      | Centered card with app logo. Name, email, and password fields. Google OAuth button (conditional). Link to login page. |
| **Data**        | Name, email, password.                                             |
| **Actions**     | Submit registration form; navigate to login.                       |
| **API Used**    | `POST /api/auth/register`.                                         |

### 4.4 Staff Login Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/staff/login`                                                     |
| **Purpose**     | Staff portal login.                                                |
| **User Role**   | Staff users (and admins acting as staff).                          |
| **Key UI**      | Centered card titled "Staff Portal". Email and password fields. Supports `callbackUrl` query param for post-login redirect. |
| **Data**        | Staff credentials.                                                 |
| **Actions**     | Submit login form.                                                 |
| **API Used**    | `POST /api/staff-auth/[...nextauth]`.                              |

### 4.5 Dashboard -- Queue List

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/queues`                                                |
| **Purpose**     | List all queues owned by the authenticated admin.                  |
| **User Role**   | Admin (authenticated).                                             |
| **Key UI**      | Page title "Hang doi" with "Tao hang doi" (Create Queue) button. Grid of queue cards showing: logo or initial letter, queue name, stream/counter count, status badge (color-coded), total ticket count, "Monitor" and "Chinh sua" (Edit) action buttons. Empty state with illustration and CTA when no queues exist. |
| **Data**        | Queues with streams, counter counts, ticket counts.                |
| **Actions**     | Navigate to create queue; navigate to queue monitor; navigate to edit queue. |
| **API Used**    | Server-side Prisma query (SSR page).                               |

### 4.6 Dashboard -- Create Queue

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/queues/new`                                            |
| **Purpose**     | Multi-step wizard to create a new queue.                           |
| **User Role**   | Admin (authenticated).                                             |
| **Key UI**      | 4-tab wizard: **Tab 1 - Basic**: queue name, greeting, logo upload (drag-and-drop or click), timezone selector (7 options), operating hours (start/end datetime), business category dropdown (15 categories). **Tab 2 - Streams & Counters**: add/remove streams with name, ticket prefix, average processing time; nested counters per stream with name and weekly schedule. **Tab 3 - Customer Settings**: toggle customer info requirement; configure collection mode (Hidden/Optional/Required) for name, phone, age, address; add custom fields (text/number/select type); redirect URL; queue transfer toggle with target queue ID. **Tab 4 - QR & Publish**: QR rotation type selection (Fixed/Daily); submit/create button. |
| **Data**        | Queue configuration input.                                         |
| **Actions**     | Fill form across tabs; upload logo; submit to create queue.        |
| **API Used**    | `POST /api/upload/logo` (logo upload), `POST /api/queues` (create queue). |

### 4.7 Dashboard -- Queue Detail (LiveMonitor)

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/queues/[id]`                                           |
| **Purpose**     | Real-time monitoring dashboard for a specific queue.               |
| **User Role**   | Admin (authenticated, must be queue owner).                        |
| **Key UI**      | Breadcrumb navigation (Queues > Queue Name). Edit and Display Board links. LiveMonitor component: status badge with toggle buttons (Activate/Pause/Close), QR download button, live indicator. Summary cards (waiting, serving, staff, today's total). Per-stream stats (waiting/called/serving counts). Active staff list (name, counter, served count). Customer QR card with image preview, PNG download, direct link, copy button. Staff QR card with same layout. Display board link with open and copy actions. |
| **Data**        | Queue stats (streams, sessions, ticket counts) via API; real-time updates via SSE. |
| **Actions**     | Toggle queue status; download QR codes; copy links; open display board. |
| **API Used**    | `GET /api/queues/[id]/stats`, `GET /api/queues/[id]/sse`, `PATCH /api/queues/[id]/status`, `GET /api/queues/[id]/qr`, `GET /api/queues/[id]/staff-qr`. |

### 4.8 Dashboard -- Edit Queue

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/queues/[id]/edit`                                      |
| **Purpose**     | Edit an existing queue using the same wizard as creation.          |
| **User Role**   | Admin (authenticated, must be queue owner).                        |
| **Key UI**      | Same QueueWizard component as create, pre-filled with existing queue data. All tabs and fields available for editing. |
| **Data**        | Existing queue configuration loaded server-side.                   |
| **Actions**     | Modify fields; upload new logo; save changes.                      |
| **API Used**    | `PATCH /api/queues/[id]` (update queue metadata), `PUT /api/queues/[id]/streams` (replace streams/counters), `POST /api/upload/logo`. |

### 4.9 Dashboard -- Reports

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/reports`                                               |
| **Purpose**     | View daily performance analytics and export customer data.        |
| **User Role**   | Admin (authenticated).                                             |
| **Key UI**      | Filter bar: queue selector dropdown, date picker (max = today), CSV export button. Summary cards: total issued, completed, absent, average wait time, average service time. Staff performance table: name, served count, average service time. Stream breakdown table: stream name, total issued, completed, absent. Empty state message for days with no data. |
| **Data**        | Daily report with summary, by-stream, and by-staff breakdowns.    |
| **Actions**     | Select queue; change date; export CSV.                             |
| **API Used**    | `GET /api/reports/daily`, `GET /api/reports/customers` (CSV download). |

### 4.10 Dashboard -- Brand

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/brand`                                                 |
| **Purpose**     | Upload a default brand logo and apply it across all queues.        |
| **User Role**   | Admin (authenticated).                                             |
| **Key UI**      | Logo upload area with drag-and-drop or click-to-browse. File type restrictions (PNG, JPEG, WebP, SVG, max 10 MB). Logo preview after upload. Delete logo button. Info card explaining that the logo applies to all queues. Save button that patches all queues with the new logo. Success/error feedback messages. |
| **Data**        | Logo file; list of user's queues.                                  |
| **Actions**     | Upload logo; remove logo; save (applies logo to all queues).       |
| **API Used**    | `POST /api/upload/logo`, `GET /api/queues`, `PATCH /api/queues/[id]` (for each queue). |

### 4.11 Dashboard -- Settings

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard/settings`                                              |
| **Purpose**     | View account information and app details.                          |
| **User Role**   | Admin (authenticated).                                             |
| **Key UI**      | Personal info section showing name and email (read-only). App info section showing version (1.0.0) and platform (Next.js PWA). |
| **Data**        | Session user data.                                                 |
| **Actions**     | View only (no editable fields currently).                          |
| **API Used**    | None (server-side session read).                                   |

### 4.12 Customer Queue Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/q/[queueId]`                                                     |
| **Purpose**     | Customer-facing page to join a queue and view ticket status.       |
| **User Role**   | Customer (unauthenticated).                                        |
| **Key UI**      | Header with queue logo/name and optional greeting. AdSense banner (queue-specific slot or global). Multi-state flow controlled by `CustomerFlow` component: **Info state** -- wait time info (WaitInfo component showing per-stream waiting count and estimated time), stream selector (if multiple streams), "Lay so" (Get Ticket) button. **Captcha state** -- math challenge (e.g., "7 + 3 = ?") with input field and submit. **Form state** -- dynamic form with system fields and custom fields. **Joining state** -- loading spinner. **Ticket state** -- TicketDisplay showing display number, verification code, status badge (color-coded: blue for waiting, green for called), waiting-ahead count, estimated wait time; push notification auto-registration. **Rating state** -- 1-5 star rating with optional comment. Queue unavailable message when status is not ACTIVE. Link to customer guide page. |
| **Data**        | Queue config, streams with waiting counts, ticket info.            |
| **Actions**     | Select stream; complete CAPTCHA; fill customer form; join queue; view ticket; subscribe to push; rate service. |
| **API Used**    | `GET /api/queues/[id]/join` (check existing ticket), `GET /api/captcha`, `POST /api/queues/[id]/join` (create ticket), `GET /api/queues/[id]/sse` (real-time updates), `GET /api/push/vapid-key`, `POST /api/tickets/[id]/push` (register push), `POST /api/tickets/[id]/rating`. |

### 4.13 Customer Guide Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/q/[queueId]/guide`                                               |
| **Purpose**     | Step-by-step guide explaining how to use the queue system.         |
| **User Role**   | Customer (unauthenticated).                                        |
| **Key UI**      | Header with queue logo and name. 4 illustrated steps: (1) Scan QR code, (2) Select service, (3) Receive ticket number, (4) Wait for notification. Tips card with important notes: one ticket per device, ticket valid for same day, contact staff if overdue. "Lay so ngay" (Get Ticket Now) CTA button linking back to the queue page. AdSense banner. |
| **Data**        | Queue name and logo.                                               |
| **Actions**     | Navigate to queue page.                                            |
| **API Used**    | None (server-side Prisma query for queue info).                    |

### 4.14 Display Board

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/display/[queueId]`                                               |
| **Purpose**     | Large-screen display for waiting areas showing currently-served tickets. |
| **User Role**   | Public (no authentication required).                               |
| **Key UI**      | Full-screen dark blue gradient background. Header with queue name and "Now Serving" subtitle. Stats bar showing total waiting (yellow) and serving (green) counts. Main serving grid: responsive card layout (1-3 columns) showing counter name and large ticket display number per card. Waiting state placeholder when no tickets are being served. AdSense banner. Footer with live clock (HH:MM:SS). |
| **Data**        | Queue name, waiting/serving counts, currently-served ticket-counter pairs. |
| **Actions**     | None (passive display). Auto-updates via SSE.                      |
| **API Used**    | `GET /api/queues/[id]/public-stats`, `GET /api/queues/[id]/sse` (with 30-second polling fallback for stats). |

### 4.15 Staff Portal Home

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/staff`                                                           |
| **Purpose**     | Staff entry point -- redirects to active session or shows instructions. |
| **User Role**   | Staff (authenticated).                                             |
| **Key UI**      | If staff has an active session: redirect to `/staff/work/[sessionId]`. Otherwise: centered message "Staff Portal" with instruction to scan a queue QR code. |
| **Data**        | Active staff session lookup.                                       |
| **Actions**     | Automatic redirect if session exists.                              |
| **API Used**    | None (server-side Prisma query).                                   |

### 4.16 Staff Join Queue

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/staff/join/[queueId]`                                            |
| **Purpose**     | Configure and start a staff serving session.                       |
| **User Role**   | Staff (authenticated via staff auth or admin auth).                |
| **Key UI**      | Queue name header. SessionSetup component: greeting with staff name, stream multi-select (checkboxes), counter dropdown (filtered by selected streams), planned end time (time input, defaults to 17:00), "Bat dau ca lam viec" (Start Session) button. AdSense banner. Redirects to staff login with callback URL if not authenticated. |
| **Data**        | Queue streams and counters.                                        |
| **Actions**     | Select streams; select counter; set end time; start session.       |
| **API Used**    | `POST /api/staff/session`.                                         |

### 4.17 Staff Work Screen

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/staff/work/[sessionId]`                                          |
| **Purpose**     | Main staff interface for calling and serving customers.            |
| **User Role**   | Staff (authenticated via staff auth or admin auth).                |
| **Key UI**      | Header showing counter name, queue name, and served count. Paused banner (amber) when session is paused. Current ticket card: large display number, verification code, stream name (or dash placeholder when idle). Feedback message bar (success/error, auto-dismiss after 2.5s). Action buttons: "Goi tiep theo" (Call Next) -- large blue primary button; "Vang mat" (Absent) -- amber secondary; "Nhap ma" (Enter Code) -- toggle for manual ticket verification; manual entry form with display number + 4-digit verify code inputs + "Chap nhan" (Accept) button. "Tam dung" (Pause) / "Tiep tuc lam viec" (Resume) button. "Ket thuc ca" (End Session) with confirmation dialog. AdSense banner. Background color changes to amber when paused. |
| **Data**        | Session status, served count, current ticket info via SSE.         |
| **Actions**     | Call next ticket; mark absent; manually verify ticket; pause/resume; end session. |
| **API Used**    | `POST /api/staff/session/[id]/next`, `POST /api/staff/session/[id]/complete`, `POST /api/staff/session/[id]/absent`, `POST /api/staff/session/[id]/pause`, `POST /api/staff/session/[id]/end`, `GET /api/staff/sse/[sessionId]`. |

### 4.18 About Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/about`                                                           |
| **Purpose**     | Static informational page about QueueApp.                          |
| **User Role**   | Public.                                                            |
| **Key UI**      | Navigation header with logo and back-to-home link. Sections: What is QueueApp, Our Mission, Key Benefits (6-item list), Contact Us (email link). AdSense banner. Footer with About/Terms/Privacy/Contact links. |
| **Data**        | Static content.                                                    |
| **Actions**     | Navigate to other pages; send email.                               |
| **API Used**    | None.                                                              |

### 4.19 Terms of Service Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/terms`                                                           |
| **Purpose**     | Legal terms of service.                                            |
| **User Role**   | Public.                                                            |
| **Key UI**      | Navigation header. 8 sections: Acceptance of Terms, Service Description, User Responsibilities, Data Usage, Intellectual Property, Limitation of Liability, Termination, Contact. Last updated date. Footer. |
| **Data**        | Static content.                                                    |
| **Actions**     | Navigate to privacy page; send email.                              |
| **API Used**    | None.                                                              |

### 4.20 Privacy Policy Page

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/privacy`                                                         |
| **Purpose**     | Privacy policy detailing data handling practices.                  |
| **User Role**   | Public.                                                            |
| **Key UI**      | Navigation header. 8 sections: Information We Collect, How We Use Information, Data Sharing, Data Retention, Data Security, Your Rights, Cookies, Contact. Last updated date. Footer. |
| **Data**        | Static content.                                                    |
| **Actions**     | Navigate to other pages; send email.                               |
| **API Used**    | None.                                                              |

### 4.21 Dashboard Root

| Attribute       | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| **URL**         | `/dashboard`                                                       |
| **Purpose**     | Redirect entry point for the dashboard.                            |
| **User Role**   | Admin (authenticated).                                             |
| **Key UI**      | None (immediate redirect).                                         |
| **Data**        | None.                                                              |
| **Actions**     | Redirects to `/dashboard/queues`.                                  |
| **API Used**    | None.                                                              |

---

## 5. API Endpoints

### 5.1 Authentication

| Method | Path                              | Auth     | Description                                           | Request Body                              | Response                        |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| GET/POST | `/api/auth/[...nextauth]`       | None     | NextAuth admin authentication handlers (login, callback, session, signout). | NextAuth protocol                         | NextAuth protocol               |
| GET/POST | `/api/staff-auth/[...nextauth]` | None     | NextAuth staff authentication handlers.               | NextAuth protocol                         | NextAuth protocol               |
| POST   | `/api/auth/register`              | None     | Register a new admin account.                         | `{ name, email, password }`               | `{ user: { id, name, email, role } }` (201) or validation errors (400) or email conflict (409). |

### 5.2 Queue Management

| Method | Path                              | Auth     | Description                                           | Request Body / Params                     | Response                        |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| GET    | `/api/queues`                     | Admin    | List all queues owned by the authenticated user.      | --                                        | `{ queues: [...] }`             |
| POST   | `/api/queues`                     | Admin    | Create a new queue with streams and counters.         | `CreateQueueSchema` body                  | `{ queue }` (201)               |
| GET    | `/api/queues/[id]`                | Admin    | Get a specific queue with streams and counters.       | --                                        | `{ queue }`                     |
| PATCH  | `/api/queues/[id]`                | Admin    | Update queue metadata (name, greeting, logo, etc.).   | `UpdateQueueSchema` body                  | `{ queue }`                     |
| DELETE | `/api/queues/[id]`                | Admin    | Delete a queue and all associated data.               | --                                        | `{ success: true }`             |
| PATCH  | `/api/queues/[id]/status`         | Admin    | Change queue status (INACTIVE/ACTIVE/PAUSED/CLOSED).  | `{ status }`                              | `{ queue: { id, name, status } }` |
| GET    | `/api/queues/[id]/stats`          | Admin    | Get queue statistics (streams, sessions, counts).     | --                                        | `{ stats: { queue, streams, activeSessions, totalWaiting, totalServing } }` |
| GET    | `/api/queues/[id]/public-stats`   | None     | Get public queue statistics (no auth, used by display board). | --                                  | `{ stats: { queue, streams, totalWaiting, totalServing } }` |
| PUT    | `/api/queues/[id]/streams`        | Admin    | Replace all streams and counters for a queue.         | `{ streams: [...] }`                      | `{ ok: true }`                  |

### 5.3 Queue Join (Customer)

| Method | Path                              | Auth     | Description                                           | Request Body / Params                     | Response                        |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| GET    | `/api/queues/[id]/join`           | None     | Check if a device already has an active ticket.       | Query: `deviceId`                         | `{ ticket }` or `{ ticket: null }` |
| POST   | `/api/queues/[id]/join`           | None     | Join a queue -- create a new ticket.                  | `{ deviceId, streamId?, customerInfo?, captchaAnswer, captchaToken }` | `{ ticket: { id, displayNumber, verifyCode, streamName, status, waitingAhead, estimatedSeconds } }` or error (400/404/409). |

### 5.4 QR Codes

| Method | Path                              | Auth     | Description                                           | Response                                  |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|
| GET    | `/api/queues/[id]/qr`            | Admin    | Generate customer QR code as PNG image.               | `image/png` binary with HMAC-signed URL.  |
| GET    | `/api/queues/[id]/staff-qr`      | Admin    | Generate staff QR code as PNG image.                  | `image/png` binary with HMAC-signed URL.  |

### 5.5 SSE (Server-Sent Events)

| Method | Path                              | Auth     | Description                                           | Response                                  |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|
| GET    | `/api/queues/[id]/sse`           | None     | Subscribe to real-time queue events.                  | `text/event-stream` with JSON event data. |
| GET    | `/api/staff/sse/[sessionId]`     | Staff    | Subscribe to real-time staff session events.          | `text/event-stream` with JSON event data. |

### 5.6 Staff Session

| Method | Path                                      | Auth     | Description                                           | Request Body                              | Response                        |
|--------|-------------------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| POST   | `/api/staff/session`                      | Staff    | Create a new staff session (start shift).             | `{ counterId, queueId, streamIds, plannedEndTime? }` | `{ session }` (201)             |
| POST   | `/api/staff/session/[id]/next`            | Staff    | Call the next waiting ticket.                         | --                                        | `{ ticket }` or `{ ticket: null }` |
| POST   | `/api/staff/session/[id]/complete`        | Staff    | Accept/verify a ticket by display number + code.     | `{ displayNumber, verifyCode }`           | `{ ticket }`                    |
| POST   | `/api/staff/session/[id]/absent`          | Staff    | Mark the currently-called ticket as absent.           | --                                        | `{ success: true }`             |
| POST   | `/api/staff/session/[id]/pause`           | Staff    | Toggle session pause/resume.                          | --                                        | `{ session }`                   |
| POST   | `/api/staff/session/[id]/end`             | Staff    | End the staff session (shift complete).               | --                                        | `{ session }`                   |

### 5.7 Tickets

| Method | Path                              | Auth     | Description                                           | Request Body                              | Response                        |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| POST   | `/api/tickets/[id]/push`         | None     | Register a web push subscription for a ticket.        | `{ endpoint, keys: { p256dh, auth } }`    | `{ success: true }`             |
| POST   | `/api/tickets/[id]/rating`       | None     | Submit a rating for a completed ticket.               | `{ rating: 1-5, comment?: string }`       | `{ success: true }`             |

### 5.8 CAPTCHA

| Method | Path                              | Auth     | Description                                           | Response                                  |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|
| GET    | `/api/captcha`                   | None     | Generate a math CAPTCHA challenge.                    | `{ question, token }`                     |

### 5.9 Upload

| Method | Path                              | Auth     | Description                                           | Request Body                              | Response                        |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| POST   | `/api/upload/logo`               | Admin    | Upload a logo image (Cloudinary or local).            | `multipart/form-data` with `file` field   | `{ url }`                       |

### 5.10 Push Notifications

| Method | Path                              | Auth     | Description                                           | Response                                  |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|
| GET    | `/api/push/vapid-key`            | None     | Get the VAPID public key for push subscription.       | `{ publicKey }`                           |

### 5.11 Reports

| Method | Path                              | Auth     | Description                                           | Query Params                              | Response                        |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|---------------------------------|
| GET    | `/api/reports/daily`             | Admin    | Daily summary report for a queue.                     | `queueId`, `date` (YYYY-MM-DD)            | `{ date, queue, summary, byStream, byStaff }` |
| GET    | `/api/reports/serving`           | Admin    | Detailed per-ticket serving data for a date.          | `queueId`, `date` (YYYY-MM-DD)            | `{ queue, date, tickets: [...] }` |
| GET    | `/api/reports/customers`         | Admin    | Export customer ticket data as CSV.                   | `queueId`, `from`, `to` (ISO/YYYY-MM-DD) | `text/csv` file download        |

### 5.12 Health

| Method | Path                              | Auth     | Description                                           | Response                                  |
|--------|-----------------------------------|----------|-------------------------------------------------------|-------------------------------------------|
| GET    | `/api/health`                    | None     | Health check endpoint.                                | `{ status: "ok", timestamp }`             |

---

## 6. Data Model

### 6.1 Entity Relationship Overview

```
User (1) ──── (N) Queue           [owner]
User (1) ──── (N) QueueStaff      [staff membership]
User (1) ──── (N) StaffSession    [shift records]
User (1) ──── (N) Account         [OAuth accounts]
User (1) ──── (N) Session         [auth sessions]

Queue (1) ──── (N) Stream         [service types]
Queue (1) ──── (N) Ticket         [customer tickets]
Queue (1) ──── (N) QueueStaff     [staff assignments]
Queue (1) ──── (N) StaffSession   [active shifts]
Queue (1) ──── (N) DeviceRegistration
Queue (1) ──── (N) PushSubscription

Stream (1) ──── (N) Counter       [service desks]
Stream (1) ──── (N) Ticket
Stream (1) ──── (N) DailyTicketCounter

Counter (1) ──── (N) StaffSession

StaffSession (1) ──── (N) Ticket  [served tickets]
```

### 6.2 Model Details

#### User

| Field          | Type       | Constraints                | Description                         |
|----------------|------------|----------------------------|-------------------------------------|
| id             | String     | PK, cuid()                 | Unique identifier.                  |
| name           | String?    |                            | Display name.                       |
| email          | String     | unique                     | Login email.                        |
| emailVerified  | DateTime?  |                            | Email verification timestamp.       |
| image          | String?    |                            | Avatar URL (from OAuth).            |
| passwordHash   | String?    |                            | bcrypt hash (null for OAuth users). |
| role           | UserRole   | default: ADMIN             | ADMIN or STAFF.                     |
| createdAt      | DateTime   | default: now()             | Account creation timestamp.         |
| updatedAt      | DateTime   | auto-updated               | Last modification timestamp.        |

**Relations**: accounts, sessions, ownedQueues, staffQueues, staffSessions.

#### Queue

| Field              | Type           | Constraints              | Description                                        |
|--------------------|----------------|--------------------------|---------------------------------------------------|
| id                 | String         | PK, cuid()               | Unique identifier.                                 |
| ownerId            | String         | FK -> User, indexed      | Queue creator/owner.                               |
| name               | String         |                          | Queue display name.                                |
| logoUrl            | String?        |                          | Queue logo image URL.                              |
| slug               | String         | unique                   | URL-friendly identifier.                           |
| status             | QueueStatus    | default: INACTIVE        | Current lifecycle state.                           |
| startAt            | DateTime?      |                          | Scheduled start time (optional).                   |
| endAt              | DateTime?      |                          | Scheduled end time (optional).                     |
| timezone           | String         | default: Asia/Ho_Chi_Minh | IANA timezone identifier.                         |
| qrRotationType     | QrRotationType | default: FIXED           | FIXED or DAILY QR code rotation.                   |
| qrSecret           | String         |                          | HMAC secret for QR token signing.                  |
| requireCustomerInfo| Boolean        | default: false           | Whether customer info form is required.            |
| collectName        | CollectMode    | default: HIDDEN          | Name field visibility: HIDDEN/OPTIONAL/REQUIRED.   |
| collectPhone       | CollectMode    | default: HIDDEN          | Phone field visibility.                            |
| collectEmail       | CollectMode    | default: HIDDEN          | Email field visibility.                            |
| collectAge         | CollectMode    | default: HIDDEN          | Age field visibility.                              |
| collectAddress     | CollectMode    | default: HIDDEN          | Address field visibility.                          |
| customFields       | Json?          |                          | Array of custom field definitions.                 |
| redirectUrl        | String?        |                          | URL to open after ticket issuance.                 |
| allowTransfer      | Boolean        | default: false           | Enable ticket transfer to another queue.           |
| transferQueueId    | String?        |                          | Target queue for transfers.                        |
| category           | String?        |                          | Business type/category.                            |
| adBannerSlotId     | String?        |                          | AdSense slot override for this queue.              |
| greeting           | String?        |                          | Welcome message shown to customers.                |
| createdAt          | DateTime       | default: now()           | Creation timestamp.                                |
| updatedAt          | DateTime       | auto-updated             | Last modification timestamp.                       |

**Relations**: owner (User), streams, staff (QueueStaff), tickets, deviceRegistrations, pushSubscriptions, staffSessions.

#### Stream

| Field                | Type    | Constraints          | Description                                     |
|----------------------|---------|----------------------|-------------------------------------------------|
| id                   | String  | PK, cuid()           | Unique identifier.                               |
| queueId              | String  | FK -> Queue, indexed | Parent queue.                                    |
| name                 | String  |                      | Service type name (e.g., "General Inquiry").     |
| avgProcessingSeconds | Int     | default: 300         | Average service time per ticket (seconds).       |
| ticketPrefix         | String? |                      | Prefix for ticket display numbers (e.g., "A").   |
| order                | Int     | default: 0           | Display order within the queue.                  |

**Relations**: queue, counters, tickets, dailyCounters.

#### Counter

| Field    | Type    | Constraints           | Description                                      |
|----------|---------|-----------------------|--------------------------------------------------|
| id       | String  | PK, cuid()            | Unique identifier.                                |
| streamId | String  | FK -> Stream, indexed | Parent stream.                                    |
| name     | String  |                       | Counter name (e.g., "Counter 1").                 |
| order    | Int     | default: 0            | Display order within the stream.                  |
| schedule | Json?   |                       | Weekly schedule: array of { dayOfWeek, openTime, closeTime, isOpen }. |

**Relations**: stream, staffSessions.

#### QueueStaff

| Field   | Type   | Constraints                     | Description                    |
|---------|--------|---------------------------------|--------------------------------|
| id      | String | PK, cuid()                      | Unique identifier.              |
| queueId | String | FK -> Queue                     | Queue assignment.               |
| userId  | String | FK -> User                      | Staff user.                     |

**Constraints**: unique(queueId, userId). **Relations**: queue, user.

#### StaffSession

| Field               | Type               | Constraints          | Description                                  |
|---------------------|--------------------| ---------------------|----------------------------------------------|
| id                  | String             | PK, cuid()           | Unique identifier.                            |
| userId              | String             | FK -> User, indexed  | Staff member.                                 |
| counterId           | String             | FK -> Counter, indexed| Assigned counter.                             |
| queueId             | String             | FK -> Queue, indexed | Parent queue.                                 |
| status              | StaffSessionStatus | default: ACTIVE      | ACTIVE, PAUSED, or ENDED.                    |
| startAt             | DateTime           | default: now()       | Session start time.                           |
| endAt               | DateTime?          |                      | Session end time.                             |
| pausedAt            | DateTime?          |                      | When the session was paused.                  |
| plannedEndAt        | DateTime?          |                      | Scheduled end of shift.                       |
| servedCount         | Int                | default: 0           | Number of tickets served.                     |
| totalServiceSeconds | Int                | default: 0           | Cumulative service duration.                  |
| streamIds           | String[]           |                      | Postgres array of stream IDs this session serves. |

**Relations**: user, counter, queue, tickets (served).

#### Ticket

| Field          | Type         | Constraints                                   | Description                              |
|----------------|--------------|-----------------------------------------------|------------------------------------------|
| id             | String       | PK, cuid()                                    | Unique identifier.                        |
| queueId        | String       | FK -> Queue                                   | Parent queue.                             |
| streamId       | String       | FK -> Stream                                  | Service stream.                           |
| ticketNumber   | Int          |                                               | Sequential number per stream per day.     |
| displayNumber  | String       |                                               | Human-readable number (e.g., "A042").     |
| verifyCode     | String       |                                               | 4-digit verification code.                |
| status         | TicketStatus | default: WAITING                              | WAITING/CALLED/SERVING/COMPLETED/ABSENT/CANCELLED. |
| deviceId       | String?      |                                               | Device identifier for duplicate prevention.|
| customerInfo   | Json?        |                                               | Collected customer form data.             |
| createdAt      | DateTime     | default: now()                                | Ticket creation time.                     |
| calledAt       | DateTime?    |                                               | When the ticket was called.               |
| servedAt       | DateTime?    |                                               | When service started.                     |
| completedAt    | DateTime?    |                                               | When service completed.                   |
| rating         | Int?         |                                               | Customer rating (1-5).                    |
| ratingComment  | String?      |                                               | Customer rating comment.                  |
| staffSessionId | String?      | FK -> StaffSession                            | Which session served this ticket.         |

**Indexes**: (queueId, streamId, status), (queueId, createdAt), (displayNumber, queueId).
**Relations**: queue, stream, staffSession.

#### DeviceRegistration

| Field     | Type     | Constraints                        | Description                              |
|-----------|----------|------------------------------------|------------------------------------------|
| id        | String   | PK, cuid()                         | Unique identifier.                        |
| queueId   | String   | FK -> Queue, indexed               | Parent queue.                             |
| deviceId  | String   |                                    | Browser-generated device identifier.      |
| ticketId  | String?  |                                    | Currently active ticket for this device.  |
| createdAt | DateTime | default: now()                     | Registration time.                        |
| updatedAt | DateTime | auto-updated                       | Last update time.                         |

**Constraints**: unique(queueId, deviceId).

#### PushSubscription

| Field    | Type     | Constraints              | Description                           |
|----------|----------|--------------------------|---------------------------------------|
| id       | String   | PK, cuid()               | Unique identifier.                     |
| queueId  | String   | FK -> Queue              | Parent queue.                          |
| ticketId | String   | indexed                  | Associated ticket.                     |
| endpoint | String   | unique, Text type        | Push service endpoint URL.             |
| p256dh   | String   |                          | Push encryption key.                   |
| auth     | String   |                          | Push auth secret.                      |
| createdAt| DateTime | default: now()           | Subscription creation time.            |

#### DailyTicketCounter

| Field    | Type   | Constraints                    | Description                                  |
|----------|--------|--------------------------------|----------------------------------------------|
| id       | String | PK, cuid()                     | Unique identifier.                            |
| streamId | String | FK -> Stream                   | Parent stream.                                |
| date     | String |                                | Date string "YYYY-MM-DD" in queue timezone.   |
| count    | Int    | default: 0                     | Running ticket count for the day.             |

**Constraints**: unique(streamId, date).

### 6.3 Enums

| Enum               | Values                                              |
|--------------------|----------------------------------------------------|
| UserRole           | ADMIN, STAFF                                        |
| QueueStatus        | INACTIVE, ACTIVE, PAUSED, CLOSED                    |
| QrRotationType     | FIXED, DAILY                                        |
| CollectMode        | HIDDEN, OPTIONAL, REQUIRED                          |
| StaffSessionStatus | ACTIVE, PAUSED, ENDED                               |
| TicketStatus       | WAITING, CALLED, SERVING, COMPLETED, ABSENT, CANCELLED |

---

## 7. Integrations

### 7.1 Google OAuth

- **Provider**: NextAuth Google provider.
- **Purpose**: Alternative login method for admin accounts.
- **Configuration**: Requires `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` environment variables. The Google OAuth button is conditionally shown on login and register pages only when these variables are set.
- **Behavior**: On first OAuth login, a User record is created with a linked Account record. Subsequent logins match by provider + providerAccountId.

### 7.2 Cloudinary (Logo Upload)

- **Purpose**: Cloud storage and image transformation for queue logos.
- **Configuration**: Requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- **Behavior**: When configured, logos are uploaded to the `queue-app/logos` folder on Cloudinary with a 400x400 crop limit transformation. When not configured, images are saved to the local filesystem at `public/uploads/logos/`.
- **File Constraints**: Max 10 MB; accepted types: PNG, JPEG, WebP, SVG.

### 7.3 Google AdSense

- **Purpose**: Ad monetization across the application.
- **Component**: `AdBanner` component renders ad slots in configurable positions.
- **Configuration**: Requires `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and per-placement slot IDs:
  - `NEXT_PUBLIC_ADSENSE_SLOT_LANDING` -- landing page.
  - `NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER` -- customer queue page.
  - `NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY` -- display board.
  - `NEXT_PUBLIC_ADSENSE_SLOT_STAFF` -- staff pages.
- **Queue-level override**: Each queue can have a custom `adBannerSlotId`.

### 7.4 Web Push Notifications

- **Library**: `web-push` (Node.js server-side).
- **Protocol**: VAPID (Voluntary Application Server Identification).
- **Configuration**: Requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables.
- **Flow**: (1) Customer receives ticket. (2) Browser requests notification permission. (3) If granted, service worker subscribes to push manager. (4) Subscription (endpoint, p256dh, auth) is sent to `/api/tickets/[id]/push`. (5) When staff calls the ticket, server sends push via `web-push` library to all subscriptions for that ticket.
- **Push payload**: Title ("Your turn!"), body with ticket number and counter name, data with queueId and ticketId.

### 7.5 PWA / Service Worker

- **Manifest**: `/manifest.json` with app name "QueueApp", standalone display mode, portrait orientation, blue theme color, 192px and 512px icons.
- **Service Worker**: `/sw.js` handles push notification events (display notification, handle click).
- **Registration**: `/sw-register.js` registers the service worker on page load.
- **Purpose**: Enables "Add to Home Screen" on mobile devices and background push notification handling.

### 7.6 QR Code Generation

- **Library**: `qrcode` (Node.js).
- **Customer QR**: Encodes a URL `{baseUrl}/q/{queueId}?token={hmacToken}`. Token is signed with the queue's `qrSecret` using HMAC. For DAILY rotation, the token includes the current date and changes each day. For FIXED rotation, the token is static.
- **Staff QR**: Encodes a URL `{baseUrl}/staff/join/{queueId}?token={hmacToken}`. Token is signed for staff-specific access.
- **Output**: PNG image served with appropriate Cache-Control headers (no-store for DAILY, 24-hour cache for FIXED).
- **Base URL**: Determined from `x-forwarded-host` and `x-forwarded-proto` headers for correct production URLs behind Railway's proxy.

### 7.7 Server-Sent Events (SSE)

- **Purpose**: Real-time event broadcasting without polling.
- **Architecture**: In-memory pub/sub using `ReadableStream`. Each SSE connection subscribes a `ReadableStreamDefaultController` to a queue-specific or session-specific channel.
- **Queue channel** (`/api/queues/[id]/sse`): broadcasts ticket lifecycle events (created, called, serving, completed, absent) to all subscribers (customers, display board, admin monitor). No auth required.
- **Session channel** (`/api/staff/sse/[sessionId]`): broadcasts ticket events to a specific staff session. Requires staff auth.
- **Event format**: JSON `{ type, data }` sent as SSE `data:` lines.
- **Cleanup**: Controllers are unsubscribed when the connection closes.

---

## 8. Internationalization (i18n)

### 8.1 Supported Languages

| Code | Language   | Display Name |
|------|------------|--------------|
| vi   | Vietnamese | Tieng Viet   |
| en   | English    | English      |
| fr   | French     | Francais     |
| es   | Spanish    | Espanol      |
| zh   | Chinese    | Zhongwen     |
| tl   | Filipino   | Filipino     |
| th   | Thai       | Thai         |

### 8.2 Default Language

Vietnamese (`vi`) is the default locale.

### 8.3 Translation Approach

- **Library**: `next-intl` v3.
- **Translation files**: JSON files stored in `src/i18n/locales/` (one per language: `vi.json`, `en.json`, `fr.json`, `es.json`, `zh.json`, `tl.json`, `th.json`).
- **Configuration**: `src/i18n/config.ts` defines the locale list, default locale, and human-readable locale names.
- **Language switcher**: `LanguageSwitcher` component renders a `<select>` dropdown. The selected locale is persisted to `localStorage` under the key `locale`. Changing the language triggers a full page reload.
- **Current state**: The UI contains a mix of hardcoded Vietnamese strings (in page components and dashboard) and translatable strings. The i18n infrastructure is in place but not all strings have been extracted to translation files.

---

## 9. Deployment

### 9.1 Hosting Platform

**Railway** -- the application is deployed on Railway with PostgreSQL as a managed database.

### 9.2 Build and Start

| Command         | Description                  |
|-----------------|------------------------------|
| `npm run build` | `next build`                 |
| `npm run start` | `next start`                 |
| `npm run dev`   | `next dev --turbopack`       |

### 9.3 Database Commands

| Command              | Description                             |
|----------------------|-----------------------------------------|
| `npm run db:generate`| `prisma generate` -- regenerate client. |
| `npm run db:migrate` | `prisma migrate dev` -- apply migrations.|
| `npm run db:push`    | `prisma db push` -- push schema changes. |
| `npm run db:studio`  | `prisma studio` -- open database GUI.    |

### 9.4 Environment Variables

| Variable                           | Required | Description                                                 |
|------------------------------------|----------|-------------------------------------------------------------|
| `DATABASE_URL`                     | Yes      | PostgreSQL connection string.                               |
| `AUTH_SECRET` / `NEXTAUTH_SECRET`  | Yes      | Secret for NextAuth session encryption and CAPTCHA signing. |
| `NEXTAUTH_URL`                     | Yes      | Canonical URL of the application (e.g., `https://queueapp.up.railway.app`). |
| `AUTH_GOOGLE_ID`                   | No       | Google OAuth client ID (enables Google login when set).     |
| `AUTH_GOOGLE_SECRET`               | No       | Google OAuth client secret.                                 |
| `CLOUDINARY_CLOUD_NAME`           | No       | Cloudinary cloud name (enables cloud logo storage).         |
| `CLOUDINARY_API_KEY`              | No       | Cloudinary API key.                                         |
| `CLOUDINARY_API_SECRET`           | No       | Cloudinary API secret.                                      |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`    | No       | VAPID public key for web push (enables push notifications). |
| `VAPID_PRIVATE_KEY`              | No       | VAPID private key for web push.                             |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID`  | No       | Google AdSense publisher ID.                                |
| `NEXT_PUBLIC_ADSENSE_SLOT_LANDING`| No      | AdSense slot ID for landing page.                           |
| `NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER`| No     | AdSense slot ID for customer pages.                         |
| `NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY`| No      | AdSense slot ID for display board.                          |
| `NEXT_PUBLIC_ADSENSE_SLOT_STAFF` | No       | AdSense slot ID for staff pages.                            |
| `CAPTCHA_SECRET`                  | No       | Separate HMAC secret for CAPTCHA tokens (falls back to AUTH_SECRET). |

### 9.5 Node.js Version

Minimum required: **Node.js >= 20.9.0** (specified in `package.json` engines).

### 9.6 Infrastructure Notes

- QR codes use `x-forwarded-host` and `x-forwarded-proto` headers to generate production URLs behind Railway's reverse proxy.
- The SSE implementation uses in-memory pub/sub, which works on a single instance. Horizontal scaling would require an external message broker (e.g., Redis Pub/Sub).
- Cloudinary integration is optional; the application falls back to local file storage when Cloudinary credentials are not configured.
- The health check endpoint at `/api/health` can be used for Railway deployment monitoring.
