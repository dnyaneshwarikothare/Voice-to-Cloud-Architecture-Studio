@echo off
setlocal enabledelayedexpansion

:: 1. Resolve workspace root cleanly without trailing backslash
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
cd /d "%ROOT_DIR%"

echo ========================================================
echo   Restarting Voice-to-Cloud Architecture Studio
echo ========================================================

:: 2. Terminate existing processes listening on ports 8000 and 5173
echo [1/3] Freeing ports 8000 and 5173 if currently in use...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING"') do (
    if not "%%a"=="" if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do (
    if not "%%a"=="" if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: Pause 1 second for TCP sockets to release cleanly (compatible with redirected stdin)
ping -n 2 127.0.0.1 >nul 2>&1

:: 3. Launch FastAPI backend with reload restricted to backend directory
echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Voice-to-Cloud Backend" /d "%ROOT_DIR%" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend"

:: Allow backend 2 seconds to initialize before frontend starts
ping -n 3 127.0.0.1 >nul 2>&1

:: 4. Launch Vite frontend (waits for backend health check before opening)
echo [3/3] Launching Vite Frontend on http://localhost:5173 ...
start "Voice-to-Cloud Frontend" /d "%ROOT_DIR%" cmd /k "node scripts/wait-for-backend.mjs && npm run dev"

echo.
echo ========================================================
echo   Application successfully started!
echo   Frontend Studio:  http://localhost:5173
echo   Backend API Docs: http://127.0.0.1:8000/docs
echo ========================================================
