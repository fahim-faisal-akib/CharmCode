@echo off
setlocal EnableDelayedExpansion

title OpenCode
echo.
echo  OpenCode - AI Coding Agent
echo  ===========================
echo.

:: Save the root directory as absolute path
set "ROOT=%~dp0"
:: Remove trailing backslash
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo  Root folder: %ROOT%
echo.

:: Check Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed.
    echo  Download it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f %%i in ('node -v') do echo  Node.js %%i found

:: Install backend deps
if not exist "%ROOT%\backend\node_modules" (
    echo.
    echo  Installing backend packages ^(first time only^)...
    cd /d "%ROOT%\backend"
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: npm install failed for backend.
        pause
        exit /b 1
    )
)

:: Install frontend deps
if not exist "%ROOT%\frontend\node_modules" (
    echo.
    echo  Installing frontend packages ^(first time only, may take a few minutes^)...
    cd /d "%ROOT%\frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: npm install failed for frontend.
        pause
        exit /b 1
    )
)

:: Launch backend in its own persistent window
echo.
echo  Starting backend server on http://localhost:3001 ...
start "OpenCode Backend" cmd /k "cd /d "%ROOT%\backend" && node server.js"

:: Wait for backend to be ready
timeout /t 4 /nobreak >nul

:: Launch frontend
echo  Starting frontend on http://localhost:3000 ...
echo.
echo  -----------------------------------------------
echo  Browser will open automatically at localhost:3000
echo  Go to Settings first to add your OpenRouter key.
echo  -----------------------------------------------
echo.
echo  Keep this window open. Close it to stop.
echo.

cd /d "%ROOT%\frontend"
call npm start

pause
endlocal
