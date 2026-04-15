@echo off
title Mess Management System Runner

echo ========================================
echo Starting Mess Management System...
echo ========================================

:: ---- START BACKEND (FORCE .venv) ----
start "Backend" cmd /k "cd /d %~dp0backend && call .venv\Scripts\activate && python app.py"

:: Wait for backend
timeout /t 8 /nobreak >nul

:: ---- START FRONTEND ----
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait
timeout /t 3 /nobreak >nul

:: ---- OPEN BROWSER ----
start http://localhost:5173

echo ========================================
echo Project Started Successfully!
echo ========================================
pause