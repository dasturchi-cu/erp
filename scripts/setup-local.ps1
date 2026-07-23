# ERP Lokal O'rnatish Skripti (Docker-siz)
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
if ($Root -ne "") {
    $Root = Split-Path -Parent $Root
} else {
    $Root = (Get-Location).Path
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "        ERP Lokal O'rnatish Tizimi           " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Ushbu skript PostgreSQL, Node.js va barcha kutubxonalarni"
Write-Host "avtomatik lokal o'rnatib, sozlab beradi."
Write-Host ""

# 1. Asboblar uchun papka yaratish
$ToolsDir = "$Root\.tools"
if (-not (Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

# 2. Node.js ni tekshirish va o'rnatish (Portable)
$NodeDir = "$ToolsDir\node-v22.12.0"
$NodeExe = "$NodeDir\node.exe"
$NpmCmd = "$NodeDir\npm.cmd"

# Node.js portable papkasini vaqtinchalik PATH ga qo'shamiz
$env:PATH = "$NodeDir;" + $env:PATH

if (-not (Test-Path $NodeExe)) {
    Write-Host "[1/5] Node.js (Portable) yuklab olinmoqda..." -ForegroundColor Yellow
    $NodeZip = "$ToolsDir\node.zip"
    $NodeUrl = "https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip"
    
    Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeZip
    Write-Host "Node.js arxivdan chiqarilmoqda..." -ForegroundColor Yellow
    Expand-Archive -Path $NodeZip -DestinationPath $ToolsDir
    
    # Papka nomini standartlashtirish
    Rename-Item -Path "$ToolsDir\node-v22.12.0-win-x64" -NewName "node-v22.12.0"
    Remove-Item $NodeZip -Force
    Write-Host "[OK] Node.js o'rnatildi." -ForegroundColor Green
} else {
    Write-Host "[OK] Node.js allaqachon mavjud." -ForegroundColor Green
}

# 3. PostgreSQL ni tekshirish va o'rnatish (Portable)
$PgDir = "$ToolsDir\pgsql"
$PgDataDir = "$PgDir\data"
$PgCtl = "$PgDir\bin\pg_ctl.exe"
$InitDb = "$PgDir\bin\initdb.exe"

if (-not (Test-Path $PgCtl)) {
    Write-Host "[2/5] PostgreSQL (Portable) yuklab olinmoqda..." -ForegroundColor Yellow
    $PgZip = "$ToolsDir\pgsql.zip"
    $PgUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip"
    
    try {
        Write-Host "BITS Transfer yordamida yuklanmoqda..." -ForegroundColor Cyan
        Start-BitsTransfer -Source $PgUrl -Destination $PgZip -ErrorAction Stop
    } catch {
        Write-Host "BITS muvaffaqiyatsiz bo'ldi. Invoke-WebRequest ishlatilmoqda..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $PgUrl -OutFile $PgZip -TimeoutSec 1800
    }
    
    Write-Host "PostgreSQL arxivdan chiqarilmoqda..." -ForegroundColor Yellow
    Expand-Archive -Path $PgZip -DestinationPath $ToolsDir
    Remove-Item $PgZip -Force
    Write-Host "[OK] PostgreSQL o'rnatildi." -ForegroundColor Green
} else {
    Write-Host "[OK] PostgreSQL allaqachon o'rnatilgan." -ForegroundColor Green
}

# 4. Ma'lumotlar bazasini initsializatsiya qilish
if (-not (Test-Path $PgDataDir)) {
    Write-Host "[3/5] Ma'lumotlar bazasi initsializatsiya qilinmoqda..." -ForegroundColor Yellow
    # initdb yordamida bazani yaratish (foydalanuvchi: erp, parol: erp_secret, autentifikatsiya: trust)
    $pwFile = "$ToolsDir\pg_pass.txt"
    "erp_secret" | Out-File -FilePath $pwFile -Encoding ascii
    
    & $InitDb -D $PgDataDir -U erp --pwfile=$pwFile -A md5
    Remove-Item $pwFile -Force
    
    # pg_hba.conf ga localhost ulanishlarini qo'shish
    $hbaFile = "$PgDataDir\pg_hba.conf"
    (Get-Content $hbaFile) -replace "host    all             all             127.0.0.1/32            scram-sha-256", "host    all             all             127.0.0.1/32            md5" | Set-Content $hbaFile
    
    Write-Host "[OK] Baza yaratildi." -ForegroundColor Green
} else {
    Write-Host "[OK] Baza allaqachon mavjud." -ForegroundColor Green
}

# Bazani ishga tushirish (agar hali ishlamayotgan bo'lsa)
$port = 5432
$dbRunning = $false
try {
    $socket = New-Object System.Net.Sockets.TcpClient
    $socket.Connect("127.0.0.1", $port)
    $socket.Close()
    $dbRunning = $true
} catch {
    $dbRunning = $false
}

if (-not $dbRunning) {
    Write-Host "Lokal PostgreSQL ishga tushirilmoqda..." -ForegroundColor Yellow
    & $PgCtl -D $PgDataDir -o "-p $port" -l "$ToolsDir\pg.log" start
    Start-Sleep -Seconds 5
}

# 5. Env va Sozlamalar fayllarini yaratish
Write-Host "[4/5] Sozlamalar (.env) fayllari tekshirilmoqda..." -ForegroundColor Yellow
$BackendEnv = "$Root\backend\.env"
$DesktopEnv = "$Root\desktop\.env"

if (-not (Test-Path $BackendEnv)) {
    Copy-Item "$Root\backend\.env.example" $BackendEnv
}
if (-not (Test-Path $DesktopEnv)) {
    Copy-Item "$Root\desktop\.env.example" $DesktopEnv
}

# 6. Kutubxonalarni o'rnatish (npm install)
Write-Host "[5/5] Backend va Frontend kutubxonalari o'rnatilmoqda..." -ForegroundColor Yellow

# Local node_modules/.bin ni vaqtinchalik PATH ga qo'shamiz (ts-node va prisma uchun)
$env:PATH = "$Root\backend\node_modules\.bin;$env:PATH"

# Backend package-lock dan o'rnatish
Write-Host "Backend kutubxonalari..." -ForegroundColor Cyan
Set-Location "$Root\backend"
& $NpmCmd ci

# Prisma ulanishini sozlash va migratsiyalarni yuritish
Write-Host "Ma'lumotlar bazasini sozlash (Prisma)..." -ForegroundColor Cyan
# .env dagi DATABASE_URL portini va hostini tekshiramiz (5434 -> 5432 va localhost -> 127.0.0.1)
(Get-Content $BackendEnv) -replace "5434", "5432" -replace "localhost:5432", "127.0.0.1:5432" | Set-Content $BackendEnv

& $NodeDir\node.exe node_modules\prisma\build\index.js db push --accept-data-loss
& $NodeDir\node.exe node_modules\prisma\build\index.js db seed

Write-Host "Backendni build qilish..." -ForegroundColor Cyan
& $NpmCmd run build

# Frontend o'rnatish
Write-Host "Frontend kutubxonalari..." -ForegroundColor Cyan
Set-Location "$Root\desktop"
& $NpmCmd ci

# Boshlang'ich build qilish
Write-Host "Frontendni build qilish..." -ForegroundColor Cyan
& $NpmCmd run build

# 7. Tezkor ishga tushirish faylini yaratish (Run-ERP.bat)
Set-Location $Root
$RunBat = "$Root\Run-ERP.bat"
$BatContent = @"
@echo off
title ERP Tizimi
cd /d "%~dp0"

echo Lokal PostgreSQL tekshirilmoqda...
netstat -ano | findstr :5432 >nul
if errorlevel 1 (
    echo PostgreSQL ishga tushmoqda...
    .tools\pgsql\bin\pg_ctl.exe -D .tools\pgsql\data -o "-p 5432" -l .tools\pg.log start
    timeout /t 3 /nobreak >nul
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
"@

$BatContent | Out-File -FilePath $RunBat -Encoding ascii

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " ERP lokal o'rnatish muvaffaqiyatli yakunlandi! " -ForegroundColor Green
Write-Host " Loyihani ishga tushirish uchun Run-ERP.bat faylini " -ForegroundColor Green
Write-Host " ikki marta bosing.                           " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
