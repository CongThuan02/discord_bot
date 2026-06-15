#!/usr/bin/env bash
# Double-click de chay tren macOS.
# Neu khong chay duoc: mo Terminal, go: chmod +x run.command
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  DISCORD SOUND BOT - Khoi dong"
echo "============================================"
echo

# --- Tim Node.js ---
if ! command -v node >/dev/null 2>&1; then
  echo "[LOI] Khong tim thay Node.js."
  echo "Cai bang Homebrew: brew install node   (hoac tai tai https://nodejs.org)"
  echo
  read -n 1 -s -r -p "Nhan phim bat ky de dong..."
  exit 1
fi

# --- Cai thu vien ---
if [ ! -d "node_modules" ]; then
  echo "[1/2] Cai dat thu vien (lan dau, hoi lau)..."
  npm install
fi

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
echo "[2/2] Khoi dong bot..."
echo
node bot.js

echo
read -n 1 -s -r -p "Bot da dung. Nhan phim bat ky de dong..."
