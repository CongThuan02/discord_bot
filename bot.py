"""
Bot Discord phát âm thanh tùy chỉnh khi user vào / rời voice channel.

- Mỗi user cấu hình riêng âm thanh "vào" và âm thanh "ra".
- Config lưu trong sounds_config.json, file âm thanh lưu trong thư mục sounds/.
- Set âm thanh bằng cách gửi lệnh kèm file đính kèm (attachment).

Lệnh:
  !setjoin   (đính kèm 1 file âm thanh)  -> đặt âm thanh khi BẠN vào channel
  !setleave  (đính kèm 1 file âm thanh)  -> đặt âm thanh khi BẠN rời channel
  !clearjoin / !clearleave              -> xoá âm thanh đã đặt
  !mysounds                             -> xem âm thanh hiện tại của bạn
"""

import os
import json
import asyncio

import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
SOUNDS_DIR = "sounds"
CONFIG_FILE = "sounds_config.json"

# Âm thanh mặc định dùng cho user CHƯA tự cài (đặt None để tắt mặc định)
DEFAULT_JOIN = os.path.join(SOUNDS_DIR, "_default_join.mp3")
DEFAULT_LEAVE = os.path.join(SOUNDS_DIR, "_default_leave.mp3")

# Đuôi file âm thanh cho phép
ALLOWED_EXT = (".mp3", ".wav", ".ogg", ".m4a", ".flac", ".webm")
MAX_SIZE = 8 * 1024 * 1024  # 8 MB

os.makedirs(SOUNDS_DIR, exist_ok=True)

# Nạp thư viện Opus thủ công (bắt buộc để encode âm thanh gửi lên Discord).
# Trên macOS/Python mới, Opus thường KHÔNG tự nạp -> bot phát ra im lặng.
if not discord.opus.is_loaded():
    for _opus_path in (
        "/opt/homebrew/lib/libopus.dylib",      # macOS (Apple Silicon, Homebrew)
        "/usr/local/lib/libopus.dylib",          # macOS (Intel, Homebrew)
        "opus",                                    # để hệ thống tự tìm
    ):
        try:
            discord.opus.load_opus(_opus_path)
            print(f"✅ Đã nạp Opus từ: {_opus_path}")
            break
        except Exception:
            continue
    if not discord.opus.is_loaded():
        print("⚠️ KHÔNG nạp được Opus — âm thanh sẽ không phát ra tiếng!")

intents = discord.Intents.default()
intents.voice_states = True   # cần để nhận sự kiện vào/ra voice
intents.message_content = True  # cần để đọc lệnh prefix

bot = commands.Bot(command_prefix="!", intents=intents)

# Khoá để tránh phát chồng nhiều âm thanh cùng lúc trên 1 guild
_guild_locks: dict[int, asyncio.Lock] = {}


# ---------- Lưu / đọc config ----------

def load_config() -> dict:
    if not os.path.exists(CONFIG_FILE):
        return {}
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def save_config(cfg: dict) -> None:
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def get_user_sound(user_id: int, kind: str) -> str | None:
    """kind là 'join' hoặc 'leave'. Trả về đường dẫn file nếu có và còn tồn tại."""
    cfg = load_config()
    path = cfg.get(str(user_id), {}).get(kind)
    if path and os.path.exists(path):
        return path
    # Fallback: âm thanh mặc định dùng chung cho user chưa tự cài
    default = DEFAULT_JOIN if kind == "join" else DEFAULT_LEAVE
    if default and os.path.exists(default):
        return default
    return None


def get_own_sound(user_id: int, kind: str) -> str | None:
    """Chỉ trả về âm thanh RIÊNG user đã cài (không fallback về mặc định)."""
    cfg = load_config()
    path = cfg.get(str(user_id), {}).get(kind)
    if path and os.path.exists(path):
        return path
    return None


def set_user_sound(user_id: int, kind: str, path: str | None) -> None:
    cfg = load_config()
    uid = str(user_id)
    cfg.setdefault(uid, {})
    if path is None:
        cfg[uid].pop(kind, None)
    else:
        cfg[uid][kind] = path
    if not cfg[uid]:
        cfg.pop(uid, None)
    save_config(cfg)


# ---------- Phát âm thanh ----------

async def play_sound(channel: discord.VoiceChannel, sound_path: str) -> None:
    """Join channel, phát file, rồi rời đi. Tuần tự theo từng guild."""
    guild = channel.guild
    lock = _guild_locks.setdefault(guild.id, asyncio.Lock())

    async with lock:
        vc = guild.voice_client

        # Coi như "đang ngồi sẵn" CHỈ KHI kết nối còn thật sự sống.
        alive = vc and vc.is_connected()

        try:
            if alive:
                # Bot đã ngồi sẵn ở một channel còn sống → KHÔNG di chuyển.
                # Chỉ phát nếu sự kiện xảy ra đúng channel bot đang ở.
                if vc.channel.id != channel.id:
                    return
            else:
                # Dọn voice_client cũ bị treo / zombie (nếu có) trước khi connect lại
                if vc:
                    try:
                        await vc.disconnect(force=True)
                    except Exception:
                        pass
                # Connect (lại) vào channel và ở lại.
                vc = await channel.connect(timeout=20.0, reconnect=True)
        except asyncio.TimeoutError:
            print("❌ Hết thời gian chờ kết nối voice (timeout).")
            return
        except discord.ClientException as e:
            print(f"❌ Không kết nối được voice: {e}")
            return

        # Chờ kết nối voice thực sự sẵn sàng (handshake xong) trước khi phát
        for _ in range(50):  # tối đa ~5s
            if vc.is_connected():
                break
            await asyncio.sleep(0.1)
        if not vc.is_connected():
            print("❌ Voice client chưa connected sau khi chờ → bỏ phát.")
            return

        # Chờ nếu đang phát dở
        while vc.is_playing():
            await asyncio.sleep(0.2)

        print(f"▶️ Phát: {sound_path} tại #{channel.name}")
        source = discord.FFmpegPCMAudio(sound_path)
        done = asyncio.Event()

        def _after(err):
            if err:
                print(f"❌ Lỗi khi phát: {err}")
            bot.loop.call_soon_threadsafe(done.set)

        try:
            vc.play(source, after=_after)
        except discord.ClientException as e:
            print(f"❌ Không phát được: {e}")
            return
        await done.wait()
        # Bot Ở LẠI trong channel, không tự rời. Dùng lệnh !leave để gọi bot ra.


# ---------- Sự kiện ----------

@bot.event
async def on_ready():
    print(f"Bot đã online: {bot.user} (id={bot.user.id})")


@bot.event
async def on_voice_state_update(member, before, after):
    if member.bot:
        return  # bỏ qua bot (kể cả chính nó)

    print(f"🔔 voice update: {member.display_name} | {before.channel} -> {after.channel}")

    # User VÀO 1 channel (trước đó không ở channel nào, hoặc chuyển channel)
    if after.channel and before.channel != after.channel:
        sound = get_user_sound(member.id, "join")
        if sound:
            await play_sound(after.channel, sound)

    # User RỜI 1 channel (rời hẳn hoặc chuyển sang channel khác)
    elif before.channel and before.channel != after.channel:
        sound = get_user_sound(member.id, "leave")
        if sound:
            await play_sound(before.channel, sound)


# ---------- Lệnh cấu hình ----------

async def _save_attachment(ctx, kind: str):
    if not ctx.message.attachments:
        await ctx.reply("⚠️ Bạn cần đính kèm 1 file âm thanh cùng với lệnh này.")
        return

    att = ctx.message.attachments[0]
    ext = os.path.splitext(att.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        await ctx.reply(f"⚠️ Định dạng không hỗ trợ. Cho phép: {', '.join(ALLOWED_EXT)}")
        return
    if att.size > MAX_SIZE:
        await ctx.reply("⚠️ File quá lớn (tối đa 8 MB).")
        return

    filename = f"{ctx.author.id}_{kind}{ext}"
    path = os.path.join(SOUNDS_DIR, filename)

    # Xoá file cũ khác đuôi nếu có
    old = get_own_sound(ctx.author.id, kind)
    if old and os.path.exists(old) and old != path:
        try:
            os.remove(old)
        except OSError:
            pass

    await att.save(path)
    set_user_sound(ctx.author.id, kind, path)
    label = "vào" if kind == "join" else "rời"
    await ctx.reply(f"✅ Đã đặt âm thanh khi bạn {label} channel: `{att.filename}`")


@bot.command(name="setjoin")
async def setjoin(ctx):
    await _save_attachment(ctx, "join")


@bot.command(name="setleave")
async def setleave(ctx):
    await _save_attachment(ctx, "leave")


@bot.command(name="clearjoin")
async def clearjoin(ctx):
    old = get_own_sound(ctx.author.id, "join")
    if old and os.path.exists(old):
        try:
            os.remove(old)
        except OSError:
            pass
    set_user_sound(ctx.author.id, "join", None)
    await ctx.reply("🗑️ Đã xoá âm thanh riêng khi vào (sẽ dùng lại âm mặc định).")


@bot.command(name="clearleave")
async def clearleave(ctx):
    old = get_own_sound(ctx.author.id, "leave")
    if old and os.path.exists(old):
        try:
            os.remove(old)
        except OSError:
            pass
    set_user_sound(ctx.author.id, "leave", None)
    await ctx.reply("🗑️ Đã xoá âm thanh riêng khi rời (sẽ dùng lại âm mặc định).")


@bot.command(name="mysounds")
async def mysounds(ctx):
    join = get_own_sound(ctx.author.id, "join")
    leave = get_own_sound(ctx.author.id, "leave")
    msg = "🎵 **Âm thanh của bạn:**\n"
    msg += f"• Vào: {os.path.basename(join) if join else '(dùng mặc định)'}\n"
    msg += f"• Rời: {os.path.basename(leave) if leave else '(dùng mặc định)'}"
    await ctx.reply(msg)


@bot.command(name="join")
async def join(ctx):
    """Gọi bot vào voice channel mà bạn đang ở."""
    if not ctx.author.voice or not ctx.author.voice.channel:
        await ctx.reply("⚠️ Bạn cần đang ở trong một voice channel.")
        return
    channel = ctx.author.voice.channel
    vc = ctx.guild.voice_client
    if vc and vc.is_connected():
        await vc.move_to(channel)
    else:
        await channel.connect()
    await ctx.reply(f"✅ Bot đã vào **{channel.name}** và sẽ ở lại.")


@bot.command(name="leave")
async def leave(ctx):
    """Gọi bot rời khỏi voice channel."""
    vc = ctx.guild.voice_client
    if vc and vc.is_connected():
        await vc.disconnect()
        await ctx.reply("👋 Bot đã rời voice channel.")
    else:
        await ctx.reply("ℹ️ Bot không ở trong voice channel nào.")


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("Chưa có DISCORD_TOKEN. Copy .env.example thành .env và điền token.")
    bot.run(TOKEN)
