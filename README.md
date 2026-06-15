# Discord Voice Sound Bot

Bot phát âm thanh tùy chỉnh theo từng user khi họ **vào** / **rời** voice channel.

## 1. Tạo bot trên Discord

1. Vào https://discord.com/developers/applications → **New Application**.
2. Tab **Bot** → **Reset Token** → copy token.
3. Trong tab **Bot**, bật **Privileged Gateway Intents**:
   - ✅ **MESSAGE CONTENT INTENT** (để đọc lệnh `!`)
   - (VOICE STATE không nằm trong privileged, mặc định đã có)
4. Tab **OAuth2 → URL Generator**: chọn scope `bot`, quyền:
   `Connect`, `Speak`, `Send Messages`, `Read Message History`.
   Mở URL được sinh ra để mời bot vào server.

## 2. Cấu hình

```bash
cp .env.example .env
# mở .env và dán token vào DISCORD_TOKEN
```

> Không cần cài ffmpeg riêng — bot đã đi kèm `ffmpeg-static`.

## 3. Chạy (cách dễ nhất — chỉ cần ấn run)

Tùy hệ điều hành, **double-click** file tương ứng:

| Hệ điều hành | File |
|--------------|------|
| Windows | `run.bat` |
| macOS | `run.command` |
| Linux | `run.sh` (hoặc chạy `./run.sh` trong terminal) |

Lần đầu chạy, script sẽ **tự cài thư viện** (`npm install`). Nếu chưa có file `.env`,
script sẽ tự tạo và mở để bạn dán token vào `DISCORD_TOKEN`, lưu lại rồi chạy lại.

> Yêu cầu cài sẵn: **Node.js >= 18**. Nếu thiếu, script sẽ báo và hướng dẫn link tải.

### Chạy thủ công (nâng cao)

```bash
npm install
node bot.js
# hoặc: npm start
```

## 4. Cách hoạt động

Khi **bất kỳ ai** vào hoặc rời một voice channel, bot tự vào channel đó:
- **Vào phòng** → phát **âm thanh mp3** của user (hoặc âm mặc định nếu chưa cài bằng `!setjoin`)
- **Rời phòng** → **đọc tên** bằng giọng nói: *"TênABC đã cút"*

Giọng đọc dùng **Google TTS miễn phí** (mặc định tiếng Việt). Đổi ngôn ngữ bằng biến môi trường `TTS_LANG` (vd `TTS_LANG=en` cho giọng Anh).

| Lệnh | Mô tả |
|------|-------|
| `!join` / `!leave` | Gọi bot vào / rời voice channel thủ công |

> Bot phát xong **tự rời ngay**. Mỗi lần có người vào/ra bất kỳ channel nào, bot tự vào channel đó đọc tên.

- File giọng đọc được cache trong `tts_cache/` để khỏi tải lại.

> 💡 Bot vẫn còn các lệnh upload mp3 riêng (`!setjoin`/`!setleave`/`!mysounds`/`!clearjoin`/`!clearleave`) nhưng hiện sự kiện vào/ra dùng **đọc tên** thay vì file mp3.

## Ghi chú

> Đây là **voice channel của Discord**, không phải Zoom — bot Discord không truy cập được Zoom.
