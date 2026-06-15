#!/usr/bin/env bash
# Chay tren Linux: ./run.sh  (neu bao loi quyen: chmod +x run.sh)
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  DISCORD SOUND BOT - Khoi dong"
echo "============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "[LOI] Khong tim thay Node.js. Cai: sudo apt install nodejs npm"
  echo "Hoac tai tai: https://nodejs.org (khuyen nghi ban LTS >= 18)"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[1/2] Cai dat thu vien (lan dau, hoi lau)..."
  npm install
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo
  echo "============================================"
  echo "  CAN CAU HINH TOKEN"
  echo "============================================"
  echo "Da tao file .env. Mo no, dan token bot Discord vao DISCORD_TOKEN roi chay lai."
  exit 0
fi

echo "[2/2] Khoi dong bot..."
echo
node bot.js
