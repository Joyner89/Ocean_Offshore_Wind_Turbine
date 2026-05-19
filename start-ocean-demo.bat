@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo OceanDemo one-click start
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found in PATH.
    echo Please install Node.js 18 or newer, then run this file again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found in PATH.
    echo Please install Node.js with npm, then run this file again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo.
)

echo Ensuring HTTPS certificate...
node scripts\ensure-https-cert.js
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to create HTTPS certificate.
    pause
    exit /b 1
)
echo.

echo Checking port 8080...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do (
    echo Port 8080 is already in use by PID %%P.
    echo Stopping PID %%P...
    taskkill /PID %%P /F >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] Failed to stop PID %%P.
        echo Please close the old server manually, then run this file again.
        echo.
        pause
        exit /b 1
    )
)
echo.

echo Starting development server...
echo Local URL:
echo https://localhost:8080
echo.
echo LAN URLs:
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /C:"IPv4"') do (
    for /f "tokens=* delims= " %%A in ("%%I") do echo https://%%A:8080
)
echo.
echo If LAN devices cannot open the page, allow Node.js through Windows Firewall.
echo If Chrome warns about the certificate, import certs\ocean-demo-local.cer into Trusted Root Certification Authorities on the client machine.
echo.
echo If the page shows old WebGPU errors, press Ctrl+F5 in the browser.
echo.

call npm start -- --host 0.0.0.0 --port 8080

echo.
echo Development server stopped.
pause
