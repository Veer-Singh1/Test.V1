@echo off
cd /d "%~dp0"
echo 30-frame test render...
call npm install
if errorlevel 1 goto fail
if not exist out mkdir out
call npx remotion render src/index.jsx NotOurTools out\test_30_frames.mp4 --gl=angle --frames=0-29
if errorlevel 1 goto fail
echo.
echo Done: out\test_30_frames.mp4
pause
exit /b 0
:fail
echo.
echo Something went wrong. Copy the messages above and send them to Claude.
pause
exit /b 1
