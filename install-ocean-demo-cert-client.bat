@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo OceanDemo HTTPS certificate installer
echo ========================================
echo.

set "CERT_FILE=certs\ocean-demo-local.cer"

if not exist "%CERT_FILE%" (
    echo [ERROR] Certificate file was not found:
    echo %CD%\%CERT_FILE%
    echo.
    echo Copy the certs folder from the OceanDemo server machine first.
    pause
    exit /b 1
)

echo Installing certificate into CurrentUser Trusted Root store...
certutil -user -addstore Root "%CERT_FILE%"
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install certificate.
    echo Try running this file as Administrator.
    pause
    exit /b 1
)

echo.
echo Certificate installed.
echo Restart Chrome before opening OceanDemo again.
pause

endlocal
