@echo off
cd /d "%~dp0"
call npm install
if errorlevel 1 goto fail
if not exist out mkdir out
echo Rendering the first 6 seconds at half size as a quick test...
call npx remotion render src/index.jsx HeadOlderThanFeet out\test.mp4 --frames=0-179 --scale=0.5
if errorlevel 1 goto fail
echo Done: out\test.mp4
pause
exit /b 0
:fail
echo Something went wrong. Copy the messages above and send them to Claude.
pause
exit /b 1
