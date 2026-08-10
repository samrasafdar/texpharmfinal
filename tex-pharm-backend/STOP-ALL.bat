@echo off
echo ================================================
echo  Stopping any old MongoDB / server processes...
echo ================================================
taskkill /F /IM mongod.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo.
echo Done. All old processes stopped.
echo You can now safely run START-MONGO.bat, then START.bat.
pause
