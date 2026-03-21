# Google AdSense Setup Guide / Huong dan cai dat Google AdSense

> Huong dan tich hop Google AdSense vao QueueApp de hien thi quang cao va tao doanh thu.

## Muc luc

1. [Dang ky tai khoan Google AdSense](#1-dang-ky-tai-khoan-google-adsense)
2. [Lay ma AdSense Client ID va Slot ID](#2-lay-ma-adsense-client-id-va-slot-id)
3. [Cau hinh trong QueueApp](#3-cau-hinh-trong-queueapp)
4. [Vi tri quang cao trong app](#4-vi-tri-quang-cao-trong-app)
5. [Queue-level ad slot override](#5-queue-level-ad-slot-override)
6. [Kiem tra va xac nhan](#6-kiem-tra-va-xac-nhan)
7. [Luu y quan trong](#7-luu-y-quan-trong)

---

## 1. Dang ky tai khoan Google AdSense

De hien thi quang cao trong QueueApp, ban can co tai khoan Google AdSense da duoc phe duyet.

### Buoc 1: Truy cap trang dang ky

Truy cap **https://adsense.google.com/start** tren trinh duyet.

### Buoc 2: Dang nhap bang tai khoan Google

Chon tai khoan Google ma ban muon su dung de quan ly quang cao. Nen dung tai khoan chinh cua doanh nghiep.

### Buoc 3: Nhap URL website

Nhap URL production cua QueueApp. Vi du:

```
https://your-app.railway.app
```

**Quan trong:** Google khong chap nhan `localhost` hoac dia chi IP. Ban phai su dung domain that (hoac subdomain cua Railway, Vercel, v.v.).

### Buoc 4: Chon quoc gia va dong y dieu khoan

- Chon quoc gia/vung lanh tho cua ban (vi du: **Vietnam**)
- Doc va dong y voi **Terms and Conditions** cua Google AdSense

### Buoc 5: Cho Google phe duyet

- Google se xem xet website cua ban
- Thoi gian phe duyet: **thuong tu 1 den 14 ngay**
- Google se gui email thong bao khi tai khoan duoc phe duyet
- Trong thoi gian cho, dam bao website co noi dung that va co traffic on dinh

---

## 2. Lay ma AdSense Client ID va Slot ID

Sau khi tai khoan duoc phe duyet, ban can tao cac **ad unit** (don vi quang cao) va lay ma de cau hinh.

### Lay Client ID (data-ad-client)

1. Dang nhap vao **Google AdSense Dashboard**
2. Client ID nam o trang **Account > Account information**
3. Co dang: `ca-pub-XXXXXXXXXXXXXXXX`
4. Day la gia tri ban can cho bien `NEXT_PUBLIC_ADSENSE_CLIENT_ID`

### Tao Ad Unit va lay Slot ID (data-ad-slot)

Ban can tao **mot ad unit rieng** cho moi vi tri hien thi quang cao trong app. Cach lam:

1. Vao **AdSense Dashboard** > **Ads** > **By ad unit** > **Create new ad unit**
2. Chon **Display ads** (quang cao hien thi)
3. Dat ten cho ad unit de de quan ly, vi du: `QueueApp - Landing Page`
4. Nhan **Create**
5. Google se hien thi doan ma HTML. Tim hai gia tri:
   - `data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"` -- day la **Client ID** (giong nhau cho tat ca ad unit)
   - `data-ad-slot="1234567890"` -- day la **Slot ID** (khac nhau cho moi ad unit)
6. Copy gia tri `data-ad-slot` -- do la Slot ID ban can

Lap lai buoc tren de tao cac ad unit sau:

| Ten ad unit goi y             | Dung cho bien moi truong               |
| ----------------------------- | --------------------------------------- |
| `QueueApp - Landing`          | `NEXT_PUBLIC_ADSENSE_SLOT_LANDING`      |
| `QueueApp - Customer`         | `NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER`     |
| `QueueApp - Staff`            | `NEXT_PUBLIC_ADSENSE_SLOT_STAFF`        |
| `QueueApp - Display Board`    | `NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY`      |
| `QueueApp - Admin Dashboard`  | `NEXT_PUBLIC_ADSENSE_SLOT_ADMIN`        |

---

## 3. Cau hinh trong QueueApp

### Them bien moi truong vao file `.env`

Mo file `.env` o thu muc goc cua project va them cac dong sau:

```env
# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_LANDING=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER=1234567891
NEXT_PUBLIC_ADSENSE_SLOT_STAFF=1234567892
NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY=1234567893
NEXT_PUBLIC_ADSENSE_SLOT_ADMIN=1234567894
```

Thay the cac gia tri `ca-pub-XXX` va `12345...` bang ma that cua ban tu buoc 2.

### Giai thich tung bien

| Bien moi truong                       | Bat buoc | Giai thich                                                                 |
| ------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID`       | Co       | Publisher ID cua ban. Tat ca ad unit dung chung gia tri nay.               |
| `NEXT_PUBLIC_ADSENSE_SLOT_LANDING`    | Khong    | Slot ID cho quang cao tren **trang chu** (landing page).                   |
| `NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER`   | Khong    | Slot ID cho quang cao tren cac **trang khach hang** (queue page, guide).   |
| `NEXT_PUBLIC_ADSENSE_SLOT_STAFF`      | Khong    | Slot ID cho quang cao tren cac **trang nhan vien** (join, work).           |
| `NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY`    | Khong    | Slot ID cho quang cao tren **bang hien thi** (display board).              |
| `NEXT_PUBLIC_ADSENSE_SLOT_ADMIN`      | Khong    | Slot ID cho quang cao tren **sidebar dashboard** cua admin.                |

**Luu y:** Cac bien `NEXT_PUBLIC_ADSENSE_SLOT_*` la khong bat buoc. Neu ban khong cung cap slot ID cho mot vi tri nao do, quang cao se khong hien thi o vi tri do. Neu `NEXT_PUBLIC_ADSENSE_CLIENT_ID` khong duoc thiet lap, toan bo he thong quang cao se bi tat -- component `AdBanner` se return `null`.

### Deploy lai sau khi thay doi

Sau khi cap nhat `.env`, ban can rebuild va deploy lai:

```bash
# Local
npm run build && npm run start

# Railway (tu dong deploy khi push code hoac cap nhat env vars trong dashboard)
```

---

## 4. Vi tri quang cao trong app

Duoi day la danh sach cac trang co dat component `AdBanner`, cung voi file tuong ung:

### Trang chu (Landing Page)

- **File:** `src/components/LandingPage.tsx`
- **Vi tri:** Giua phan "How It Works" va "Features"
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_LANDING`

### Trang huong dan khach hang (Customer Guide)

- **File:** `src/app/q/[queueId]/guide/page.tsx`
- **Vi tri:** Cuoi trang, sau noi dung huong dan
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER`

### Trang xep hang cua khach hang (Customer Queue)

- **File:** `src/app/q/[queueId]/page.tsx`
- **Vi tri:** Cuoi trang queue
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER`

### Trang xep hang - Customer Flow (Queue-level override)

- **File:** `src/components/customer/CustomerFlow.tsx`
- **Vi tri:** Ben trong giao dien xep hang
- **Slot:** Lay tu truong `adBannerSlotId` cua queue (xem muc 5)

### Bang hien thi (Display Board)

- **File:** `src/app/display/[queueId]/page.tsx`
- **Vi tri:** Phia tren footer
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY`

### Trang staff tham gia (Staff Join)

- **File:** `src/app/staff/join/[queueId]/page.tsx`
- **Vi tri:** Phia duoi form dang ky / nhap ma
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_STAFF`

### Trang staff lam viec (Staff Work)

- **File:** `src/app/staff/work/[sessionId]/page.tsx`
- **Vi tri:** Phia tren noi dung chinh
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_STAFF`

### Admin Dashboard Sidebar

- **File:** `src/components/layout/DashboardSidebar.tsx`
- **Vi tri:** Cuoi sidebar dieu huong
- **Slot:** `NEXT_PUBLIC_ADSENSE_SLOT_ADMIN`

---

## 5. Queue-level ad slot override

Moi queue co the co **slot quang cao rieng** thong qua truong `adBannerSlotId` trong database. Dieu nay cho phep ban hien thi quang cao khac nhau cho tung hang doi.

- Truong nay nam trong bang `Queue` (Prisma schema: `adBannerSlotId String?`)
- Khi queue co `adBannerSlotId`, component `CustomerFlow` se hien thi quang cao voi slot do
- Khi queue khong co `adBannerSlotId`, quang cao CustomerFlow se khong hien thi (chi hien thi quang cao mac dinh o cuoi trang)

De thiet lap, cap nhat truong `adBannerSlotId` cua queue trong admin dashboard hoac truc tiep trong database.

---

## 6. Kiem tra va xac nhan

### Tren moi truong production

1. Deploy app len Railway (hoac hosting khac) voi day du bien moi truong
2. Truy cap trang web tren domain that
3. Mo **Developer Tools** (F12) > tab **Console**
4. Kiem tra khong co loi lien quan den `adsbygoogle`
5. Quang cao se hien thi o cac vi tri da cau hinh

### Tren localhost (development)

- Quang cao **se khong hien thi** tren localhost -- day la hanh vi binh thuong
- AdSense script van duoc load nhung se khong render quang cao
- Neu `NEXT_PUBLIC_ADSENSE_CLIENT_ID` khong duoc set, component `AdBanner` se render `null` (khong hien thi gi ca, khong bi loi)
- De test layout, ban co the tam thoi them mot placeholder div thay vi AdBanner

---

## 7. Luu y quan trong

### Yeu cau tu Google AdSense

- **Domain that:** Google AdSense yeu cau website co domain that (khong phai `localhost` hay dia chi IP). Subdomain cua Railway (`*.railway.app`) hoac Vercel (`*.vercel.app`) co the duoc chap nhan.
- **Noi dung that:** Website phai co noi dung that su, huu ich, va khong vi pham chinh sach noi dung cua Google.
- **Traffic on dinh:** Google uu tien phe duyet cac website co luong truy cap on dinh.

### Quy dinh nghiem ngat

- **Khong click quang cao cua chinh minh.** Google se phat hien va co the cam tai khoan vinh vien.
- **Khong khuyen khich nguoi dung click quang cao.** Khong dat van ban nhu "Hay click quang cao" tren trang web.
- **Gioi han so luong quang cao:** Khong dat qua nhieu quang cao tren mot trang. Google co the tu choi hoac giam hien thi.

### Cach AdSense hoat dong trong QueueApp

- **Script loading:** AdSense JavaScript duoc load tu `layout.tsx` bang `next/script` voi strategy `afterInteractive`, chi khi `NEXT_PUBLIC_ADSENSE_CLIENT_ID` duoc cung cap.
- **Graceful degradation:** Neu Client ID khong duoc set, toan bo he thong quang cao tu dong tat. Khong co loi nao duoc throw -- cac component `AdBanner` don gian la return `null`.
- **Responsive:** Tat ca quang cao su dung `data-ad-format="auto"` va `data-full-width-responsive="true"` de tu dong dieu chinh kich thuoc theo man hinh.

---

## Tham khao

- [Google AdSense Help Center](https://support.google.com/adsense)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
