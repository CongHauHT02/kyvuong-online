@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG BACKEND CỜ TƯỚNG (.NET 9.0 Web API ^& SignalR)
echo ========================================================
set PATH=C:\dotnet9;%PATH%
cd /d "%~dp0backend"
dotnet run --launch-profile http
pause
