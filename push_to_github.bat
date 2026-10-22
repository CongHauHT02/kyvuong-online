@echo off
setlocal
echo ========================================================
echo   PUSH CODE TO GITHUB: CongHauHT02/kyvuong-online
echo ========================================================
echo.

set "GIT_EXE=C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe"

if exist "%GIT_EXE%" (
    set "GIT_CMD=%GIT_EXE%"
) else (
    set "GIT_CMD=git"
)

echo [1/2] Checking Git status...
"%GIT_CMD%" status
echo.

echo [2/2] Pushing to GitHub (branch main)...
echo If a browser window opens, please click 'Sign in with your browser'.
echo.
"%GIT_CMD%" push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESS! Repository updated:
    echo   https://github.com/CongHauHT02/kyvuong-online
    echo ========================================================
) else (
    echo ========================================================
    echo   Push failed or sign-in was cancelled.
    echo ========================================================
)

echo.
pause