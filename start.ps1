# AthleteSafe — Start both servers
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AthleteSafe — Starting Servers" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Start Backend
Write-Host "Starting FastAPI backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting React frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\athletesafe'; npm run dev"

Start-Sleep -Seconds 5

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor Green
Write-Host "  API Docs  : http://localhost:8000/docs" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Start-Process "http://localhost:3000"
