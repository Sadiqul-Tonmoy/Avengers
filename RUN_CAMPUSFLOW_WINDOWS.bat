@echo off
cd /d "%~dp0"
echo.
echo CampusFlow - Complete Student Planner
echo Project directory: %CD%
echo.
if not exist package.json (
  echo ERROR: package.json is missing. Extract the ZIP first and run this file from the project folder.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing Angular dependencies...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install failed. See the message above.
    pause
    exit /b 1
  )
)
echo.
echo Launching CampusFlow on http://localhost:4300
call npm start
if errorlevel 1 (
 echo.
 echo Angular did not start. If port 4300 is busy, use: npm run start:custom -- --port 4400
)
pause
