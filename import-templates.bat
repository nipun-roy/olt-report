@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================================
echo   OneSky SMS Assistant - Bulk Template Importer
echo ========================================================
echo.
echo Importing templates from bulk-templates.json to database...
echo.

node bulk-import.js bulk-templates.json

echo.
echo ========================================================
echo   Done! Press any key to exit.
echo ========================================================
pause
