@echo off
REM Start Web App Frontend and AI Service

echo ═══════════════════════════════════════════════════════════════
echo 🚀 Starting DriveGuard Web App (Frontend + AI Service)
echo ═══════════════════════════════════════════════════════════════
echo.
echo 📋 This script will start:
echo    1. Frontend (React Vite) on http://localhost:5173
echo    2. AI Service (FastAPI) on http://localhost:8000
echo.
echo ⚠️  Make sure MongoDB is running!
echo.
pause

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM Start Frontend in new window
echo Starting Frontend...
start "DriveGuard Frontend" cmd /k "cd frontend && npm run dev"

REM Wait a moment
timeout /t 3 /nobreak

REM Start AI Service in new window
echo Starting AI Service...
start "DriveGuard AI Service" cmd /k "cd ai-service && python app/main.py"

echo.
echo ✅ Both services starting...
echo.
echo Frontend: http://localhost:5173
echo AI Service API: http://localhost:8000
echo AI Service Docs: http://localhost:8000/docs
echo.
echo Check the tutorial at: ..\README_WEBAPP.md
echo.
pause
