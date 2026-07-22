# Kho ghi chú cá nhân hóa

"Sổ tay số" cho công việc: mỗi người 1 đường link riêng, mở ra là vào thẳng không gian
ghi chú của mình — lưu tin nhắn mẫu, mã QR, link quan trọng… và chép/xem lại chỉ với 1 chạm.
Không đăng nhập, không mật khẩu. Xây theo [spec-kho-ghi-chu.md](../notes/spec-kho-ghi-chu.md).

- **Frontend:** web tĩnh thuần (HTML/CSS/JS), mobile-first, cài được lên màn hình chính (PWA)
- **Backend:** Supabase (Postgres + Storage), gọi thẳng từ trình duyệt, không cần server riêng
- **Host:** Netlify (kéo-thả là xong)

## Cài đặt lần đầu (khoảng 10 phút)

### Bước 1 — Tạo project Supabase
1. Vào [supabase.com](https://supabase.com) → đăng nhập → **New project** (free tier là đủ).
2. Đợi project khởi tạo xong.

### Bước 2 — Tạo bảng dữ liệu
1. Trong dashboard Supabase, mở **SQL Editor** → **New query**.
2. Dán toàn bộ nội dung file [`supabase/schema.sql`](supabase/schema.sql) → bấm **Run**.
   (Tạo 2 bảng `spaces`, `notes` + bucket ảnh `note-images` + quyền truy cập.)

### Bước 3 — Điền cấu hình
1. Trong dashboard: **Project Settings → API**, chép **Project URL** và **anon public key**.
2. Mở [`config.js`](config.js), thay 2 giá trị placeholder bằng URL và key vừa chép.

### Bước 4 — Đưa lên GitHub + Railway (khuyến nghị)

Cách này có lịch sử phiên bản, và sau này mỗi lần sửa code chỉ cần `git push` là Railway
tự deploy lại.

**4a. Đẩy code lên GitHub**

Tạo repo mới trên [github.com](https://github.com/new) (**để Private** — xem lưu ý cuối
mục), rồi trong thư mục `kho-ghi-chu` chạy:

```bash
git init
git add .
git commit -m "Kho ghi chú cá nhân hóa"
git branch -M main
git remote add origin https://github.com/<tên-của-bạn>/<tên-repo>.git
git push -u origin main
```

**4b. Deploy lên Railway**

1. Vào [railway.app](https://railway.app) → đăng nhập bằng GitHub.
2. **New Project → Deploy from GitHub repo** → chọn repo vừa tạo.
3. Railway tự nhận ra đây là project Node (nhờ `package.json`), tự chạy `npm start`.
   Không cần cấu hình gì thêm.
4. Vào tab **Settings → Networking → Generate Domain** để lấy địa chỉ công khai dạng
   `https://ten-gi-do.up.railway.app`.

File [`server.js`](server.js) là server tĩnh nhỏ (chỉ dùng module có sẵn của Node, không
cài thêm gì) — nó phục vụ các file và xử lý đường dẫn `/k/<token>` trỏ về app chính.

> **Netlify cũng dùng được** nếu bạn muốn: kéo-thả cả thư mục vào
> [app.netlify.com](https://app.netlify.com) → *Add new site → Deploy manually*. File
> [`_redirects`](_redirects) lo phần `/k/<token>`, `server.js` không được dùng đến.

### Chạy thử trên máy trước khi deploy

```bash
npm start
```

Rồi mở `http://localhost:3000`. (Mở thẳng file `index.html` bằng cách nhấp đúp sẽ không
chạy được, vì trình duyệt chặn service worker/clipboard trên giao thức `file://`.)

## Tạo link cho người dùng mới

Mở `https://<địa-chỉ-app>/admin.html`, nhập tên hiển thị (VD: *"Lễ tân Sen's"*) → bấm
**Tạo link mới** → chép link dạng `https://<địa-chỉ-app>/k/abc123xyz...` gửi cho người dùng
qua Zalo/Messenger.

Cũng có thể tạo trực tiếp bằng SQL trong Supabase:

```sql
insert into spaces (token, name) values ('token-tu-dat-kho-doan', 'Lễ tân Sen''s');
```

Thu hồi 1 link (xóa luôn mọi ghi chú trong đó):

```sql
delete from spaces where token = 'token-can-thu-hoi';
```

## Hướng dẫn người dùng cuối

1. Mở link được cấp → vào thẳng kho ghi chú của mình.
2. **Cài như app:** trong trình duyệt chọn **"Thêm vào màn hình chính"** (Android/Chrome:
   menu ⋮ → *Thêm vào màn hình chính*; iPhone/Safari: nút Chia sẻ → *Thêm vào MH chính*).
   Từ đó mở app từ icon, không cần nhớ link (app tự nhớ link đã mở lần đầu).
3. Bấm **+ Thêm** để tạo ghi chú: tiêu đề, nội dung, phân loại tự do, ảnh (chụp hoặc chọn
   từ máy — ảnh lớn được tự thu nhỏ để tiết kiệm dung lượng).
4. Bấm **📋 Chép** trên ghi chú để sao chép nội dung, dán vào Zalo/Messenger.
5. Bấm vào ảnh để xem to / tải về. Bấm ✏️ để sửa, **Xóa** để xóa.

## Cấu trúc thư mục

```
kho-ghi-chu/
├── index.html          # App chính (màn hình ghi chú)
├── app.js              # Logic: tải/thêm/sửa/xóa ghi chú, upload ảnh, copy
├── admin.html          # Trang tạo link mới (cho người quản lý)
├── admin.js
├── styles.css          # Giao diện mobile-first
├── config.js           # ⚠️ Điền URL + anon key Supabase vào đây
├── manifest.webmanifest# Khai báo PWA
├── sw.js               # Service worker (cache app shell, mở nhanh)
├── server.js           # Server tĩnh cho Railway (xử lý /k/<token>)
├── package.json        # Để Railway biết chạy `npm start`
├── _redirects          # Netlify: /k/* → index.html (nếu dùng Netlify)
├── icons/              # Icon app (sinh bởi scripts/make-icons.js)
└── supabase/schema.sql # Chạy 1 lần trong Supabase SQL Editor
```

## Lưu ý về "không cần bảo mật"

Đúng theo spec, link là chìa khóa duy nhất. Hệ quả cần biết:

- Ai có link (hoặc anon key + biết cách gọi API) đều đọc/sửa được dữ liệu. **Không lưu
  thông tin nhạy cảm** (mật khẩu, giấy tờ tùy thân…) vào app này.
- Trang `admin.html` không có khóa — ai mở được cũng tạo được kho mới (vô hại, không xem
  được kho của người khác). Nếu muốn kín hơn, đổi tên file thành chuỗi khó đoán
  (VD: `quan-ly-8k2x.html`).
- Ảnh trong bucket là public — ai có URL ảnh đều xem được.
- File [`config.js`](config.js) chứa anon key và **bắt buộc phải nằm trong repo** để app
  chạy được (nó được tải từ trình duyệt). Anon key vốn được thiết kế để lộ ra frontend nên
  điều này bình thường — nhưng **hãy để repo GitHub ở chế độ Private**, vì với schema hiện
  tại (anon full access), ai có anon key đều đọc/ghi được toàn bộ dữ liệu mà không cần link.
  Tuyệt đối không bao giờ đưa `service_role key` vào repo hay frontend.

Nếu sau này cần nâng bảo mật: chuyển sang RLS lọc theo token qua RPC của Supabase —
schema hiện tại không cần đổi.
