# 🚂 Hướng dẫn deploy lên Railway

Bot Discord cần chạy 24/7. Railway phù hợp vì hỗ trợ tiến trình "always-on" (không sleep như Render free).

> ⚠️ Filesystem của Railway là **ephemeral** — mất sạch mỗi lần redeploy. Vì vậy ta gắn một **Volume** để giữ file âm thanh user upload và config. Bot đọc đường dẫn lưu trữ từ biến `DATA_DIR`.

---

## 1. Đẩy code lên GitHub

```bash
git add .
git commit -m "Chuyển bot sang Node.js + cấu hình Railway"
git push
```

> File `.env` (chứa token) đã được `.gitignore` bỏ qua — token sẽ set trực tiếp trên Railway, không đẩy lên GitHub.

## 2. Tạo project trên Railway

1. Vào https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. Chọn repo này. Railway tự nhận diện Node.js (qua Nixpacks) và chạy `node bot.js` (đã khai báo trong `railway.json`).

## 3. Set biến môi trường (Variables)

Trong service → tab **Variables**, thêm:

| Biến | Giá trị |
|------|---------|
| `DISCORD_TOKEN` | token bot Discord của bạn |
| `DATA_DIR` | `/data` |

## 4. Gắn Volume (để không mất dữ liệu)

1. Trong service → tab **Settings** (hoặc chuột phải service → **Add Volume**).
2. Tạo Volume mới, đặt **Mount Path** = `/data` (đúng bằng `DATA_DIR` ở trên).
3. Lưu lại. Từ giờ file user upload (`/data/sounds/`) và `/data/sounds_config.json` được giữ qua mỗi lần deploy.

## 5. Deploy

Railway tự build và chạy. Xem log ở tab **Deployments** → khi thấy:

```
Bot đã online: TênBot#1234 (id=...)
```

là bot đã chạy. Vào Discord test `!setjoin` kèm file để kiểm tra.

---

## Ghi chú

- **Âm thanh mặc định** (`sounds/_default_join.mp3`, `_default_leave.mp3`) nằm sẵn trong repo, được deploy cùng code — không cần volume.
- **Âm thanh user upload** lưu vào volume tại `/data/sounds/`, tách khỏi code.
- Railway free tier có giới hạn dùng ~$5 credit/tháng. Bot nhỏ thường đủ; nếu hết, bot sẽ dừng cho tới chu kỳ sau hoặc khi nâng cấp.
- Bot dùng **gateway/voice connection** liên tục — KHÔNG deploy được lên nền tảng serverless (Vercel/Lambda).
- Encode Opus dùng `opusscript` (pure JavaScript) thay vì `@discordjs/opus` (native) — để Railway **không cần biên dịch** native module (không cần Python/node-gyp). Node version được pin ở `22.x` (xem `package.json` + `.nvmrc`).
