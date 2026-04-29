# QueueApp Product Requirements Document (PRD)

**Version:** 2.0.0  
**Status:** Rewritten for Product, Design, and Engineering Alignment  
**Related Documents:** `queueapp-ui-spec.md`, `queueapp-implementation-spec-detailed.md`

## Table of Contents

- [Product Overview](#product-overview)
- [Vision and Objectives](#vision-and-objectives)
  - [Product Vision](#product-vision)
  - [Core Objectives](#core-objectives)
- [Problem Statement](#problem-statement)
- [Target Users](#target-users)
  - [Admin](#admin)
  - [Staff](#staff)
  - [Customer](#customer)
- [Product Scope](#product-scope)
  - [In Scope](#in-scope)
  - [Out of Scope](#out-of-scope)
- [Core Business Rules](#core-business-rules)
  - [Queue Rules](#queue-rules)
  - [Ticket Rules](#ticket-rules)
  - [Ticket Status Rules](#ticket-status-rules)
  - [Streams and Counters](#streams-and-counters)
  - [Customer Data Collection](#customer-data-collection)
  - [Notifications and Rating](#notifications-and-rating)
- [Feature Set](#feature-set)
  - [Queue Administration](#queue-administration)
  - [Service Configuration](#service-configuration)
  - [Customer Ticketing](#customer-ticketing)
  - [Real-time System](#real-time-system)
  - [Notifications and PWA](#notifications-and-pwa)
  - [Reporting and Analytics](#reporting-and-analytics)
  - [Branding and Static Content](#branding-and-static-content)
- [User Journeys](#user-journeys)
  - [Admin Journey](#admin-journey)
  - [Staff Journey](#staff-journey)
  - [Customer Journey](#customer-journey)
- [Screen Inventory](#screen-inventory)
  - [Public Screens](#public-screens)
  - [Admin Screens](#admin-screens)
  - [Staff Screens](#staff-screens)
- [Product Acceptance Criteria](#product-acceptance-criteria)
  - [Core Acceptance Criteria](#core-acceptance-criteria)
  - [Admin Acceptance Criteria](#admin-acceptance-criteria)
  - [Staff Acceptance Criteria](#staff-acceptance-criteria)
  - [Customer Acceptance Criteria](#customer-acceptance-criteria)
- [Document Strategy](#document-strategy)


## Product Overview

QueueApp là nền tảng quản lý hàng đợi kỹ thuật số theo hướng mobile-first, cho phép khách hàng quét QR để lấy số và theo dõi lượt chờ trực tiếp trên điện thoại mà không cần cài đặt ứng dụng. [file:1] Sản phẩm hướng đến việc thay thế vé giấy, giảm tình trạng chờ vật lý, tăng khả năng kiểm soát vận hành cho doanh nghiệp và tạo nền tảng dữ liệu để tối ưu dịch vụ theo thời gian thực. [file:1]

## Vision and Objectives

### Product Vision
QueueApp tồn tại để thay thế mô hình xếp hàng thủ công bằng trải nghiệm hàng đợi số hóa đơn giản, dễ triển khai và không phụ thuộc vào phần cứng chuyên dụng. [file:1] Giá trị cốt lõi của sản phẩm là không cần app native, không cần máy lấy số riêng và vẫn cung cấp khả năng theo dõi trạng thái hàng đợi theo thời gian thực trên web. [file:1]

### Core Objectives
- Giảm thời gian chờ vật lý bằng cách cho phép khách rời điểm chờ nhưng vẫn theo dõi được thứ tự phục vụ. [file:1]
- Tăng hiệu suất phục vụ tại quầy nhờ staff portal và monitor realtime. [file:1]
- Cung cấp dữ liệu vận hành như wait time, service time, absent rate và số ticket hoàn thành để doanh nghiệp đánh giá hiệu suất. [file:1]
- Tạo nền tảng có thể mở rộng thành SaaS queue platform và hỗ trợ mô hình doanh thu như branding hoặc AdSense. [file:1]

## Problem Statement

Các mô hình hàng đợi truyền thống thường khiến khách phải đứng chờ tại chỗ hoặc liên tục quan sát bảng số, trong khi nhân viên khó điều phối nhiều luồng dịch vụ và doanh nghiệp thiếu dữ liệu vận hành để tối ưu quy trình. [file:1] Vé giấy cũng gây lãng phí, dễ thất lạc và khó mở rộng khi doanh nghiệp có nhiều quầy hoặc nhiều điểm phục vụ. [file:1]

## Target Users

### Admin
Admin là người thiết lập và vận hành queue, với nhu cầu chính là tạo queue nhanh, cấu hình stream và counter linh hoạt, theo dõi realtime, quản lý QR và xem báo cáo. [file:1] Hành trình điển hình của admin là đăng ký, đăng nhập, tạo queue, cấu hình luồng phục vụ, publish QR, theo dõi LiveMonitor và xuất báo cáo. [file:1]

### Staff
Staff là nhân viên tại quầy, cần thao tác nhanh để gọi số, phục vụ đúng stream, xác thực khách và xử lý các tình huống như absent, pause hoặc end session. [file:1] Hành trình chính của staff là đăng nhập portal, tham gia queue session, chọn counter và stream, gọi khách tiếp theo, xác thực mã 4 số và kết thúc ca. [file:1]

### Customer
Customer là người lấy số qua QR, không cần đăng ký tài khoản và cần biết còn bao lâu đến lượt. [file:1] Hành trình của customer gồm quét QR, chọn dịch vụ, giải CAPTCHA, điền form nếu cần, nhận ticket, theo dõi trạng thái, nhận push notification và gửi đánh giá sau khi hoàn tất. [file:1]

## Product Scope

### In Scope
Phiên bản hiện tại bao gồm quản lý nhiều queue, nhiều stream và nhiều counter trong cùng queue, luồng khách hàng mobile-first bằng QR, ticket realtime qua SSE, staff portal, display board công cộng, báo cáo ngày, CSV export, web push notification, branding, custom fields và đa ngôn ngữ. [file:1]

### Out of Scope
Phiên bản hiện tại không bao gồm native mobile app, thanh toán tích hợp, đặt lịch trước giờ, AI forecast staffing, multi-tenant billing/subscription hoàn chỉnh và offline-first local sync. [file:1]

## Core Business Rules

### Queue Rules
Queue có bốn trạng thái chính là `INACTIVE`, `ACTIVE`, `PAUSED` và `CLOSED`. [file:1] Chỉ queue đang ở trạng thái phù hợp mới nhận khách mới, và trạng thái queue phải được phản ánh rõ ràng trên các bề mặt vận hành như customer page, live monitor và staff flow. [file:1]

### Ticket Rules
Mỗi thiết bị hoặc trình duyệt chỉ được phép giữ một ticket đang hoạt động trong mỗi queue. [file:1] Ticket thuộc đúng một stream tại thời điểm tạo, có mã xác thực 4 số để staff kiểm tra tại quầy, có số hiển thị theo format `prefix + zero-padded number` như `A042`, và chỉ có giá trị trong ngày vận hành hiện tại. [file:1]

### Ticket Status Rules
Ticket có các trạng thái `WAITING`, `CALLED`, `SERVING`, `COMPLETED`, `ABSENT` và `CANCELLED`. [file:1] Hệ thống phải lưu được timestamp theo từng giai đoạn để phục vụ realtime tracking và reporting. [file:1]

### Streams and Counters
Mỗi stream là một nhóm dịch vụ như khám tổng quát, tư vấn hoặc thu ngân, mỗi stream có thể có nhiều counter và có prefix vé riêng. [file:1] Một staff session có thể phục vụ nhiều stream tại một counter nếu cấu hình cho phép. [file:1]

### Customer Data Collection
Hệ thống hỗ trợ các trường hệ thống gồm tên, số điện thoại, email, tuổi và địa chỉ, đồng thời cho phép cấu hình custom fields với ba trạng thái `HIDDEN`, `OPTIONAL` và `REQUIRED`. [file:1] Việc hiển thị hay bắt buộc trường nào phải do queue configuration kiểm soát. [file:1]

### Notifications and Rating
Push notification chỉ được kích hoạt sau khi khách đã nhận ticket. [file:1] Mỗi ticket chỉ được đánh giá một lần, với rating từ 1 đến 5 và comment tùy chọn. [file:1]

## Feature Set

### Queue Administration
Admin có thể tạo queue bằng wizard 4 bước gồm Basic, Streams & Counters, Customer Settings và QR & Publish. [file:1] Queue hỗ trợ cấu hình tên, greeting, logo, timezone, business category, QR rotation type, slug tự động và các hành động activate, pause hoặc close. [file:1]

### Service Configuration
Queue hỗ trợ nhiều stream trong một queue, mỗi stream có average processing time, nhiều counter, thứ tự hiển thị và lịch theo tuần cho counter nếu cần. [file:1]

### Customer Ticketing
Khách hàng có thể lấy số theo stream, nhận ticket tuần tự theo stream/ngày, có verify code 4 số, theo dõi waiting ahead và ETA, đồng thời bị chặn duplicate ticket theo thiết bị trong cùng queue. [file:1]

### Real-time System
SSE được dùng cho customer page, display board, LiveMonitor và staff session để phản ánh vòng đời ticket gần như theo thời gian thực. [file:1]

### Notifications and PWA
Sản phẩm hỗ trợ VAPID-based web push, manifest, service worker, Add to Home Screen và xử lý push notification trong bối cảnh web app. [file:1]

### Reporting and Analytics
Bản hiện tại có daily summary report, detailed serving report, CSV export bao gồm custom fields và bộ lọc theo queue và ngày. [file:1] Các KPI gợi ý gồm average wait time, average service time, tickets completed per day, absent rate, active staff count, join conversion rate và rating average. [file:1]

### Branding and Static Content
QueueApp hỗ trợ upload logo, áp dụng default brand logo cho nhiều queue, các trang About, Terms, Privacy và AdSense slot theo vị trí hoặc theo từng queue. [file:1]

## User Journeys

### Admin Journey
1. Đăng ký tài khoản. [file:1]
2. Đăng nhập dashboard. [file:1]
3. Tạo queue mới. [file:1]
4. Cấu hình stream, counter và customer settings. [file:1]
5. Publish customer QR và staff QR. [file:1]
6. Theo dõi hoạt động qua LiveMonitor. [file:1]
7. Xem báo cáo cuối ngày hoặc xuất CSV. [file:1]

### Staff Journey
1. Đăng nhập staff portal. [file:1]
2. Tham gia queue session. [file:1]
3. Chọn stream và counter. [file:1]
4. Gọi ticket tiếp theo. [file:1]
5. Xác thực khách bằng display number và verify code. [file:1]
6. Complete hoặc absent ticket. [file:1]
7. Pause, resume hoặc end session. [file:1]

### Customer Journey
1. Quét QR để vào queue page. [file:1]
2. Chọn stream nếu queue có nhiều dịch vụ. [file:1]
3. Giải CAPTCHA trước khi join. [file:1]
4. Điền thông tin nếu queue yêu cầu. [file:1]
5. Nhận ticket và mã xác thực. [file:1]
6. Theo dõi waiting ahead, ETA và trạng thái ticket trên điện thoại. [file:1]
7. Nhận push notification khi được gọi. [file:1]
8. Đến quầy để được phục vụ. [file:1]
9. Gửi rating sau khi hoàn tất. [file:1]

## Screen Inventory

### Public Screens
- Landing Page (`/`) [file:1]
- Login (`/login`) [file:1]
- Register (`/register`) [file:1]
- Customer Queue Page (`/q/[queueId]`) [file:1]
- Customer Guide (`/q/[queueId]/guide`) [file:1]
- Display Board (`/display/[queueId]`) [file:1]
- About (`/about`) [file:1]
- Terms (`/terms`) [file:1]
- Privacy (`/privacy`) [file:1]

### Admin Screens
- Dashboard Root (`/dashboard`) [file:1]
- Queue List (`/dashboard/queues`) [file:1]
- Create Queue (`/dashboard/queues/new`) [file:1]
- Queue Detail / LiveMonitor (`/dashboard/queues/[id]`) [file:1]
- Edit Queue (`/dashboard/queues/[id]/edit`) [file:1]
- Reports (`/dashboard/reports`) [file:1]
- Brand (`/dashboard/brand`) [file:1]
- Settings (`/dashboard/settings`) [file:1]

### Staff Screens
- Staff Login (`/staff/login`) [file:1]
- Staff Portal Home (`/staff`) [file:1]
- Staff Join Queue (`/staff/join/[queueId]`) [file:1]
- Staff Work Screen (`/staff/work/[sessionId]`) [file:1]

## Product Acceptance Criteria

### Core Acceptance Criteria
- Khách hàng lấy được số trong tối đa 3 bước chính sau khi vào queue page. [file:1]
- Ticket hiển thị rõ display number, verify code và trạng thái hiện tại. [file:1]
- Hành động gọi số của staff phải cập nhật gần như tức thời lên display board và customer page. [file:1]
- CSV export phải bao gồm đầy đủ custom fields đã thu thập. [file:1]
- Một thiết bị không thể giữ nhiều hơn 1 active ticket trong cùng queue. [file:1]

### Admin Acceptance Criteria
- Admin tạo queue thành công bằng wizard nhiều bước. [file:1]
- Admin có thể tải customer QR và staff QR. [file:1]
- Admin thấy được staff đang hoạt động cùng số lượng waiting và serving theo thời gian thực. [file:1]

### Staff Acceptance Criteria
- Staff có thể bắt đầu session, gọi next, đánh dấu absent, pause, resume và end session. [file:1]
- Staff có thể xác thực ticket đúng bằng display number và mã 4 số. [file:1]

### Customer Acceptance Criteria
- Customer không cần đăng ký tài khoản để lấy ticket. [file:1]
- Customer có thể xem trạng thái ticket và ETA trên điện thoại. [file:1]
- Customer có thể đăng ký push notification sau khi nhận số. [file:1]

## Document Strategy

Tài liệu này tập trung vào product intent, scope, nghiệp vụ, user journeys và acceptance criteria. [file:1] Toàn bộ hợp đồng giao diện, component contract, screen states và interaction rules đã được tách và tổ chức lại trong `queueapp-ui-spec.md` để giảm trùng lặp, giảm context overload và cải thiện khả năng điều hướng theo màn hình cho design, frontend và các AI coding tools. [file:1]
