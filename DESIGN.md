# Design

Hệ thống thị giác của Kho ghi chú — mobile-first PWA, register: product.
Mood: "quầy lễ tân buổi sáng — đá trắng sạch, một điểm nhấn đồng thau ấm."

## Theme

Light duy nhất. Người dùng đứng ở quầy dưới ánh sáng sảnh ban ngày; nền trắng
tinh cho tương phản tối đa với chữ mực đậm.

## Color

Chiến lược: **Restrained** — nền trắng tinh + mực gần đen; hổ phách đồng thau là
accent duy nhất, chỉ dùng cho hành động chính, trạng thái chọn, và nhận diện.

Người dùng gồm giám đốc/lễ tân lớn tuổi → **mọi cặp màu đạt tối thiểu 7:1**
(vượt AAA), không chỉ AA 4.5:1.

| Role | Hex | Tương phản/trắng | Dùng cho |
|---|---|---|---|
| bg | `#ffffff` | — | nền trang |
| surface | `#f2ede5` | — | nền chip, nút phụ |
| ink | `#17140f` | 18.4:1 | chữ chính |
| content | `#2e2a22` | 14.3:1 | nội dung ghi chú |
| muted | `#514a3e` | 8.8:1 | chữ phụ |
| line | `#cfc7b8` | — | viền khối ghi chú (2px), viền input |
| brand | `#7a5010` | 7.0:1 | FAB, nút Chép/Chép ảnh, chip chọn |
| brand-deep | `#5d3c0a` | 9.6:1 | pressed, chữ trên brand-wash |
| brand-wash | `#f0e4cd` | — | nền nhãn phân loại |
| danger | `#a32718` | 7.3:1 | xóa, lỗi |

Cấm: gradient text, side-stripe border, glassmorphism, shadow rộng + viền 1px trên
cùng phần tử.

## Typography

Một họ duy nhất: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
Scale cố định (rem), base **18px** (lớn hơn chuẩn — dành cho mắt lớn tuổi):

- Tên không gian (header): 22px / 700
- Tiêu đề ghi chú: 19px / 700
- Body / nội dung: 18px / 400, line-height 1.5
- Nhãn, phân loại, meta: 15px / 600
- Nút: 18px / 650

`text-wrap: balance` cho tiêu đề. Không display font, không fluid clamp.

## Components

- **Header**: sticky, nền trắng, hairline dưới; chấm vuông bo brand + tên không gian.
- **Chip phân loại**: pill 40px, surface + viền line; active = brand nền, chữ trắng.
- **Note item**: khối trắng bo 12px, **viền 2px** `--line` để mảng nội dung nổi rõ
  (không đổ bóng). Hành động chính = nút brand đặc, 44px: "Chép" khi có text,
  "Chép ảnh" khi có ảnh (chép PNG vào clipboard để dán thẳng Zalo). Sửa/Xóa =
  icon button 44px đẩy sang phải. Hàng nút được phép wrap — **chữ nút không bao
  giờ bị cắt ngắn**, kể cả màn 320px. Bấm thẳng vào ảnh để xem to (không cần nút riêng).
- **Bottom sheet** (thêm/sửa): `<dialog>` dính đáy màn hình, radius 16px góc trên,
  grabber, trượt lên 220ms ease-out-quint. Input 48px, font 16px, focus ring brand.
- **Skeleton** khi tải: thanh shimmer thay cho spinner/emoji.
- **Toast**: ink nền, trắng chữ, đáy màn hình, 2.2s.
- **Empty state**: glyph ghi chú hình học sạch (SVG inline) + 1 câu hướng dẫn + CTA.

## Spacing & Layout

- Thang 4px: 4/8/12/16/20/24/32/48.
- Content max-width 560px, padding ngang 16px.
- Radius: 12px khối, 14px sheet-card, pill cho chip/nút tròn. Không vượt 16px.
- Z-scale: sticky 10 < fab 20 < backdrop 30 < sheet 40 < toast 50.

## Motion

- 150–250ms, ease-out (cubic-bezier(0.22,1,0.36,1)); không bounce.
- Sheet trượt lên; chip/nút đổi màu 150ms; toast fade+rise.
- Motion chỉ báo trạng thái, không trang trí. `prefers-reduced-motion: reduce`
  → mọi transition thành instant/crossfade.

## Assets

- Icon PWA sinh bằng `scripts/make-icons.js`: nền brand amber đậm (gradient nhẹ
  68° hue), tấm ghi chú trắng, dòng tiêu đề amber + dòng chữ honey nhạt.
- Glyph rỗng (empty state) dùng cùng ngôn ngữ hình học với icon.
