#!/usr/bin/env bash
# Full build: narration clips -> timeline -> soundtrack -> frames -> MP4 + contact sheet.
# Usage: ./build.sh            original cut  -> out/speed-of-light.mp4
#        ./build.sh v2         shorter, varied cut -> out/speed-of-light-v2.mp4
# Add --no-split if audio/01.mp3..18.mp3 are your own clips.
set -euo pipefail
cd "$(dirname "$0")"
FRAMES="${FRAMES_DIR:-$(mktemp -d)}"
SUF=""; [[ " $* " == *" v2 "* ]] && SUF="-v2"

python3 src/prepare.py "$@"                       # 1. clips + timeline table
node src/render.js --events > src/events.json     # 2. animation events for the mixer
python3 src/mix_audio.py                          # 3. out/mix.wav
node src/render.js "$FRAMES"                      # 4. frames (virtual clock, no real-time)
ffmpeg -y -v error -framerate 30 -i "$FRAMES/f%05d.png" -i out/mix.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -c:a aac -b:a 192k \
  -movflags +faststart -shortest out/speed-of-light$SUF.mp4
ffmpeg -y -v error -i out/speed-of-light$SUF.mp4 -vf "fps=1,scale=270:-1,tile=9x6" \
  -frames:v 1 -update 1 out/preview$SUF.png           # 5. contact sheet at 1 fps
ffprobe -v error -show_entries format=duration -of csv=p=0 out/speed-of-light$SUF.mp4
