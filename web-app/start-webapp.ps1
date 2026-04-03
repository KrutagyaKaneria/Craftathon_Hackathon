# PowerShell script to start Web App Frontend and AI Service

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Starting DriveGuard Web App (Frontend + AI Service)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 This script will start:" -ForegroundColor Yellow
Write-Host "   1. Frontend (React Vite) on http://localhost:5173" -ForegroundColor White
Write-Host "   2. AI Service (FastAPI) on http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Prerequisites:" -ForegroundColor Yellow
Write-Host "   - MongoDB running locally" -ForegroundColor White
Write-Host "   - Backend running on port 5000 (optional)" -ForegroundColor White
Write-Host ""

# Check if running in web-app directory
if (-not (Test-Path "frontend") -or -not (Test-Path "ai-service")) {
    Write-Host "❌ Error: Must run from web-app directory" -ForegroundColor Red
    Write-Host "   Run from: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Start Frontend
Write-Host "📱 Starting Frontend..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd frontend && npm run dev" -NoNewWindow:$false

# Wait a bit before starting AI service
Start-Sleep -Seconds 3

# Start AI Service
Write-Host "🤖 Starting AI Service..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd ai-service && python app/main.py" -NoNewWindow:$false

Write-Host ""
Write-Host "✅ Services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   AI Service: http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📊 Check separate terminal windows for service logs" -ForegroundColor Yellow
Write-Host ""
