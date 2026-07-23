@echo off
title ERP Tizimi
cd /d "%~dp0"

echo Lokal PostgreSQL tekshirilmoqda...
netstat -ano | findstr :5432 >nul
if errorlevel 1 (
    echo PostgreSQL ishga tushmoqda...
    .tools\pgsql\bin\pg_ctl.exe -D .tools\pgsql\data -o "-p 5432" -l .tools\pg.log start
    
    echo DB faollashishini kutilmoqda...
    :wait_pg
    timeout /t 1 /nobreak >nul
    netstat -ano | findstr :5432 >nul
    if errorlevel 1 (
        goto wait_pg
    )
    echo DB tayyor!
)

echo Backend ishga tushmoqda...
start /min "ERP Backend" ".tools\node-v22.12.0\node.exe" "backend\dist\src\main.js"

echo Desktop Client ishga tushmoqda...
cd desktop
start /min "ERP Frontend" "..\\.tools\node-v22.12.0\node.exe" "node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173

timeout /t 3 /nobreak >nul
echo Dastur brauzerda ochilmoqda...
start http://127.0.0.1:5173

echo ==============================================
echo ERP muvaffaqiyatli ishga tushirildi!
echo Brauzerda http://127.0.0.1:5173 ochildi.
echo O'chirib qo'yish uchun ushbu oynani yoping.
echo ==============================================
pause
