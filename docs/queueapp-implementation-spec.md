# QueueApp Technical Implementation Spec

**Version:** 1.2.5  
**Status:** Finalized for Dev  
**Related Doc:** [QueueApp Product Requirements Document](./queueapp-product-spec.md)

## 1. Kiến trúc hệ thống (Technical Architecture)

### 1.1 Stack & Runtime Pinning
- **Runtime:** Node.js 22.x (LTS).
- **Framework:** Next.js 16.0.x (App Router).
- **ORM:** Prisma 6.x.
- **Event Bus:** Redis 7.x Pub/Sub cho cơ chế SSE Distributed Fan-out.

### 1.2 Chiến lược Real-time (SSE)
- **Cấu trúc:** Server-Sent Events (SSE).
- **Fan-out:** Mọi instance ứng dụng subscribe vào channel Redis chung. Khi trạng thái ticket đổi, event được publish lên Redis và broadcast tới các client đang giữ kết nối SSE cục bộ.
- **Resilience:** Client triển khai Exponential Backoff với Jitter khi reconnect. Sau khi kết nối lại, client bắt buộc fetch snapshot trạng thái mới nhất.

## 2. Bảo mật & Xác thực (Auth & Security)

### 2.1 Session & JWT
- **Lớp bảo mật:** Auth.js (NextAuth v5) với Stateless JWT.
- **Cookies:** Bắt buộc `__Host-` prefix trong Production.
- **Rolling Refresh:** Khi token còn < 2 giờ hiệu lực, client/middleware chủ động kích hoạt refresh flow (Application-level behavior).

### 2.2 Security Controls
- **CORS/CSRF:** Chặn mọi cross-origin không nằm trong whitelist. Sử dụng SameSite=Lax/Strict.
- **QR Integrity:** Payload URL trong mã QR chứa HMAC signature được ký bằng `qrSecret`. Mọi thay đổi tham số URL không hợp lệ sẽ bị server từ chối.
- **Rate Limiting:** `POST /api/queues/[id]/join`: 5 req/phút (IP + Fingerprint).
- **Idempotency:** Bắt buộc header `Idempotency-Key` (TTL 120s).

## 3. Dữ liệu & Concurrency

### 3.1 Concurrency (DailyTicketCounter)
Sử dụng Pessimistic Locking (`SELECT ... FOR UPDATE`) trong PostgreSQL để cấp số thứ tự. Số thứ tự chỉ được commit khi bản ghi Ticket được lưu thành công (Gapless Numbering).

### 3.2 Partitioning & Retention
- Sử dụng PostgreSQL Declarative Partitioning theo cột `createdAt`.
- **Interval:** Hàng Tháng.
- **Retention:** Giữ tháng hiện tại + tháng trước đó (30-60 ngày). Detach và xóa partition cũ vào ngày đầu tháng thứ 3.

## 4. API Contract & Observability

### 4.1 Response Envelope
Mọi endpoint JSON (trừ stream/binary) phải trả về cấu trúc chuẩn hóa:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "ISO8601",
    "requestId": "uuid"
  }
}
```

### 4.2 Monitoring & Health
- **Readiness:** `/health/ready` (Kiểm tra DB + Redis).
- **Liveness:** `/health/live` (Kiểm tra process uptime).
- **Degraded Mode:** Nếu Redis lỗi, hệ thống cho phép Join Queue (DB) nhưng thông báo lỗi realtime và fallback sang polling 15s cho khách hàng.

## 5. Tiêu chuẩn Kỹ thuật (Engineering Standards)
- **Module Size:** Giới hạn file mã nguồn trong khoảng 250 dòng. Logic phức tạp phải tách module.
- **Audit Logging:** Ghi log mọi hành động nhạy cảm của Staff/Admin kèm IP và `requestId`.
- **PII Security:** Thực hiện Masking PII cho dữ liệu nhạy cảm trong logs.
