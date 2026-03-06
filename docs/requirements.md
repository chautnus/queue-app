# Tài liệu Yêu cầu Chức năng – Queue App

> **Phiên bản:** 1.0  
> **Ngày:** 2026-03-06  
> **Ngôn ngữ:** Tiếng Việt  
> **Nền tảng:** Next.js 16 + Prisma (SQLite) + NextAuth + Tailwind CSS 4  
> **URL production:** https://queue-app-production.up.railway.app

---

## 1. Tổng quan hệ thống

Queue App là hệ thống quản lý hàng đợi số dành cho các cơ sở dịch vụ (phòng khám, ngân hàng, cơ quan hành chính, v.v.). Khách hàng lấy số thứ tự qua QR code, nhân viên gọi số tự động, hệ thống tính toán và hiển thị thời gian chờ dự kiến theo thời gian thực.

### 1.1 Các vai trò trong hệ thống

| Vai trò | Mô tả |
|---|---|
| **Admin** | Quản lý hàng đợi, cấu hình hệ thống, xem báo cáo |
| **Nhân viên (Staff)** | Ngồi tại quầy, gọi số và phục vụ khách hàng |
| **Khách hàng** | Quét QR lấy số, theo dõi trạng thái trên điện thoại |

---

## 2. Chức năng đã triển khai (v1.0)

### 2.1 Quản lý tài khoản Admin

| ID | Chức năng | Mô tả | Trạng thái |
|---|---|---|---|
| ADM-01 | Đăng ký Admin | Tạo tài khoản admin với email/password | ✅ Done |
| ADM-02 | Đăng nhập | JWT session, cookie bảo mật | ✅ Done |
| ADM-03 | Hồ sơ cá nhân | Xem/sửa tên, email | ✅ Done |
| ADM-04 | Logo đơn vị | Upload ảnh logo, lưu base64 trong DB, hiển thị trên QR và màn hình khách | ✅ Done |

### 2.2 Quản lý hàng đợi

| ID | Chức năng | Mô tả | Trạng thái |
|---|---|---|---|
| QUE-01 | Tạo hàng đợi | Tên, giờ mở/đóng, thời gian xử lý TB, số cửa | ✅ Done |
| QUE-02 | Sửa hàng đợi | Cập nhật toàn bộ thông tin | ✅ Done |
| QUE-03 | Xóa hàng đợi | Xóa kèm toàn bộ entries và sessions | ✅ Done |
| QUE-04 | Lịch làm việc chi tiết | Cấu hình giờ mở/đóng riêng cho từng ngày trong tuần | ✅ Done |
| QUE-05 | QR Code cố định | QR không đổi, khách lưu lại dùng lại | ✅ Done |
| QUE-06 | QR Code hàng ngày | QR thay đổi mỗi ngày để tăng bảo mật | ✅ Done |
| QUE-07 | Kích hoạt/tắt hàng đợi | Bật/tắt nhanh mà không xóa dữ liệu | ✅ Done |
| QUE-08 | Cài đặt thời gian chờ | Ngưỡng cập nhật (phút) + số khách kiểm tra lại | ✅ Done |

### 2.3 Màn hình giám sát (Admin)

| ID | Chức năng | Mô tả | Trạng thái |
|---|---|---|---|
| MON-01 | Danh sách số thứ tự | Xem tất cả khách trong ngày, lọc theo trạng thái | ✅ Done |
| MON-02 | Cập nhật trạng thái | Admin có thể đổi trạng thái entry (waiting/called/completed/cancelled) | ✅ Done |
| MON-03 | Tự động làm mới | Màn hình giám sát tự refresh mỗi 10 giây | ✅ Done |
| MON-04 | Thống kê nhanh | Số người đang chờ, đang phục vụ, đã xong | ✅ Done |

### 2.4 Khách hàng – Tham gia hàng đợi

| ID | Chức năng | Mô tả | Trạng thái |
|---|---|---|---|
| CUS-01 | Quét QR tham gia | Không cần app, dùng trình duyệt | ✅ Done |
| CUS-02 | Cấp số thứ tự | Tự tăng trong ngày, reset 0h hôm sau | ✅ Done |
| CUS-03 | Mã xác nhận 4 số | Để nhân viên xác minh đúng người | ✅ Done |
| CUS-04 | Nhận diện thiết bị | deviceId lưu localStorage, mỗi thiết bị 1 số/ngày/hàng đợi | ✅ Done |
| CUS-05 | Xem lại số thứ tự | Quét lại QR bất cứ lúc nào để xem trạng thái | ✅ Done |
| CUS-06 | Đếm ngược thời gian chờ | Countdown tự giảm mỗi giây dựa trên estimatedServedAt | ✅ Done |
| CUS-07 | Cập nhật thời gian tự động | Poll 10 giây, cập nhật nếu hệ thống tính lại | ✅ Done |
| CUS-08 | Thông báo được gọi | Màn hình pulse xanh lá khi status = 'called' | ✅ Done |
| CUS-09 | Kiểm tra giờ mở cửa | Từ chối tham gia ngoài giờ hoạt động | ✅ Done |

### 2.5 Nhân viên – Ca làm việc

| ID | Chức năng | Mô tả | Trạng thái |
|---|---|---|---|
| STF-01 | Đăng ký nhân viên | Tài khoản riêng, tách biệt admin | ✅ Done |
| STF-02 | Đăng nhập nhân viên | Session riêng (basePath /api/staff-auth) | ✅ Done |
| STF-03 | Quét QR nhân viên | Quét QR riêng để vào đúng hàng đợi | ✅ Done |
| STF-04 | Chọn số cửa | Chọn cửa khi bắt đầu ca | ✅ Done |
| STF-05 | Gọi khách tự động | Hệ thống tự tìm số thứ tự nhỏ nhất đang chờ | ✅ Done |
| STF-06 | Hiển thị mã xác nhận | Hiện 4 số để kiểm tra khách đúng | ✅ Done |
| STF-07 | Hoàn thành phục vụ | Đánh dấu done, về trạng thái idle | ✅ Done |
| STF-08 | Tạm nghỉ | Pause, không nhận khách mới | ✅ Done |
| STF-09 | Kết thúc ca | Kết thúc session trong ngày | ✅ Done |
| STF-10 | Auto-timeout | Nếu > 2× thời gian xử lý TB không bấm gì → tự hoàn thành | ✅ Done |
| STF-11 | Tính lại thời gian chờ | Sau mỗi complete/next/end: recalculate N khách đầu | ✅ Done |

### 2.6 Hạ tầng & Triển khai

| ID | Chức năng | Mô tả | Trạng thái |
|---|---|---|---|
| INF-01 | PWA | Cài được trên điện thoại như app | ✅ Done |
| INF-02 | Railway deploy | Tự động build & deploy khi push GitHub | ✅ Done |
| INF-03 | SQLite persistence | Volume mount tại /data | ✅ Done |
| INF-04 | Prisma migrations | Tự chạy migrate deploy khi khởi động container | ✅ Done |
| INF-05 | Múi giờ Việt Nam | Tất cả tính toán giờ dùng Asia/Ho_Chi_Minh | ✅ Done |

---

## 3. Yêu cầu chức năng đề xuất (Roadmap)

### 3.1 Màn hình hiển thị công cộng (Kiosk/Display Mode) 🖥️

**Mô tả:** Màn hình lớn đặt tại phòng chờ, hiển thị số đang được gọi tại từng cửa.

**Chi tiết:**
- URL riêng: `/display/[queueId]` – không yêu cầu đăng nhập
- Hiển thị theo dạng bảng: Cửa 1 – Số XX | Cửa 2 – Số YY | ...
- Tự refresh mỗi 5 giây
- Âm thanh thông báo khi có số mới được gọi (Web Audio API)
- Hỗ trợ fullscreen, thiết kế chữ lớn dễ đọc từ xa
- Có thể nhúng logo đơn vị

**Model cần thêm:** Không cần model mới, query từ `StaffSession + QueueEntry` hiện tại.

**Ưu tiên:** ⭐⭐⭐⭐ Cao – rất cần thiết để vận hành thực tế

---

### 3.2 Thông báo đến lượt (Push Notification) 🔔

**Mô tả:** Thông báo đẩy đến điện thoại khách khi sắp/đến lượt phục vụ.

**Chi tiết:**
- Web Push API (không cần app native)
- Thông báo khi:
  - Còn N người trước (cấu hình, VD: 3 người)
  - Đúng lúc được gọi
- Khách phải đồng ý nhận thông báo khi tham gia hàng đợi
- Lưu push subscription trong DB

**Schema mới:**
```prisma
model PushSubscription {
  id         String   @id @default(cuid())
  entryId    String
  endpoint   String
  p256dh     String
  auth       String
  createdAt  DateTime @default(now())
}
```

**Ưu tiên:** ⭐⭐⭐⭐ Cao – cải thiện trải nghiệm khách hàng đáng kể

---

### 3.3 Phân tích & Báo cáo (Analytics) 📊

**Mô tả:** Dashboard thống kê cho admin theo dõi hiệu suất.

**Chi tiết:**
- Báo cáo theo ngày/tuần/tháng:
  - Tổng số khách phục vụ
  - Thời gian chờ trung bình thực tế vs dự kiến
  - Giờ cao điểm (biểu đồ cột theo giờ)
  - Tỷ lệ bỏ hàng đợi (cancelled/total)
- Hiệu suất theo nhân viên:
  - Số khách đã phục vụ
  - Thời gian phục vụ trung bình
  - Số ca làm việc
- Export CSV/Excel
- So sánh các hàng đợi với nhau

**Schema cần thêm:** `calledAt` đã có trong QueueEntry, cần thêm `completedAt` để tính thời gian thực.

**Ưu tiên:** ⭐⭐⭐ Trung bình – quan trọng với quản lý nhưng không ảnh hưởng vận hành hàng ngày

---

### 3.4 Xử lý No-show (Khách không đến) 🚶

**Mô tả:** Khi nhân viên gọi nhưng khách không đến, có thể đánh dấu "vắng" và gọi người tiếp theo.

**Chi tiết:**
- Thêm trạng thái `absent` vào QueueEntry
- Khi gọi khách: có nút **"Khách vắng mặt"** bên cạnh **"Gọi tiếp"**
- Sau khi đánh dấu vắng: tự động gọi số tiếp theo
- Tuỳ chọn admin: cho phép khách vắng được gọi lại (đưa về cuối hàng) hay xóa luôn
- Giới hạn: mỗi số được gọi lại tối đa 1 lần

**Schema:**
```prisma
// Thêm vào QueueEntry:
absentAt   DateTime? // thời điểm bị đánh dấu vắng
noShowCount Int @default(0) // số lần không đến
```

**Ưu tiên:** ⭐⭐⭐⭐ Cao – rất thường gặp trong thực tế

---

### 3.5 Giới hạn kích thước hàng đợi ⛔

**Mô tả:** Đặt giới hạn tối đa số người trong hàng đợi để tránh quá tải.

**Chi tiết:**
- Admin cấu hình `maxQueueSize` cho mỗi hàng đợi (0 = không giới hạn)
- Khi đủ người: từ chối đăng ký mới, hiển thị thông báo cho khách
- Tùy chọn: hiển thị thời gian mở lại dự kiến

**Schema:**
```prisma
// Thêm vào Queue:
maxQueueSize Int @default(0) // 0 = không giới hạn
```

**Ưu tiên:** ⭐⭐⭐ Trung bình

---

### 3.6 Vé ưu tiên (Priority Ticket) 🏅

**Mô tả:** Một số khách được ưu tiên (người cao tuổi, tàn tật, bệnh nặng) được xếp lên trước.

**Chi tiết:**
- Nhân viên/admin có thể tạo vé ưu tiên trực tiếp từ dashboard
- Vé ưu tiên có số thứ tự nhỏ hơn số thường (VD: P01, P02...) hoặc có flag ưu tiên
- Hệ thống gọi vé ưu tiên trước vé thường
- Hiển thị khác biệt trên màn hình kiosk

**Schema:**
```prisma
// Thêm vào QueueEntry:
isPriority Boolean @default(false)
priorityReason String? // lý do ưu tiên
```

**Ưu tiên:** ⭐⭐⭐ Trung bình – phụ thuộc ngành nghề

---

### 3.7 Tạm dừng/Mở lại hàng đợi bởi Admin ⏸️

**Mô tả:** Admin có thể tạm dừng toàn bộ hàng đợi (không phải chỉ tắt), ví dụ khi nghỉ trưa.

**Chi tiết:**
- Trạng thái `paused` cho Queue (khác với `isActive = false`)
- Khi paused: từ chối đăng ký mới, hiển thị "Hàng đợi tạm dừng. Dự kiến tiếp tục lúc HH:MM"
- Admin đặt thời gian mở lại tự động
- Nhân viên vẫn có thể tiếp tục phục vụ những người đã có số

**Schema:**
```prisma
// Thêm vào Queue:
pausedUntil DateTime? // null = không pause, có giá trị = pause đến thời điểm này
pauseMessage String?  // thông báo cho khách khi queue bị pause
```

**Ưu tiên:** ⭐⭐⭐ Trung bình

---

### 3.8 Đánh giá sau phục vụ (Customer Feedback) ⭐

**Mô tả:** Khách hàng được mời đánh giá chất lượng phục vụ sau khi hoàn thành.

**Chi tiết:**
- Sau khi status chuyển sang `completed`, màn hình khách hiện form đánh giá nhanh
- Thang điểm: 1–5 sao + comment tuỳ chọn
- Admin xem báo cáo feedback theo nhân viên, theo ngày
- Không bắt buộc (skip được)

**Schema mới:**
```prisma
model Feedback {
  id          String     @id @default(cuid())
  entryId     String     @unique
  entry       QueueEntry @relation(fields: [entryId], references: [id])
  rating      Int        // 1-5
  comment     String?
  createdAt   DateTime   @default(now())
}
```

**Ưu tiên:** ⭐⭐ Thấp – nice-to-have

---

### 3.9 Tìm kiếm & Lọc trong Dashboard Admin 🔍

**Mô tả:** Tìm kiếm và lọc danh sách hàng đợi, lịch sử khách.

**Chi tiết:**
- Tìm kiếm hàng đợi theo tên
- Lọc entries theo ngày, trạng thái, số thứ tự
- Phân trang khi có nhiều records
- Export danh sách ra CSV

**Ưu tiên:** ⭐⭐⭐ Trung bình – cần thiết khi dữ liệu lớn

---

### 3.10 Multi-Admin / Phân quyền 👥

**Mô tả:** Một đơn vị có nhiều admin với vai trò khác nhau.

**Chi tiết:**
- Roles: `superadmin` (toàn quyền) | `manager` (xem báo cáo, không xóa) | `operator` (chỉ giám sát)
- Invite admin phụ qua email
- Log thay đổi (audit trail)

**Schema:**
```prisma
// Thêm vào Admin:
role String @default("superadmin") // superadmin | manager | operator
invitedBy String? // id của admin đã invite
```

**Ưu tiên:** ⭐⭐ Thấp – chỉ cần khi quy mô lớn

---

### 3.11 Rate Limiting & Bảo mật API 🔒

**Mô tả:** Bảo vệ API khỏi spam và abuse.

**Chi tiết:**
- Rate limit: max 10 requests/phút/IP cho `/api/join`
- Captcha ẩn (honeypot) cho form tham gia hàng đợi
- Validate và sanitize tất cả input
- Giới hạn 1 số thứ tự/thiết bị/ngày/hàng đợi (đã có, cần kiểm tra bypass)

**Thư viện:** `next-rate-limit` hoặc middleware custom

**Ưu tiên:** ⭐⭐⭐⭐ Cao – cần trước khi ra production quy mô lớn

---

### 3.12 Hỗ trợ nhiều ngôn ngữ (i18n) 🌍

**Mô tả:** Giao diện khách hàng hỗ trợ nhiều ngôn ngữ (quan trọng nếu phục vụ khách nước ngoài).

**Chi tiết:**
- Tiếng Việt (mặc định)
- Tiếng Anh
- Tự động detect ngôn ngữ từ browser
- Nút chuyển ngôn ngữ trên màn hình khách

**Thư viện:** `next-intl`

**Ưu tiên:** ⭐⭐ Thấp – tuỳ theo ngành nghề

---

## 4. Ma trận ưu tiên

| Tính năng | Tác động UX | Độ phức tạp | Ưu tiên |
|---|---|---|---|
| 3.1 Kiosk Display | ⭐⭐⭐⭐⭐ | Thấp | **P0 – Làm ngay** |
| 3.4 No-show | ⭐⭐⭐⭐ | Thấp | **P0 – Làm ngay** |
| 3.2 Push Notification | ⭐⭐⭐⭐⭐ | Cao | **P1 – Quan trọng** |
| 3.11 Rate Limiting | ⭐⭐⭐ | Thấp | **P1 – Quan trọng** |
| 3.5 Max Queue Size | ⭐⭐⭐ | Rất thấp | **P1 – Quan trọng** |
| 3.3 Analytics | ⭐⭐⭐⭐ | Trung bình | **P2 – Sau này** |
| 3.7 Pause Queue | ⭐⭐⭐ | Thấp | **P2 – Sau này** |
| 3.9 Search/Filter | ⭐⭐⭐ | Thấp | **P2 – Sau này** |
| 3.6 Priority Ticket | ⭐⭐⭐ | Trung bình | **P2 – Sau này** |
| 3.8 Feedback | ⭐⭐ | Thấp | **P3 – Nice to have** |
| 3.10 Multi-Admin | ⭐⭐ | Cao | **P3 – Nice to have** |
| 3.12 i18n | ⭐⭐ | Trung bình | **P3 – Nice to have** |

---

## 5. Luồng nghiệp vụ chính

### 5.1 Luồng khách hàng
```
Quét QR → Xem thông tin hàng đợi → Xác nhận tham gia
→ Nhận số thứ tự + mã 4 số → Theo dõi countdown
→ Nhận thông báo sắp đến lượt [đề xuất] → Được gọi → Đến quầy → Hoàn thành
→ Đánh giá [đề xuất]
```

### 5.2 Luồng nhân viên
```
Đăng nhập → Quét QR nhân viên → Chọn cửa → Bắt đầu ca
→ [Lặp lại] Bấm "Gọi khách tiếp" → Xác nhận mã 4 số với khách
→ Phục vụ → Bấm "Gọi tiếp" / "Hoàn thành" / "Khách vắng" [đề xuất]
→ Tạm nghỉ khi cần → Kết thúc ca
```

### 5.3 Luồng admin
```
Đăng nhập → Tạo hàng đợi → Cấu hình giờ, số cửa, thời gian xử lý
→ In/chia sẻ QR code → Giám sát realtime → Xem báo cáo [đề xuất]
```

---

## 6. Yêu cầu phi chức năng

| Yêu cầu | Mục tiêu |
|---|---|
| **Hiệu năng** | Trang khách load < 2s trên 3G |
| **Khả năng mở rộng** | Hỗ trợ 10 hàng đợi song song, mỗi hàng 200 khách/ngày |
| **Độ tin cậy** | Uptime > 99%, tự phục hồi sau restart |
| **Bảo mật** | HTTPS, JWT, bcrypt password, no SQL injection |
| **Khả năng sử dụng** | Khách hàng không cần cài app, không cần tài khoản |
| **Tương thích** | iOS Safari, Android Chrome, desktop browsers |
| **Dữ liệu** | SQLite với Railway Volume, backup thủ công |
| **Múi giờ** | Tất cả tính toán theo Asia/Ho_Chi_Minh (UTC+7) |

---

## 7. Hạn chế kỹ thuật hiện tại

| Hạn chế | Lý do | Giải pháp tương lai |
|---|---|---|
| SQLite (single file) | Đơn giản, dễ triển khai | Migrate sang PostgreSQL nếu cần scale |
| Không có realtime WebSocket | Dùng polling | Xem xét Server-Sent Events hoặc WebSocket |
| Không có email/SMS | Chưa tích hợp provider | Twilio / Resend / SendGrid |
| Ảnh logo base64 trong DB | Đơn giản, không cần CDN | Migrate sang S3/Cloudinary nếu ảnh lớn |
| Không có backup tự động | Chưa cấu hình | Railway scheduled job hoặc cron |

---

*Tài liệu này được tạo tự động dựa trên codebase và yêu cầu nghiệp vụ thực tế. Cập nhật lần cuối: 2026-03-06.*
