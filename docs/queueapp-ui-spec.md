# QueueApp UI Specification

**Version:** 2.0.0  
**Status:** Rewritten UI contract for Design and Frontend  
**Related Documents:** `queueapp-prd-rewritten.md`, `queueapp-implementation-spec-detailed.md`

## Table of Contents

- [Purpose](#purpose)
- [Quick Jump by Route](#quick-jump-by-route)
- [UI Principles](#ui-principles)
- [Base Components](#base-components)
  - [Button](#button)
  - [Input](#input)
  - [Textarea](#textarea)
  - [Select and Dropdown](#select-and-dropdown)
  - [Checkbox and Multi-select](#checkbox-and-multi-select)
  - [Badge](#badge)
  - [Card](#card)
  - [Table](#table)
  - [Toast and Feedback Bar](#toast-and-feedback-bar)
  - [Modal and Confirm Dialog](#modal-and-confirm-dialog)
  - [Skeleton](#skeleton)
  - [Empty State](#empty-state)
  - [Error State Block](#error-state-block)
  - [QR Preview Block](#qr-preview-block)
  - [Ticket Display Block](#ticket-display-block)
- [Screen Template](#screen-template)
- [Public Screens](#public-screens)
  - [public-landing-page (`/`)](#public-landing-page-)
  - [public-login (`/login`)](#public-login-login)
  - [public-register (`/register`)](#public-register-register)
  - [public-customer-queue-page (`/q/[queueId]`)](#public-customer-queue-page-qqqueueid)
  - [public-customer-guide (`/q/[queueId]/guide`)](#public-customer-guide-qqqueueidguide)
  - [public-display-board (`/display/[queueId]`)](#public-display-board-displayqueueid)
  - [public-about (`/about`)](#public-about-about)
  - [public-terms (`/terms`)](#public-terms-terms)
  - [public-privacy (`/privacy`)](#public-privacy-privacy)
- [Admin Screens](#admin-screens)
  - [admin-queue-list (`/dashboard/queues`)](#admin-queue-list-dashboardqueues)
  - [admin-create-queue (`/dashboard/queues/new`)](#admin-create-queue-dashboardqueuesnew)
  - [admin-live-monitor (`/dashboard/queues/[id]`)](#admin-live-monitor-dashboardqueuesid)
  - [admin-edit-queue (`/dashboard/queues/[id]/edit`)](#admin-edit-queue-dashboardqueuesidedit)
  - [admin-reports (`/dashboard/reports`)](#admin-reports-dashboardreports)
  - [admin-brand (`/dashboard/brand`)](#admin-brand-dashboardbrand)
  - [admin-settings (`/dashboard/settings`)](#admin-settings-dashboardsettings)
- [Staff Screens](#staff-screens)
  - [staff-login (`/staff/login`)](#staff-login-stafflogin)
  - [staff-join-queue (`/staff/join/[queueId]`)](#staff-join-queue-staffjoinqueueid)
  - [staff-work-screen (`/staff/work/[sessionId]`)](#staff-work-screen-staffworksessionid)
- [Cross-screen Rules](#cross-screen-rules)
- [Notes for Implementation](#notes-for-implementation)

## Quick Jump by Route

### Public
- [`/`](#public-landing-page-)
- [`/login`](#public-login-login)
- [`/register`](#public-register-register)
- [`/q/[queueId]`](#public-customer-queue-page-qqqueueid)
- [`/q/[queueId]/guide`](#public-customer-guide-qqqueueidguide)
- [`/display/[queueId]`](#public-display-board-displayqueueid)
- [`/about`](#public-about-about)
- [`/terms`](#public-terms-terms)
- [`/privacy`](#public-privacy-privacy)

### Admin
- [`/dashboard/queues`](#admin-queue-list-dashboardqueues)
- [`/dashboard/queues/new`](#admin-create-queue-dashboardqueuesnew)
- [`/dashboard/queues/[id]`](#admin-live-monitor-dashboardqueuesid)
- [`/dashboard/queues/[id]/edit`](#admin-edit-queue-dashboardqueuesidedit)
- [`/dashboard/reports`](#admin-reports-dashboardreports)
- [`/dashboard/brand`](#admin-brand-dashboardbrand)
- [`/dashboard/settings`](#admin-settings-dashboardsettings)

### Staff
- [`/staff/login`](#staff-login-stafflogin)
- [`/staff/join/[queueId]`](#staff-join-queue-staffjoinqueueid)
- [`/staff/work/[sessionId]`](#staff-work-screen-staffworksessionid)


## Purpose

Tài liệu này là hợp đồng giao diện giữa Product, Design và Frontend cho QueueApp. [file:1] Mục tiêu là gom toàn bộ định nghĩa về màn hình, base components, layout blocks, state-dependent UI và interaction rules vào một nguồn chuẩn riêng để dev hoặc AI tools có thể truy cập trực tiếp đúng màn hình cần triển khai. [file:1]

## UI Principles

- Mobile-first cho toàn bộ bề mặt customer-facing. [file:1]
- Mọi data display lớn phải có loading, empty và error state. [file:1]
- Mọi form phải có validation state rõ ràng. [file:1]
- Toast không thay thế lỗi inline của form. [file:1]
- Mọi hành động destructive phải có confirm step. [file:1]
- Mọi dashboard table phải có phương án responsive trên màn hình nhỏ. [file:1]

## Base Components

### Button
Variants gồm `primary`, `secondary`, `ghost`, `danger` và `warning`. [file:1] Mọi button phải có các trạng thái default, hover, focus, active, disabled và loading; action chính của màn hình phải dùng `primary`, còn destructive actions phải dùng `danger` hoặc có confirm step. [file:1]

### Input
Input hỗ trợ các loại text, email, password, number, tel và time. [file:1] Mỗi input phải có label, input control, helper text tùy chọn, error text tùy chọn và hỗ trợ các trạng thái default, focus, filled, error, disabled, readonly. [file:1]

### Textarea
Textarea dùng cho greeting message, ghi chú và comment rating. [file:1] Component này phải có label, max length nếu áp dụng và error state rõ ràng. [file:1]

### Select and Dropdown
Select hoặc dropdown dùng cho stream selection, counter selection, queue selector và business category. [file:1] Component phải hỗ trợ default, open, selected, error, disabled và có scroll nội bộ khi danh sách dài. [file:1]

### Checkbox and Multi-select
Checkbox hoặc multi-select dùng cho stream multi-select trong staff session và các cấu hình customer fields. [file:1] Hit target phải phù hợp mobile và label phải đủ rõ để tránh chọn nhầm. [file:1]

### Badge
Badge dùng để biểu diễn queue status, session status và ticket status. [file:1] Badge không được dùng như button nếu không có affordance rõ ràng. [file:1]

### Card
Card là container chuẩn cho stat card, content card, action card, ticket card và empty-state card. [file:1] Card phải hỗ trợ title, body và optional actions. [file:1]

### Table
Table được dùng cho reports, staff performance và stream breakdown. [file:1] Table phải có loading, empty, error state và support responsive behavior trên mobile bằng horizontal scroll hoặc cardified rows. [file:1]

### Toast and Feedback Bar
Toast hoặc feedback bar dùng cho phản hồi ngắn sau action thành công hoặc thất bại. [file:1] Mặc định auto-dismiss sau 2.5 giây nếu không phải lỗi nghiêm trọng và không thay thế validation message inline. [file:1]

### Modal and Confirm Dialog
Modal hoặc confirm dialog được dùng cho close queue, end session, delete queue và các thao tác có tính phá hủy. [file:1] Mỗi dialog phải có title, body, confirm button và cancel button. [file:1]

### Skeleton
Skeleton được dùng cho loading state của card, table, QR preview và screen data. [file:1] Skeleton cần mô phỏng gần đúng bố cục thực để giảm layout jump. [file:1]

### Empty State
Empty state gồm illustration hoặc icon tùy chọn, title, description và primary action tùy chọn. [file:1] Thành phần này dùng cho tình huống chưa có queue, chưa có dữ liệu report hoặc chưa có ticket đang phục vụ. [file:1]

### Error State Block
Error state block gồm title ngắn, mô tả lỗi đơn giản và nút retry tùy chọn. [file:1] Không hiển thị raw system error cho end-user. [file:1]

### QR Preview Block
QR preview block gồm image preview, copy link action, download action và fallback nếu QR không render được. [file:1]

### Ticket Display Block
Ticket display block là component cốt lõi cho customer page, gồm display number, verify code, status badge, waiting ahead và ETA. [file:1]

## Screen Template

Mỗi màn hình trong tài liệu này tuân theo cùng một cấu trúc gồm mục tiêu màn hình, header/navigation, main content, footer nếu có, state-dependent UI và interaction rules. [file:1] Cách viết này kế thừa tinh thần accordion của PRD gốc nhưng được tách riêng để màn hình nào cũng có anchor ổn định và không lẫn với nghiệp vụ tổng quát. [file:1]

## Public Screens

### public-landing-page (`/`)
**Mục tiêu màn hình**  
Giới thiệu QueueApp và dẫn người dùng đến đăng ký hoặc đăng nhập. [file:1]

**Header / Navigation**  
Logo QueueApp, nút `Log In`, nút `Get Started` và top navigation cố định. [file:1]

**Main Content**  
Hero section với headline, subheadline và 2 CTA; phần How It Works ba bước; feature grid; CTA cuối trang và ad banner slot nếu áp dụng. [file:1]

**Footer**  
Liên kết About, Terms, Privacy, Contact và copyright text. [file:1]

**State-dependent UI**  
Màn hình này chủ yếu là nội dung tĩnh nên không bắt buộc loading state phức tạp; nếu logo hoặc hình ảnh lỗi thì fallback sang text hoặc placeholder. [file:1]

**Interaction Rules**  
Người dùng chưa auth bấm CTA sẽ được chuyển đến `/register`, còn người dùng đã auth sẽ được redirect vào `/dashboard/queues`. [file:1]

### public-login (`/login`)
**Mục tiêu màn hình**  
Cho phép người dùng đăng nhập vào hệ thống quản trị QueueApp. [file:1]

**Header / Navigation**  
Logo QueueApp và link chuyển sang Register. [file:1]

**Main Content**  
Auth card đặt giữa màn hình; các input gồm email và password; button `Login`; button `Continue with Google` nếu có hỗ trợ. [file:1]

**State-dependent UI**  
Loading state phải disable submit và hiển thị spinner trong nút; lỗi sai thông tin đăng nhập hiển thị inline trên form. [file:1]

**Interaction Rules**  
Submit hợp lệ đưa người dùng vào dashboard; nếu đã đăng nhập trước đó thì redirect thẳng vào dashboard. [file:1]

### public-register (`/register`)
**Mục tiêu màn hình**  
Cho phép người dùng tạo tài khoản quản trị mới. [file:1]

**Header / Navigation**  
Logo QueueApp và link quay lại Login. [file:1]

**Main Content**  
Auth card centered; input gồm name, email, password; button `Register`; Google OAuth button nếu có. [file:1]

**State-dependent UI**  
Loading state disable form; error state hiển thị validation hoặc email đã tồn tại; success có thể là redirect ngay hoặc feedback ngắn trước khi chuyển màn hình. [file:1]

**Interaction Rules**  
Chỉ submit khi dữ liệu hợp lệ; nếu người dùng đã authenticated thì không cho ở lại màn hình đăng ký. [file:1]

### public-customer-queue-page (`/q/[queueId]`)
**Mục tiêu màn hình**  
Là điểm vào chính để khách xem tình trạng queue, join hàng đợi hoặc tiếp tục theo dõi active ticket. [file:1]

**Header / Navigation**  
Queue logo, queue name và greeting message nếu có. [file:1]

**Main Content**  
`WaitInfo` block, stream selector nếu queue có nhiều stream, CTA lấy số, CAPTCHA card, customer form động, ticket display, push prompt, rating form sau khi hoàn tất và ad banner slot nếu dùng. [file:1]

**State-dependent UI**  
Phải có loading queue config, queue unavailable state, existing active ticket state, joining state với spinner và join failure state. [file:1]

**Interaction Rules**  
Nếu người dùng đã có active ticket thì ưu tiên hiển thị ticket hiện tại; nếu queue đang paused hoặc closed thì disable join CTA; push prompt chỉ hiện sau khi tạo ticket; rating chỉ hiện khi ticket đã completed. [file:1]

### public-customer-guide (`/q/[queueId]/guide`)
**Mục tiêu màn hình**  
Hướng dẫn khách cách sử dụng queue trước khi vào thao tác chính. [file:1]

**Header / Navigation**  
Queue logo, queue name và back link về queue page nếu áp dụng. [file:1]

**Main Content**  
4-step illustrated guide, tips card, CTA `Get Ticket Now` và ad banner slot. [file:1]

**State-dependent UI**  
Nếu queue không tồn tại thì hiển thị fallback rõ ràng. [file:1]

**Interaction Rules**  
CTA phải đưa người dùng đến luồng lấy số chính của queue tương ứng. [file:1]

### public-display-board (`/display/[queueId]`)
**Mục tiêu màn hình**  
Hiển thị công khai các ticket đang được phục vụ cho TV hoặc phòng chờ. [file:1]

**Header / Navigation**  
Queue name, subtitle `Now Serving` và logo nếu có. [file:1]

**Main Content**  
Stats bar gồm waiting và serving, `ServingGrid` theo từng counter đang phục vụ, placeholder khi chưa có ticket serving, live clock và ad banner slot nếu dùng. [file:1]

**State-dependent UI**  
Có loading state cho public stats ban đầu, empty serving state và reconnect banner nếu realtime bị đứt. [file:1]

**Interaction Rules**  
Đây là màn hình passive display nên không có action nghiệp vụ; cần auto refresh hoặc fallback polling khi mất SSE. [file:1]

### public-about (`/about`)
**Mục tiêu màn hình**  
Giới thiệu mục đích sản phẩm, sứ mệnh và lợi ích của QueueApp. [file:1]

**Main Content**  
Product purpose, mission, benefits, contact info và ad banner nếu dùng. [file:1]

### public-terms (`/terms`)
**Mục tiêu màn hình**  
Cung cấp nội dung điều khoản sử dụng. [file:1]

**Main Content**  
Các legal sections và ngày cập nhật gần nhất. [file:1]

### public-privacy (`/privacy`)
**Mục tiêu màn hình**  
Cung cấp nội dung chính sách quyền riêng tư. [file:1]

**Main Content**  
Privacy sections và ngày cập nhật gần nhất. [file:1]

## Admin Screens

### admin-queue-list (`/dashboard/queues`)
**Mục tiêu màn hình**  
Cho phép admin xem toàn bộ queue hiện có và đi nhanh đến monitor hoặc edit. [file:1]

**Header / Navigation**  
App shell header, dashboard navigation, page title và primary CTA `Create Queue`. [file:1]

**Main Content**  
Grid `QueueCard`; mỗi card gồm logo hoặc initial, queue name, stream count, counter count, status badge, total tickets, action `Monitor` và `Edit`; có empty-state block nếu chưa có queue. [file:1]

**Footer**  
Dashboard shell footer tối giản nếu có; không dùng footer marketing. [file:1]

**State-dependent UI**  
Loading dùng card skeletons; empty dùng illustration và CTA tạo queue; error dùng retry block. [file:1]

**Interaction Rules**  
Click card hoặc `Monitor` mở LiveMonitor; click `Edit` chuyển tới edit queue. [file:1]

### admin-create-queue (`/dashboard/queues/new`)
**Mục tiêu màn hình**  
Cho phép admin tạo queue mới bằng wizard nhiều bước. [file:1]

**Header / Navigation**  
Dashboard shell, breadcrumb `Queues / Create Queue`. [file:1]

**Main Content**  
`QueueWizard` gồm bốn tab: Basic, Streams & Counters, Customer Settings, QR & Publish; hỗ trợ text input, textarea, select, time/date picker, upload logo, add/remove stream, add/remove counter, add/remove custom field và next/back/submit buttons. [file:1]

**State-dependent UI**  
Submit loading state, validation error inline tại field và cảnh báo unsaved changes khi rời trang. [file:1]

**Interaction Rules**  
Không cho submit nếu thiếu field bắt buộc; prefix của stream phải unique trong cùng queue; chuyển tab không làm mất dữ liệu đã nhập. [file:1]

### admin-live-monitor (`/dashboard/queues/[id]`)
**Mục tiêu màn hình**  
Cho phép admin theo dõi hoạt động realtime của queue đang chạy. [file:1]

**Header / Navigation**  
Dashboard shell, breadcrumb, link `Edit` và link mở `Display Board`. [file:1]

**Main Content**  
`QueueStatusPanel` với badge trạng thái và action Activate, Pause, Close; `SummaryCards` cho waiting, serving, active staff, total tickets today; `StreamBreakdownTable` hoặc stat cards; `ActiveStaffList`; `CustomerQrCard`; `StaffQrCard`; `DisplayBoardLinkCard`. [file:1]

**State-dependent UI**  
Loading bằng stat skeletons và QR placeholder; empty state khi chưa có stream hoặc chưa có staff active; error state khi realtime disconnected; degraded badge nếu realtime suy giảm nhưng chưa mất hoàn toàn. [file:1]

**Interaction Rules**  
Toggle status phải có confirm cho action phá vỡ như `Close`; copy hoặc download QR phải có success toast; live indicator phải thể hiện rõ connected hoặc disconnected. [file:1]

### admin-edit-queue (`/dashboard/queues/[id]/edit`)
**Mục tiêu màn hình**  
Cho phép admin chỉnh sửa cấu hình queue hiện có. [file:1]

**Header / Navigation**  
Dashboard shell và breadcrumb `Queues / Queue Name / Edit`. [file:1]

**Main Content**  
Dùng lại `QueueWizard` với dữ liệu prefilled. [file:1]

**State-dependent UI**  
Full-form skeleton khi loading; error state nếu load queue thất bại; success toast `Saved` sau khi lưu. [file:1]

**Interaction Rules**  
Validation giống create queue; nếu thay đổi stream hoặc counter có thể ảnh hưởng dữ liệu cũ thì phải có cảnh báo rõ. [file:1]

### admin-reports (`/dashboard/reports`)
**Mục tiêu màn hình**  
Cho phép admin xem báo cáo vận hành và xuất dữ liệu. [file:1]

**Header / Navigation**  
Dashboard shell và page title `Reports`. [file:1]

**Main Content**  
Filter bar gồm queue select, date picker và nút export CSV; summary cards; `StaffPerformanceTable`; `StreamBreakdownTable`; empty state khi không có data. [file:1]

**State-dependent UI**  
Loading skeleton cho cards và tables; empty message `No data for selected date`; error state có retry action. [file:1]

**Interaction Rules**  
CSV export phải phản ánh đúng filter đang chọn; bảng phải support horizontal scroll trên mobile. [file:1]

### admin-brand (`/dashboard/brand`)
**Mục tiêu màn hình**  
Cho phép quản lý logo thương hiệu mặc định của hệ thống hoặc nhóm queue. [file:1]

**Header / Navigation**  
Dashboard shell và page title `Brand`. [file:1]

**Main Content**  
Upload area drag-and-drop, logo preview, delete logo button, info card giải thích phạm vi áp dụng logo và save button. [file:1]

**State-dependent UI**  
Loading upload, error file type hoặc size, success toast sau khi apply logo và empty placeholder nếu chưa có logo. [file:1]

### admin-settings (`/dashboard/settings`)
**Mục tiêu màn hình**  
Cung cấp khu vực thiết lập tài khoản hoặc thông tin ứng dụng ở mức hệ thống. [file:1]

**Header / Navigation**  
Dashboard shell và page title `Settings`. [file:1]

**Main Content**  
Account info card và app info card. [file:1]

**State-dependent UI**  
Loading tối giản; nếu xảy ra lỗi thì fallback sang read-only block. [file:1]

## Staff Screens

### staff-login (`/staff/login`)
**Mục tiêu màn hình**  
Cho phép nhân viên đăng nhập vào staff portal. [file:1]

**Header / Navigation**  
Logo hoặc title `Staff Portal`. [file:1]

**Main Content**  
Login card, input email/password và submit button. [file:1]

**State-dependent UI**  
Loading submit và error login inline. [file:1]

### staff-join-queue (`/staff/join/[queueId]`)
**Mục tiêu màn hình**  
Cho phép nhân viên chọn stream, counter và bắt đầu session trong một queue cụ thể. [file:1]

**Header / Navigation**  
Queue name và optional back link. [file:1]

**Main Content**  
`SessionSetupCard`, greeting với staff name, stream multi-select, counter dropdown, planned end time input, start session button và ad banner slot nếu dùng. [file:1]

**State-dependent UI**  
Loading queue streams/counters; error unauthorized hoặc queue unavailable; empty state khi queue chưa có counter hợp lệ. [file:1]

**Interaction Rules**  
Chỉ cho chọn counter hợp lệ theo streams đã chọn; nếu chưa auth thì redirect login với callback URL. [file:1]

### staff-work-screen (`/staff/work/[sessionId]`)
**Mục tiêu màn hình**  
Là giao diện thao tác chính của nhân viên tại quầy để gọi số, xác thực khách và hoàn tất phục vụ. [file:1]

**Header / Navigation**  
Queue name, counter name, served count và session status badge `ACTIVE` hoặc `PAUSED`. [file:1]

**Main Content**  
`CurrentTicketCard` hiển thị display number, verify code, stream name hoặc placeholder khi chưa có ticket; `FeedbackBar`; `PrimaryActions` gồm `CallNext`, `Absent`, toggle `Enter Code`; `ManualVerifyPanel` gồm display number, verify code và nút `Accept`; `SessionControls` gồm `Pause` hoặc `Resume` và `End Session`; ad banner slot nếu dùng. [file:1]

**Footer**  
Nếu có chỉ nên là shell footer tối giản. [file:1]

**State-dependent UI**  
Loading hiển thị skeleton cho current ticket card và disabled actions; idle hiển thị placeholder khi chưa có ticket hiện tại; paused hiển thị amber banner và disable các thao tác ticket; error hiển thị inline message hoặc feedback bar; ended khóa toàn bộ action và chuyển hướng về staff portal hoặc join flow. [file:1]

**Interaction Rules**  
`CallNext` gọi `POST /api/staff/session/[id]/next` và bị disable khi session paused, ended hoặc đang pending. [file:1] `Absent` gọi `POST /api/staff/session/[id]/absent` và chỉ enabled khi đang có current ticket. [file:1] `Accept` trong manual verify panel gọi `POST /api/staff/session/[id]/complete`, yêu cầu verify code đủ 4 chữ số, hỗ trợ Enter để submit và phải có feedback thành công hoặc thất bại tự ẩn sau 2.5 giây. [file:1]

## Cross-screen Rules

- Mọi button phải có các trạng thái default, hover, focus, active, disabled và loading. [file:1]
- Mọi form phải có validation states gồm ít nhất default và error, cùng success state khi phù hợp. [file:1]
- Mọi data-heavy screen phải định nghĩa loading, empty và error state. [file:1]
- Customer-facing screens phải mobile-first. [file:1]
- Dashboard tables phải có phương án responsive rõ ràng. [file:1]
- Toast chỉ dùng cho feedback ngắn, không dùng thay lỗi inline. [file:1]
- Destructive actions luôn cần confirm step. [file:1]

## Notes for Implementation

Tài liệu gốc có nhiều chỗ bị lệch giữa tiêu đề màn hình và nội dung mô tả, nên bản rewrite này đã chuẩn hóa lại mapping để tên route, mục tiêu màn hình và nội dung bên dưới khớp nhau. [file:1] Khi có xung đột trong triển khai, `queueapp-prd-rewritten.md` giữ vai trò định nghĩa intent và rules sản phẩm, còn file này là nguồn chuẩn cho layout, component contract và behavior của từng màn hình. [file:1]
