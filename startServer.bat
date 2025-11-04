@echo off
:: Change to the directory where this batch file is located
cd /d "%~dp0"

:: Start Frontend server
start cmd /k "cd frontend && npm run dev"

:: Start Backend server
start cmd /k "cd backend && npm start"

echo Servers are starting...
