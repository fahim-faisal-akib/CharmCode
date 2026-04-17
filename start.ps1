# OpenCode Startup Script
# Right-click this file -> "Run with PowerShell"
# Or: powershell -ExecutionPolicy Bypass -File start.ps1

Write-Host ""
Write-Host "  OpenCode - AI Coding Agent" -ForegroundColor Cyan
Write-Host "  ===========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v 2>&1
    Write-Host "  Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install backend deps
if (-not (Test-Path "backend\node_modules")) {
    Write-Host ""
    Write-Host "  Installing backend packages..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
}

# Install frontend deps
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host ""
    Write-Host "  Installing frontend packages..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "  Starting backend on http://localhost:3001 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "  Starting frontend on http://localhost:3000 ..." -ForegroundColor Green
Write-Host ""
Write-Host "  Go to Settings in the dashboard to add your OpenRouter API key." -ForegroundColor Cyan
Write-Host ""

Push-Location frontend
npm start
Pop-Location
