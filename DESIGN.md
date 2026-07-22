# Design

Hệ thống thị giác của Kho ghi chú — mobile-first PWA, register: product.
Mood: "quầy lễ tân buổi sáng — đá trắng sạch, một điểm nhấn đồng thau ấm."

## Theme

Light duy nhất. Người dùng đứng ở quầy dưới ánh sáng sảnh ban ngày; nền trắng
tinh cho tương phản tối đa với chữ mực đậm.

## Color

Chiến lược: **Restrained** — nền trắng tinh + mực gần đen; hổ phách đồng thau là
accent duy nhất, chỉ dùng cho hành động chính, trạng thái chọn, và nhận diện.

| Role | OKLCH | Hex | Dùng cho |
|---|---|---|---|
| bg | oklch(1 0 0) | `#ffffff` | nền trang |
| surface | oklch(0.972 0.004 68) | `#f7f4f0` | nền chip, nút phụ, khối phụ |
| ink | oklch(0.24 0.012 68) | `#25211b` | chữ chính, chip đang chọn |
| muted | oklch(0.52 0.02 68) | `#6d6457` | chữ phụ (≥4.5:1 trên trắng) |
| line | oklch(0.91 0.006 68) | `#e5e1da` | hairline, viền input |
| brand | oklch(0.60 0.13 68) | `#9a6a1f` | FAB, nút Chép, chip chọn, link |
| brand-deep | oklch(0.50 0.115 68) | `#7c5314` | pressed state, chữ brand cỡ nhỏ |
| danger | oklch(0.55 0.19 25) | `#c03d2e` | xóa, lỗi |

Cấm: gradient text, side-stripe border, glassmorphism, shadow rộng + viền 1px trên
cùng phần tử.

## Typography

Một họ duy nhất: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
Scale cố định (rem), tỉ lệ ~1.15, base 17px:

- Tên không gian (header): 19px / 700
- Tiêu đề ghi chú: 17px / 650
- Body / nội dung: 16px / 400, line-height 1.5
- Nhãn, phân loại, meta: 13.5px / 600
- Nút: 16px / 650

`text-wrap: balance` cho tiêu đề. Không display font, không fluid clamp.

## Components

- **Header**: sticky, nền trắng, hairline dưới; chấm vuông bo brand + tên không gian.
- **Chip phân loại**: pill 40px, surface + viền line; active = brand nền, chữ trắng.
- **Note item**: KHÔNG card đổ bóng — khối trắng phân tách bằng hairline, radius 12px
  khi cần nhóm. Hành động chính "Chép" = nút brand đặc, 44px. Sửa/Xóa = icon button 44px.
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
