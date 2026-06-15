@echo off
chcp 65001 >nul
title Discord Sound Bot
cd /d "%~dp0"

echo ============================================
echo   DISCORD SOUND BOT - Khoi dong
echo ============================================
echo.

REM --- Kiem tra Python ---
where python >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay Python.
    echo Tai Python tai: https://www.python.org/downloads/
    echo Khi cai nho TICK vao "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

REM --- Kiem tra ffmpeg ---
where ffmpeg >nul 2>nul
if errorlevel 1 (
    echo [CANH BAO] Khong tim thay ffmpeg - bot can ffmpeg de phat am thanh.
    echo Tai ffmpeg tai: https://www.gyan.dev/ffmpeg/builds/ (ffmpeg-release-essentials.zip)
    echo Giai nen va them thu muc bin vao PATH, hoac copy ffmpeg.exe vao thu muc nay.
    echo.
    echo Bot van se chay nhung co the khong phat duoc am thanh.
    echo.
    pause
)

REM --- Tao virtual env neu chua co ---
if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Tao moi truong ao (lan dau, hoi lau)...
    python -m venv .venv
)

REM --- Cai thu vien ---
echo [2/3] Cai dat / cap nhat thu vien...
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul 2>nul
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
    echo [LOI] Cai thu vien that bai. Kiem tra ket noi mang.
    pause
    exit /b 1
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
echo [3/3] Khoi dong bot...
echo.
".venv\Scripts\python.exe" bot.py

echo.
echo Bot da dung. Nhan phim bat ky de dong.
pause
