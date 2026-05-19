@echo off
setlocal

echo ========================================
echo OceanDemo LAN client launcher
echo ========================================
echo.

set /p SERVER_IP=Enter OceanDemo server LAN IP:
if "%SERVER_IP%"=="" (
    echo [ERROR] Server IP is empty.
    pause
    exit /b 1
)

set "ORIGIN=https://%SERVER_IP%:8080"
set "CHROME_EXE="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_EXE (
    echo [ERROR] Chrome was not found in common install paths.
    echo Please install Chrome, or open Chrome manually with:
    echo %ORIGIN%
    echo.
    pause
    exit /b 1
)

echo Opening:
echo %ORIGIN%
echo.
echo If Chrome shows a certificate warning, import certs\ocean-demo-local.cer into
echo Trusted Root Certification Authorities on this client machine, then reopen Chrome.
echo.

start "" "%CHROME_EXE%" --new-window --enable-unsafe-webgpu "%ORIGIN%"

endlocal
