# 🎵 Hướng dẫn sử dụng Bot âm thanh

Bot này sẽ **phát một đoạn âm thanh do bạn chọn** mỗi khi bạn **vào** hoặc **rời** một phòng thoại (voice channel) trong server Discord.

Mỗi người tự cài âm thanh riêng cho mình — không ai bị trùng.

---

## 🚀 Bắt đầu nhanh trong 3 bước

### Bước 1 — Chuẩn bị file âm thanh
- Chuẩn bị một file nhạc/âm thanh ngắn (khuyên dùng **2–5 giây**).
- Định dạng hỗ trợ: **mp3, wav, ogg, m4a, flac, webm**.
- Dung lượng tối đa: **8 MB**.

### Bước 2 — Đặt âm thanh khi BẠN VÀO phòng
1. Vào một kênh chat (text channel) bất kỳ mà bot có mặt.
2. Gõ lệnh `!setjoin`
3. **Đính kèm file âm thanh** vào cùng tin nhắn đó (kéo–thả file vào, hoặc bấm dấu **+** để chọn file) rồi gửi.
4. Bot trả lời: ✅ *Đã đặt âm thanh khi bạn vào channel*

> 💡 Lệnh và file phải nằm trong **cùng một tin nhắn**. Gửi lệnh trống rồi gửi file riêng sẽ không nhận.

### Bước 3 — Đặt âm thanh khi BẠN RỜI phòng
Làm y hệt Bước 2, nhưng dùng lệnh `!setleave` kèm file.

✅ Xong! Bây giờ thử **vào một phòng thoại** — bot sẽ chạy vào, phát âm thanh của bạn rồi **tự rời ngay**. Ai vào/ra phòng nào, bot cũng tự nhảy vào phòng đó để phát.

---

## 📋 Danh sách lệnh

| Lệnh | Tác dụng |
|------|----------|
| `!setjoin` + *(đính kèm file)* | Đặt âm thanh phát khi bạn **vào** phòng thoại |
| `!setleave` + *(đính kèm file)* | Đặt âm thanh phát khi bạn **rời** phòng thoại |
| `!clearjoin` | Xoá âm thanh khi vào |
| `!clearleave` | Xoá âm thanh khi rời |
| `!mysounds` | Xem âm thanh bạn đang dùng |
| `!join` / `!leave` | Gọi bot vào / rời phòng thoại |

---

## ❓ Câu hỏi thường gặp

**Bot không phản hồi lệnh `!setjoin`?**
- Kiểm tra bạn đã gõ đúng dấu `!` ở đầu.
- Đảm bảo bạn có **đính kèm file** trong cùng tin nhắn.
- Bot phải đang **online** (chấm xanh).

**Vào phòng thoại nhưng không nghe thấy gì?**
- Bạn đã đặt âm thanh chưa? Gõ `!mysounds` để kiểm tra.
- Bot cần quyền **Connect** và **Speak** trong phòng thoại đó.
- Kiểm tra âm lượng của bot (chuột phải vào bot trong phòng thoại) chưa bị tắt tiếng.

**Đổi âm thanh khác được không?**
- Được. Cứ gõ lại `!setjoin` (hoặc `!setleave`) kèm file mới — file cũ sẽ bị thay.

**Báo "Định dạng không hỗ trợ"?**
- File của bạn không thuộc các đuôi: mp3, wav, ogg, m4a, flac, webm.

**Báo "File quá lớn"?**
- File vượt quá 8 MB. Hãy cắt ngắn hoặc nén lại.

---

## ⚠️ Lưu ý

- Đây là **phòng thoại của Discord**, không phải Zoom.
- Bot phát xong **tự rời ngay**, sẵn sàng nhảy sang phòng khác khi có người vào/ra.
- Nếu nhiều người vào/ra cùng lúc, bot sẽ phát **lần lượt** từng âm thanh.
