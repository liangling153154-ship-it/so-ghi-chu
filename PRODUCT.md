# Product

## Register

product

## Users

Lễ tân và nhân viên vận hành của các cơ sở lưu trú/kinh doanh nhỏ (Sen's Homestay,
Hòa An Hotel, HTX Cường Thành...). Đủ mọi độ tuổi, không rành công nghệ. Bối cảnh
sử dụng: đứng ở quầy, điện thoại cầm một tay, khách đang chờ trước mặt — cần lấy
được mẫu tin nhắn / mã QR / link trong vài giây rồi quay lại với khách.

## Product Purpose

"Sổ tay số" cá nhân: mỗi người một link riêng, mở ra là thấy ngay các ghi chú của
mình (text để chép 1 chạm, ảnh QR để đưa khách quét). Thành công = thao tác
tìm-và-chép nhanh hơn lục Zalo/album ảnh; người lớn tuổi dùng được không cần hướng dẫn.

## Brand Personality

Gọn gàng, chuyên nghiệp, đáng tin. Như một quầy lễ tân buổi sáng: đá trắng sạch sẽ,
một điểm nhấn đồng thau ấm. Không màu mè, không trang trí thừa — công cụ biến mất
sau công việc.

## Anti-references

- Không phải app tiêu dùng trẻ trung nhiều màu (kiểu app ngân hàng khuyến mãi, ví điện tử)
- Không phải SaaS dashboard xám lạnh đặc dữ liệu
- Không teal mặc định của bản cũ; không cream/beige "ấm áp AI"

## Design Principles

1. **Một tay, vài giây** — hành động chính (chép, xem QR) luôn trong tầm ngón cái,
   chạm tối thiểu 44px, không chôn dưới menu.
2. **Dễ đọc hơn dày đặc** — chữ cỡ 16-17px+, tương phản ≥4.5:1, hy sinh mật độ
   thông tin nếu phải chọn.
3. **Quen thuộc thắng độc đáo** — thành phần chuẩn (list, chip, bottom sheet),
   không phát minh lại affordance.
4. **Trạng thái luôn được báo** — loading là skeleton, lỗi có chữ rõ ràng, hành động
   xong có xác nhận; không bao giờ màn hình câm.

## Accessibility & Inclusion

- Người dùng lớn tuổi, thị lực kém: chữ to, tương phản cao (WCAG AA tối thiểu).
- Touch target ≥44px; input font-size ≥16px (tránh iOS tự zoom).
- `prefers-reduced-motion` được tôn trọng trên mọi animation.
- Tiếng Việt là ngôn ngữ duy nhất của UI.
