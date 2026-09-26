# PowerShell restart script for Voice-to-Cloud Architecture Studio

$projectRoot = $PSScriptRoot
Set-Location -Path $projectRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Restarting Voice-to-Cloud Architecture Studio (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Stop any processes listening on ports 8000 and 5173
Write-Host "[1/3] Freeing ports 8000 and 5173 if currently in use..." -ForegroundColor Yellow
$ports = @(8000, 5173)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -and $procId -ne 0) {
                Write-Host "  Terminating process on port $port (PID: $procId)..." -ForegroundColor DarkGray
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Start-Sleep -Seconds 1

# 2. Launch FastAPI backend
Write-Host "[2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend" -WorkingDirectory $projectRoot

Start-Sleep -Seconds 2

# 3. Launch Vite frontend (waits for backend health check before opening)
Write-Host "[3/3] Launching Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "node scripts/wait-for-backend.mjs && npm run dev" -WorkingDirectory $projectRoot

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "  Application successfully started!" -ForegroundColor Cyan
Write-Host "  Frontend Studio:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
