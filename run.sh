#!/usr/bin/env bash
# Chay tren Linux: ./run.sh  (neu bao loi quyen: chmod +x run.sh)
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  DISCORD SOUND BOT - Khoi dong"
echo "============================================"
echo

PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  echo "[LOI] Khong tim thay Python 3. Cai: sudo apt install python3 python3-venv"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[CANH BAO] Khong tim thay ffmpeg. Cai: sudo apt install ffmpeg"
  echo "Bot van chay nhung co the khong phat duoc am thanh."
  echo
fi

if [ ! -x ".venv/bin/python" ]; then
  echo "[1/3] Tao moi truong ao (lan dau, hoi lau)..."
  "$PY" -m venv .venv
fi

echo "[2/3] Cai dat / cap nhat thu vien..."
.venv/bin/python -m pip install --upgrade pip >/dev/null 2>&1 || true
.venv/bin/python -m pip install -r requirements.txt

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo
  echo "============================================"
  echo "  CAN CAU HINH TOKEN"
  echo "============================================"
  echo "Da tao file .env. Mo no, dan token bot Discord vao DISCORD_TOKEN roi chay lai."
  exit 0
fi

echo "[3/3] Khoi dong bot..."
echo
.venv/bin/python bot.py
