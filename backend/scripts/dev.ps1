# Start the portable PostgreSQL (if down) and run the API in the foreground.
# Run from anywhere:  .\backend\scripts\dev.ps1
$ErrorActionPreference = 'Stop'
$pg  = "$env:LOCALAPPDATA\Temp\opencode\pg"
$bin = "$pg\pgsql\bin"

$up = (Test-NetConnection 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $up) {
    Write-Host 'Starting PostgreSQL...' -ForegroundColor Cyan
    & "$bin\pg_ctl.exe" -D "$pg\data" -o "-p 5432 -c listen_addresses=127.0.0.1" -l "$pg\pg.log" -w -t 30 start
} else {
    Write-Host 'PostgreSQL already running.' -ForegroundColor DarkGray
}

Set-Location (Join-Path $PSScriptRoot '..')
Write-Host 'API: http://127.0.0.1:8000  (docs: /docs)  - press Ctrl+C to stop' -ForegroundColor Green
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
