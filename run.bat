@echo off
chcp 65001 >nul
title Discord Sound Bot
cd /d "%~dp0"

echo ============================================
echo   DISCORD SOUND BOT - Khoi dong
echo ============================================
echo.

REM --- Kiem tra Node.js ---
where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js.
    echo Tai Node.js tai: https://nodejs.org/  (chon ban LTS)
    echo.
    pause
    exit /b 1
)

REM --- Cai thu vien neu chua co ---
if not exist "node_modules" (
    echo [1/2] Cai dat thu vien (lan dau, hoi lau)...
    call npm install
    if errorlevel 1 (
        echo [LOI] Cai thu vien that bai. Kiem tra ket noi mang.
        pause
        exit /b 1
    )
)

REM --- Tao .env neu chua co ---
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo.
    echo ============================================
    echo   CAN CAU HINH TOKEN
    echo ============================================
    echo Mo file .env vua tao, dan token bot Discord vao DISCORD_TOKEN
    echo roi chay lai file nay.
    echo.
    notepad ".env"
    pause
    exit /b 0
)

REM --- Chay bot ---
echo [2/2] Khoi dong bot...
echo.
node bot.js

echo.
echo Bot da dung. Nhan phim bat ky de dong.
pause
