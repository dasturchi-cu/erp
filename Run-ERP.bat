@echo off
title ERP Tizimi
cd /d "%~dp0"

echo Lokal PostgreSQL tekshirilmoqda...
netstat -ano | findstr :5433 >nul
if errorlevel 1 (
    echo PostgreSQL ishga tushmoqda...
    .tools\pgsql\bin\pg_ctl.exe -D .tools\pgsql\data -o "-p 5433" -l .tools\pg.log start
    timeout /t 3 /nobreak >nul
)

echo Backend ishga tushmoqda...
start /min "ERP Backend" ".tools\node-v22.12.0\node.exe" "backend\dist\src\main.js"

echo Desktop Client ishga tushmoqda...
cd desktop
start /min "ERP Frontend" "..\\.tools\node-v22.12.0\node.exe" "node_modules\vite\bin\vite.js" preview --host 0.0.0.0 --port 5173

timeout /t 3 /nobreak >nul
echo Dastur brauzerda ochilmoqda...
start http://127.0.0.1:5173

echo ==============================================
echo ERP muvaffaqiyatli ishga tushirildi!
echo 
echo 1. Ushbu kompyuterda:  http://127.0.0.1:5173
echo 2. Bir xil Wi-Fi tarmog'idagi telefon/kompyuterlarda:
echo    http://192.168.100.130:5173
echo ==============================================
pause
