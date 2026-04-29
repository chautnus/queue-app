# QueueApp Product Requirements Document (PRD)

**Version:** 1.1.0  
**Status:** Approved for Design  
**Related Doc:** [QueueApp Technical Implementation Spec](./queueapp-implementation-spec.md)

## 1. Tầm nhìn & Mục tiêu (Vision & Objectives)

### 1.1 Mục tiêu sản phẩm
QueueApp được xây dựng để thay thế hệ thống vé giấy truyền thống bằng giải pháp hàng đợi kỹ thuật số mobile-first. Sản phẩm tập trung vào tính đơn giản: không phần cứng chuyên dụng, không yêu cầu cài đặt ứng dụng.

### 1.2 Đối tượng mục tiêu
- **SMBs:** Phòng khám, nhà hàng, ngân hàng, cơ quan hành chính, tiệm salon.
- **Enterprise:** Các tổ chức cần quản lý luồng khách hàng phức tạp qua nhiều quầy và luồng dịch vụ.

## 2. Personas & User Journeys

### 2.1 Admin (Người quản lý)
- **Nhu cầu:** Thiết lập hàng đợi, phân quyền nhân viên và theo dõi hiệu suất vận hành.
- **Hành trình:** Đăng ký -> Tạo Queue -> Cấu hình luồng dịch vụ (Streams) -> In mã QR.

### 2.2 Staff (Nhân viên quầy)
- **Nhu cầu:** Gọi khách nhanh chóng, xác thực đúng người và quản lý phiên làm việc.
- **Hành trình:** Đăng nhập cổng Staff -> Chọn quầy -> Gọi số tiếp theo -> Xác thực mã 4 số -> Hoàn tất.

### 2.3 Customer (Khách hàng)
- **Nhu cầu:** Lấy số thứ tự nhanh, biết chính xác thời gian chờ và không phải xếp hàng vật lý.
- **Hành trình:** Quét QR -> Giải CAPTCHA -> Điền thông tin (nếu cần) -> Nhận ticket -> Theo dõi trên điện thoại -> Nhận thông báo.

## 3. Đặc tả Tính năng & Quy tắc Nghiệp vụ

### 3.1 Quy tắc vé (Ticket Rules)
- **Giới hạn:** Mỗi thiết bị/trình duyệt chỉ được phép có 01 ticket đang hoạt động trên mỗi hàng đợi.
- **Xác thực:** Mỗi vé đi kèm một mã 4 số ngẫu nhiên để nhân viên kiểm tra tại quầy.
- **Hiệu lực:** Vé chỉ có giá trị trong ngày làm việc hiện tại.

### 3.2 Hệ thống luồng dịch vụ (Streams & Counters)
- **Stream:** Phân loại dịch vụ (VD: Khám tổng quát, Thu ngân). Mỗi Stream có tiền tố số vé riêng (VD: A001, B001).
- **Counter:** Điểm phục vụ vật lý. Một nhân viên có thể phục vụ nhiều Stream tại một Counter.

### 3.3 Thu thập dữ liệu khách hàng
Hệ thống cho phép cấu hình thu thập: Tên, SĐT, Tuổi, Địa chỉ và các trường tùy chỉnh (Custom Fields).

- **Chế độ:** Ẩn (Hidden), Tùy chọn (Optional), Bắt buộc (Required).

## 4. Danh mục màn hình (Screen Map)
- **Landing Page:** Giới thiệu và chuyển hướng đăng ký/đăng nhập.
- **Admin Dashboard:** Quản lý danh sách hàng đợi, thương hiệu và báo cáo.
- **LiveMonitor:** Dashboard thời gian thực cho Admin theo dõi quầy và luồng.
- **Staff Work Screen:** Giao diện thao tác gọi số và phục vụ.
- **Customer Ticket Page:** Màn hình theo dõi số thứ tự và thời gian chờ dự kiến.
- **Display Board:** Giao diện hiển thị công cộng cho tivi tại phòng chờ.

## 5. Tiêu chuẩn nghiệm thu sản phẩm (Product AC)
- [ ] Khách hàng lấy được số trong vòng 3 bước (Quét -> Captcha -> Xác nhận).
- [ ] Nhân viên gọi số phải được cập nhật ngay lập tức lên bảng hiển thị công cộng.
- [ ] Dữ liệu báo cáo CSV phải bao gồm đầy đủ các trường Custom Fields đã thu thập.
