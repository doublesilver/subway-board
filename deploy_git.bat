@echo off
echo.
echo ==========================================
echo       Subway Board Git Deploy Script
echo ==========================================
echo.

:: Check for commit message argument
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" (
    set /p "COMMIT_MSG=Enter commit message (Press Enter for default): "
)
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=chore: update project configuration and code"
)

echo.
echo [1/3] Staging changes (git add)...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] git add failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Committing changes (git commit)...
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [INFO] Nothing to commit or error occurred.
)

echo.
echo [3/3] Pushing to GitHub (git push)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed! Check if branch name is 'main'.
    echo (If you use 'master', please edit this script.)
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo           Deploy Success! 
echo ==========================================
echo.
echo Railway and Vercel should start deploying now.
echo.
pause