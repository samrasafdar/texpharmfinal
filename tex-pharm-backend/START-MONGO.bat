
@echo off
echo ================================================
echo  Starting MongoDB (Tex-Pharm Database)
echo ================================================
if not exist "C:\data\db" mkdir "C:\data\db"
echo.
echo MongoDB is starting - KEEP THIS WINDOW OPEN.
echo When you see "Waiting for connections", it's ready.
echo.
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"
pause