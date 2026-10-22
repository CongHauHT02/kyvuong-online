@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG GAME CỜ TƯỚNG (KỲ VƯƠNG)
echo   Backend: .NET 9.0  ^|  Frontend: React.js + Vite
echo ========================================================
start "Xiangqi Backend (.NET 9.0)" "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "Xiangqi Frontend (React Vite)" "%~dp0run_frontend.bat"
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo.
echo Đã mở Game Cờ Tướng tại: http://localhost:5173
echo Backend API đang chạy tại: http://localhost:5235
echo.
