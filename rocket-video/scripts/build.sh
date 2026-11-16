#!/usr/bin/env bash
# Full, repeatable build. Usage: bash scripts/build.sh [all|assets|audio|video|mux|review|twos]
set -euo pipefail
cd "$(dirname "$0")/.."
PY=.venv/bin/python
STEP=${1:-all}

assets() { $PY scripts/generate_assets.py; $PY scripts/process_assets.py; }
audio()  { node scripts/export_timeline.mts; $PY scripts/make_audio.py; }
video()  { npx remotion render src/index.ts RocketOrbit out/video_noaudio.mp4 \
             --codec=h264 --crf=16 --pixel-format=yuv420p --concurrency=4; }
mux()    { ffmpeg -y -v error -i out/video_noaudio.mp4 -i out/final_mix.wav -map 0:v -map 1:a \
             -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -profile:v high -r 24 \
             -c:a aac -b:a 256k -cutoff 17000 -ar 48000 -shortest -movflags +faststart out/rocket_orbit_60s.mp4
           ffprobe -v error -show_entries format=duration:stream=codec_name,pix_fmt,width,height,r_frame_rate \
             -of compact out/rocket_orbit_60s.mp4; }
review() { mkdir -p out/review
           for t in 0.5 8 18 28 40 50 58; do
             ffmpeg -v error -y -ss "$t" -i out/rocket_orbit_60s.mp4 -frames:v 1 "out/review/t_${t}s.png"; done
           $PY scripts/contact_sheet.py out/rocket_orbit_60s.mp4 out/contact_sheet.png 4.5 21 28.5 46 59; }
twos()   { for r in 24-55 660-699 976-1007; do
             rm -rf build/frames; npx remotion render src/index.ts RocketOrbit build/frames \
               --sequence --image-format=png --frames="$r" --concurrency=4 > /dev/null
             echo "frames $r:"; $PY scripts/check_twos.py build/frames || FAIL=1; done; return ${FAIL:-0}; }

case "$STEP" in
  all) assets; audio; video; mux; review; twos ;;
  *) "$STEP" ;;
esac
