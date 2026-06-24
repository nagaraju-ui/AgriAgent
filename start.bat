@echo off
setlocal
REM ---- AgriAgent one-click launcher ----
REM Forces the real Node 24 (avoids the old Brackets Node on PATH)
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo ============================================
echo   AgriAgent  -  building UI and starting...
echo ============================================

pushd frontend
if not exist node_modules (
  echo Installing frontend packages ^(first run only^)...
  call npm install
)
echo Building the mobile UI...
call npm run build
popd

echo.
echo Starting server at http://localhost:8000
echo Keep this window OPEN. Press Ctrl+C to stop.
echo.
start "" http://localhost:8000
uvicorn app.main:app --host 0.0.0.0 --port 8000

endlocal
