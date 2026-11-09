@echo off
set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

echo ===================================================
echo   Pushing OneSky OLT Project to GitHub...
echo ===================================================
echo.

git push -u origin main

echo.
echo ===================================================
echo   Done!
echo ===================================================
pause
