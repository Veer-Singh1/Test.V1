@echo off
cd /d "%~dp0"
echo Installing packages (the first run downloads packages and a browser, this can take a few minutes)...
call npm install
if errorlevel 1 goto fail
echo Rendering the video (sound is already inside the composition)...
call npx remotion render src/index.jsx LightningHotter final.mp4 --concurrency=4 --crf=17
if errorlevel 1 goto fail
echo.
echo Done: final.mp4
pause
exit /b 0
:fail
echo.
echo Something went wrong. Copy the messages above and send them to Claude.
pause
exit /b 1
