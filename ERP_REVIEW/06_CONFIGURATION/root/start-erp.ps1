# ERP — backend + frontend ishga tushirish
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Node = "d:\erp\.tools\node-v22.12.0-win-x64\node.exe"
if (-not (Test-Path $Node)) {
    $Node = "C:\Users\OSIYOCOMPUTERS\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
}
if (-not (Test-Path $Node)) {
    if (Test-Path "$Root\.tools\node\node.exe") { $Node = "$Root\.tools\node\node.exe" }
    else { $Node = "node" }
}

function Test-Port($port) {
    return (Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded
}

function Test-Api {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/v1/health" -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -eq 200
    } catch { return $false }
}

Write-Host "=== ERP ishga tushirilmoqda ===" -ForegroundColor Cyan

# Docker (postgres/redis)
if (-not (Test-Port 5432)) {
    Write-Host "Docker compose..." -ForegroundColor Yellow
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        Set-Location "$Root\backend"
        docker compose up -d
        Start-Sleep -Seconds 8
    }
}

# Backend
if (-not (Test-Api)) {
    Write-Host "Backend ishga tushirilmoqda (:3000)..." -ForegroundColor Yellow
    $backendDir = "$Root\backend"
    if (-not (Test-Path "$backendDir\dist\src\main.js")) {
        Set-Location $backendDir
        & $Node node_modules/@nestjs/cli/bin/nest.js build
    }
    Start-Process -FilePath $Node -ArgumentList "dist/src/main.js" -WorkingDirectory $backendDir -WindowStyle Minimized
    for ($i = 0; $i -lt 20; $i++) {
        if (Test-Api) { break }
        Start-Sleep -Seconds 1
    }
}

if (Test-Api) {
    Write-Host "Backend: http://127.0.0.1:3000  [OK]" -ForegroundColor Green
} else {
    Write-Host "Backend ishga tushmadi! backend\dist\src\main.js ni tekshiring." -ForegroundColor Red
}

# Frontend
if (-not (Test-Port 5173)) {
    Write-Host "Frontend ishga tushirilmoqda (:5173)..." -ForegroundColor Yellow
    $desktopDir = "$Root\desktop"
    $viteArgs = "node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"
    # WEB_ONLY=1 — PowerShell 5.1 da Start-Process -Environment yo'q, cmd orqali
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set WEB_ONLY=1&& `"$Node`" $viteArgs" -WorkingDirectory $desktopDir -WindowStyle Minimized
    Start-Sleep -Seconds 4
}

if (Test-Port 5173) {
    Write-Host "Frontend: http://127.0.0.1:5173  [OK]" -ForegroundColor Green
} else {
    Write-Host "Frontend ishga tushmadi! desktop\run-dev.ps1 ni qo'lda ishga tushiring." -ForegroundColor Red
}

Write-Host ""
Write-Host ">>> BRUZERDA SHU MANZILNI OCHING (frontend):" -ForegroundColor Yellow
Write-Host "    http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "    (http://localhost:3000 - faqat API, sahifa emas!)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Login: admin@erp.uz / Admin123!" -ForegroundColor Cyan
