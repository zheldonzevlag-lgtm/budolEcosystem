@echo off
REM Windows batch script to create admin account
REM 
REM This script runs the Node.js create-admin.js script
REM You can customize the admin details by setting environment variables:
REM   set ADMIN_EMAIL=admin@example.com
REM   set ADMIN_PASSWORD=yourpassword
REM   set ADMIN_NAME=Admin Name

echo ========================================
echo    BudolShap - Create Admin Account
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create .env file first. See SETUP_ENV.md for details.
    echo.
    pause
)

REM Run the script
echo Running admin creation script...
echo.

node scripts/create-admin.js

echo.
echo ========================================
pause

