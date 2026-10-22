@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG FRONTEND CỜ TƯỚNG (React.js + Vite)
echo ========================================================
set PATH=C:\Users\adminloc\AppData\Roaming\nvm\v22.22.3;%PATH%
cd /d "%~dp0frontend"
npm run dev
pause
