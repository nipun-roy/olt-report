@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================================
echo   Starting OneSky OLT Management System (Next.js)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH!
    echo Please download and install Node.js (LTS) from: https://nodejs.org/
    echo After installing, restart this script.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist node_modules (
    echo [INFO] Installing NPM dependencies...
    call npm install
)

echo [INFO] Starting Next.js development server...
echo Access the system at: http://localhost:3000
echo.
call npm run dev
pause
