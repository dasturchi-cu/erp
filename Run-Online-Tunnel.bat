@echo off
title ERP Online Cloudflare Tunnel
cd /d "%~dp0"

echo =======================================================
echo         ERP Global Online Tunnel (Cloudflare)
echo =======================================================
echo Dunyoning istalgan joyidan (4G/5G, boshqa Wi-Fi) kirish
echo uchun bepul HTTPS havola olinmoqda...
echo.

.tools\cloudflared.exe tunnel --url http://127.0.0.1:5173

pause
