#!/usr/bin/env bash
# Full build: timeline -> soundtrack -> frames -> MP4 + contact sheet.
# Narration: audio/01.mp3 ... 18.mp3, one clip per line of src/script.json.
# Usage: ./build.sh [output-name]      (default: hottest-thing)
set -euo pipefail
cd "$(dirname "$0")"
NAME="${1:-hottest-thing}"
FRAMES="${FRAMES_DIR:-$(mktemp -d)}"
python3 src/prepare.py
node src/render.js --events > src/events.json
python3 src/mix_audio.py
node src/render.js "$FRAMES"
ffmpeg -y -v error -framerate 30 -i "$FRAMES/f%05d.png" -i out/mix.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -c:a aac -b:a 192k \
  -movflags +faststart -shortest "out/$NAME.mp4"
ffmpeg -y -v error -i "out/$NAME.mp4" -vf "fps=1,scale=270:-1,tile=9x6" -frames:v 1 -update 1 "out/$NAME-preview.png"
ffprobe -v error -show_entries format=duration -of csv=p=0 "out/$NAME.mp4"
