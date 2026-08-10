@echo off
title Tex-Pharm - Backend (Cloud Database)

echo ================================================
echo  Tex-Pharm Backend - Starting (Cloud Database)
echo ================================================
echo.

echo Cleaning up any old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Creating/checking admin account (using cloud database)...
call node seedAdmin.js

echo.
echo Starting the backend server on http://localhost:5000 ...
echo (Leave THIS window open while you use the admin panel or website)
echo.
call node server.js

pause