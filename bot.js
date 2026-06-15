/**
 * Bot Discord phát âm thanh tùy chỉnh khi user vào / rời voice channel.
 *
 * - Mỗi user cấu hình riêng âm thanh "vào" và âm thanh "ra".
 * - Config lưu trong sounds_config.json, file âm thanh lưu trong thư mục sounds/.
 * - Set âm thanh bằng cách gửi lệnh kèm file đính kèm (attachment).
 *
 * Lệnh:
 *   !setjoin   (đính kèm 1 file âm thanh)  -> đặt âm thanh khi BẠN vào channel
 *   !setleave  (đính kèm 1 file âm thanh)  -> đặt âm thanh khi BẠN rời channel
 *   !clearjoin / !clearleave              -> xoá âm thanh đã đặt
 *   !mysounds                             -> xem âm thanh hiện tại của bạn
 *   !join / !leave                        -> gọi bot vào / rời voice channel
 */

require('dotenv').config();

// Đưa ffmpeg-static vào PATH để @discordjs/voice tìm thấy ffmpeg
// (nếu máy đã cài ffmpeg hệ thống thì dòng này vô hại).
try {
  const ffmpegPath = require('ffmpeg-static');
  if (ffmpegPath) {
    process.env.PATH = `${require('path').dirname(ffmpegPath)}${require('path').delimiter}${process.env.PATH}`;
  }
} catch {
  /* dùng ffmpeg hệ thống nếu có */
}

const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  Client,
  GatewayIntentBits,
  Partials,
} = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  NoSubscriberBehavior,
} = require('@discordjs/voice');

const TOKEN = process.env.DISCORD_TOKEN;

// DATA_DIR = nơi lưu file user upload + config (Railway gắn volume vào đây).
// Khi chạy local, mặc định dùng thư mục dự án hiện tại.
const DATA_DIR = process.env.DATA_DIR || '.';
const SOUNDS_DIR = path.join(DATA_DIR, 'sounds');
const CONFIG_FILE = path.join(DATA_DIR, 'sounds_config.json');

// Âm thanh mặc định nằm SẴN trong repo (thư mục sounds/ của dự án), không phải volume.
const DEFAULT_JOIN = path.join('sounds', '_default_join.mp3');
const DEFAULT_LEAVE = path.join('sounds', '_default_leave.mp3');

// Đuôi file âm thanh cho phép
const ALLOWED_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.webm'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const PREFIX = '!';

fs.mkdirSync(SOUNDS_DIR, { recursive: true });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // cần để nhận sự kiện vào/ra voice
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // cần để đọc lệnh prefix
  ],
  partials: [Partials.Channel],
});

// Hàng đợi/khoá theo từng guild để tránh phát chồng nhiều âm thanh cùng lúc
const guildQueues = new Map(); // guildId -> Promise đang chạy

// ---------- Lưu / đọc config ----------

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

// kind là 'join' hoặc 'leave'. Trả về đường dẫn file nếu có, fallback về mặc định.
function getUserSound(userId, kind) {
  const cfg = loadConfig();
  const p = cfg[String(userId)]?.[kind];
  if (p && fs.existsSync(p)) return p;
  const def = kind === 'join' ? DEFAULT_JOIN : DEFAULT_LEAVE;
  if (def && fs.existsSync(def)) return def;
  return null;
}

// Chỉ trả về âm thanh RIÊNG user đã cài (không fallback về mặc định).
function getOwnSound(userId, kind) {
  const cfg = loadConfig();
  const p = cfg[String(userId)]?.[kind];
  if (p && fs.existsSync(p)) return p;
  return null;
}

function setUserSound(userId, kind, p) {
  const cfg = loadConfig();
  const uid = String(userId);
  if (!cfg[uid]) cfg[uid] = {};
  if (p === null) {
    delete cfg[uid][kind];
  } else {
    cfg[uid][kind] = p;
  }
  if (Object.keys(cfg[uid]).length === 0) delete cfg[uid];
  saveConfig(cfg);
}

// ---------- Phát âm thanh ----------

// Join channel, phát file, rồi Ở LẠI. Tuần tự theo từng guild.
async function playSound(channel, soundPath) {
  const guildId = channel.guild.id;

  // Nối tiếp vào hàng đợi của guild để chạy tuần tự
  const prev = guildQueues.get(guildId) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => doPlay(channel, soundPath));
  guildQueues.set(guildId, next);
  return next;
}

async function doPlay(channel, soundPath) {
  const guild = channel.guild;
  let connection = getVoiceConnection(guild.id);

  const alive =
    connection &&
    connection.state.status !== VoiceConnectionStatus.Destroyed &&
    connection.state.status !== VoiceConnectionStatus.Disconnected;

  if (alive) {
    // Bot đã ngồi sẵn ở một channel còn sống → KHÔNG di chuyển.
    // Chỉ phát nếu sự kiện xảy ra đúng channel bot đang ở.
    if (connection.joinConfig.channelId !== channel.id) return;
  } else {
    if (connection) {
      try {
        connection.destroy();
      } catch {
        /* ignore */
      }
    }
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (e) {
    console.error('❌ Hết thời gian chờ kết nối voice (timeout).');
    try {
      connection.destroy();
    } catch {
      /* ignore */
    }
    return;
  }

  console.log(`▶️ Phát: ${soundPath} tại #${channel.name}`);

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });
  const resource = createAudioResource(soundPath);
  const subscription = connection.subscribe(player);
  player.play(resource);

  try {
    // Chờ tới khi phát xong (player về Idle)
    await entersState(player, AudioPlayerStatus.Playing, 10_000).catch(() => {});
    await new Promise((resolve) => {
      player.on(AudioPlayerStatus.Idle, resolve);
      player.on('error', (err) => {
        console.error(`❌ Lỗi khi phát: ${err.message}`);
        resolve();
      });
    });
  } finally {
    if (subscription) subscription.unsubscribe();
  }
  // Bot Ở LẠI trong channel, không tự rời. Dùng lệnh !leave để gọi bot ra.
}

// ---------- Tải file đính kèm ----------

function downloadAttachment(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

// ---------- Sự kiện ----------

client.once('ready', () => {
  console.log(`Bot đã online: ${client.user.tag} (id=${client.user.id})`);
});

client.on('voiceStateUpdate', async (before, after) => {
  const member = after.member || before.member;
  if (!member || member.user.bot) return; // bỏ qua bot (kể cả chính nó)

  console.log(
    `🔔 voice update: ${member.displayName} | ${before.channel?.name} -> ${after.channel?.name}`,
  );

  // User VÀO 1 channel (trước đó không ở channel nào, hoặc chuyển channel)
  if (after.channel && before.channelId !== after.channelId) {
    const sound = getUserSound(member.id, 'join');
    if (sound) await playSound(after.channel, sound);
  }
  // User RỜI 1 channel (rời hẳn hoặc chuyển sang channel khác)
  else if (before.channel && before.channelId !== after.channelId) {
    const sound = getUserSound(member.id, 'leave');
    if (sound) await playSound(before.channel, sound);
  }
});

// ---------- Lệnh cấu hình ----------

async function saveAttachment(message, kind) {
  const att = message.attachments.first();
  if (!att) {
    await message.reply('⚠️ Bạn cần đính kèm 1 file âm thanh cùng với lệnh này.');
    return;
  }

  const ext = path.extname(att.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    await message.reply(`⚠️ Định dạng không hỗ trợ. Cho phép: ${ALLOWED_EXT.join(', ')}`);
    return;
  }
  if (att.size > MAX_SIZE) {
    await message.reply('⚠️ File quá lớn (tối đa 8 MB).');
    return;
  }

  const filename = `${message.author.id}_${kind}${ext}`;
  const dest = path.join(SOUNDS_DIR, filename);

  // Xoá file cũ khác đuôi nếu có
  const old = getOwnSound(message.author.id, kind);
  if (old && fs.existsSync(old) && old !== dest) {
    try {
      fs.unlinkSync(old);
    } catch {
      /* ignore */
    }
  }

  try {
    await downloadAttachment(att.url, dest);
  } catch (e) {
    await message.reply(`⚠️ Không tải được file: ${e.message}`);
    return;
  }

  setUserSound(message.author.id, kind, dest);
  const label = kind === 'join' ? 'vào' : 'rời';
  await message.reply(`✅ Đã đặt âm thanh khi bạn ${label} channel: \`${att.name}\``);
}

async function handleCommand(message) {
  const [cmd] = message.content.slice(PREFIX.length).trim().split(/\s+/);

  switch (cmd) {
    case 'setjoin':
      return saveAttachment(message, 'join');

    case 'setleave':
      return saveAttachment(message, 'leave');

    case 'clearjoin': {
      const old = getOwnSound(message.author.id, 'join');
      if (old && fs.existsSync(old)) {
        try {
          fs.unlinkSync(old);
        } catch {
          /* ignore */
        }
      }
      setUserSound(message.author.id, 'join', null);
      return message.reply('🗑️ Đã xoá âm thanh riêng khi vào (sẽ dùng lại âm mặc định).');
    }

    case 'clearleave': {
      const old = getOwnSound(message.author.id, 'leave');
      if (old && fs.existsSync(old)) {
        try {
          fs.unlinkSync(old);
        } catch {
          /* ignore */
        }
      }
      setUserSound(message.author.id, 'leave', null);
      return message.reply('🗑️ Đã xoá âm thanh riêng khi rời (sẽ dùng lại âm mặc định).');
    }

    case 'mysounds': {
      const join = getOwnSound(message.author.id, 'join');
      const leave = getOwnSound(message.author.id, 'leave');
      let msg = '🎵 **Âm thanh của bạn:**\n';
      msg += `• Vào: ${join ? path.basename(join) : '(dùng mặc định)'}\n`;
      msg += `• Rời: ${leave ? path.basename(leave) : '(dùng mặc định)'}`;
      return message.reply(msg);
    }

    case 'join': {
      const channel = message.member?.voice?.channel;
      if (!channel) {
        return message.reply('⚠️ Bạn cần đang ở trong một voice channel.');
      }
      const guild = message.guild;
      let connection = getVoiceConnection(guild.id);
      if (connection) {
        try {
          connection.destroy();
        } catch {
          /* ignore */
        }
      }
      joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
      });
      return message.reply(`✅ Bot đã vào **${channel.name}** và sẽ ở lại.`);
    }

    case 'leave': {
      const connection = getVoiceConnection(message.guild.id);
      if (connection) {
        connection.destroy();
        return message.reply('👋 Bot đã rời voice channel.');
      }
      return message.reply('ℹ️ Bot không ở trong voice channel nào.');
    }

    default:
      return undefined;
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;
  try {
    await handleCommand(message);
  } catch (e) {
    console.error(`❌ Lỗi xử lý lệnh: ${e.message}`);
  }
});

// ---------- Khởi động ----------

if (!TOKEN) {
  console.error('Chưa có DISCORD_TOKEN. Copy .env.example thành .env và điền token.');
  process.exit(1);
}

client.login(TOKEN);
