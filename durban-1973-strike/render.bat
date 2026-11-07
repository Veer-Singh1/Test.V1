@echo off
cd /d "%~dp0"
echo Installing packages (the first run downloads packages and a browser, this can take a few minutes)...
call npm install
if errorlevel 1 goto fail
if not exist out mkdir out
echo Rendering the video with your graphics card...
call npx remotion render src/index.jsx Durban1973 out\full_silent.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17
if errorlevel 1 goto fail
if exist voiceover.wav (
  call npx remotion ffmpeg -y -i out\full_silent.mp4 -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4
) else (
  echo No voiceover.wav found in this folder, so final.mp4 is silent. Add voiceover.wav and run this again.
  copy /y out\full_silent.mp4 final.mp4
)
echo.
echo Done: final.mp4
pause
exit /b 0
:fail
echo.
echo Something went wrong. Copy the messages above and send them to Claude.
pause
exit /b 1
