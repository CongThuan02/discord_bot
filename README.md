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

Cần có **ffmpeg** trên máy (`brew install ffmpeg` trên macOS).

## 3. Chạy (cách dễ nhất — chỉ cần ấn run)

Tùy hệ điều hành, **double-click** file tương ứng:

| Hệ điều hành | File |
|--------------|------|
| Windows | `run.bat` |
| macOS | `run.command` |
| Linux | `run.sh` (hoặc chạy `./run.sh` trong terminal) |

Lần đầu chạy, script sẽ **tự cài thư viện**. Nếu chưa có file `.env`, script
sẽ tự tạo và mở để bạn dán token vào `DISCORD_TOKEN`, lưu lại rồi chạy lại.

> Yêu cầu cài sẵn: **Python 3** và **ffmpeg**. Nếu thiếu, script sẽ báo và hướng dẫn link tải.

### Chạy thủ công (nâng cao)

```bash
.venv/bin/python bot.py
```

## 4. Cách dùng (trong Discord)

| Lệnh | Mô tả |
|------|-------|
| `!setjoin` + đính kèm file | Đặt âm thanh khi **bạn vào** channel |
| `!setleave` + đính kèm file | Đặt âm thanh khi **bạn rời** channel |
| `!clearjoin` / `!clearleave` | Xoá âm thanh đã đặt |
| `!mysounds` | Xem âm thanh hiện tại của bạn |

- Mỗi user tự cấu hình âm thanh riêng.
- Định dạng hỗ trợ: mp3, wav, ogg, m4a, flac, webm (tối đa 8 MB).
- File lưu trong `sounds/`, mapping lưu trong `sounds_config.json`.

## Ghi chú

> Đây là **voice channel của Discord**, không phải Zoom — bot Discord không truy cập được Zoom.
