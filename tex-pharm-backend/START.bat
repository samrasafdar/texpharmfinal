@echo off
echo ================================================
echo  Tex-Pharm Backend - Starting...
echo ================================================
echo.
echo Creating/checking admin account...
call node seedAdmin.js
echo.
echo Starting server on http://localhost:5000 ...
call node server.js
pause