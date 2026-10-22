@echo off
chcp 65001 >nul
echo ========================================================
echo   ĐÓNG GÓI GAME CỜ TƯỚNG ĐỂ UPLOAD LÊN SOMEE.COM
echo ========================================================
set PATH=C:\Users\adminloc\AppData\Roaming\nvm\v22.22.3;C:\dotnet9;%PATH%

echo.
echo [1/4] Đang biên dịch Frontend React.js...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo Lỗi khi build frontend!
    pause
    exit /b %errorlevel%
)
cd /d "%~dp0"

echo.
echo [2/4] Sao chép giao diện vào backend\wwwroot...
if not exist "backend\wwwroot" mkdir "backend\wwwroot"
xcopy /s /e /y /q "frontend\dist\*" "backend\wwwroot\"

echo.
echo [3/4] Xuất bản Backend .NET 9.0 (Self-Contained)...
dotnet publish backend\XiangqiBackend.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o somee_publish
if not exist "somee_publish\logs" mkdir "somee_publish\logs"

echo.
echo [4/4] Nén thành file zip để upload lên Somee.com...
powershell -NoProfile -Command "if (Test-Path 'xiangqi_somee_selfcontained.zip') { Remove-Item 'xiangqi_somee_selfcontained.zip' -Force }; Compress-Archive -Path 'somee_publish\*' -DestinationPath 'xiangqi_somee_selfcontained.zip' -Force"

echo.
echo ========================================================
echo   HOÀN TẤT! File zip đã tạo thành công:
echo   -> %~dp0xiangqi_somee_selfcontained.zip
echo ========================================================
pause
