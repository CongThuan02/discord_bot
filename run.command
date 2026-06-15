#!/usr/bin/env bash
# Double-click de chay tren macOS.
# Neu khong chay duoc: mo Terminal, go: chmod +x run.command
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  DISCORD SOUND BOT - Khoi dong"
echo "============================================"
echo

# --- Tim Python 3 ---
PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "[LOI] Khong tim thay Python 3."
  echo "Cai bang Homebrew: brew install python   (hoac tai tai https://www.python.org)"
  echo
  read -n 1 -s -r -p "Nhan phim bat ky de dong..."
  exit 1
fi

# --- Kiem tra ffmpeg ---
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[CANH BAO] Khong tim thay ffmpeg - bot can ffmpeg de phat am thanh."
  echo "Cai bang: brew install ffmpeg"
  echo "Bot van chay nhung co the khong phat duoc am thanh."
  echo
fi

# --- Virtual env ---
if [ ! -x ".venv/bin/python" ]; then
  echo "[1/3] Tao moi truong ao (lan dau, hoi lau)..."
  "$PY" -m venv .venv
fi

# --- Cai thu vien ---
echo "[2/3] Cai dat / cap nhat thu vien..."
.venv/bin/python -m pip install --upgrade pip >/dev/null 2>&1 || true
.venv/bin/python -m pip install -r requirements.txt

# --- .env ---
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo
  echo "============================================"
  echo "  CAN CAU HINH TOKEN"
  echo "============================================"
  echo "Da tao file .env. Dan token bot Discord vao DISCORD_TOKEN roi chay lai."
  open -e .env || true
  echo
  read -n 1 -s -r -p "Nhan phim bat ky de dong..."
  exit 0
fi

# --- Chay ---
echo "[3/3] Khoi dong bot..."
echo
.venv/bin/python bot.py

echo
read -n 1 -s -r -p "Bot da dung. Nhan phim bat ky de dong..."
