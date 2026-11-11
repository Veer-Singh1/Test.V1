#!/usr/bin/env bash
# Mix voice + music bed. MUSIC_DB = extra gain on the music file (song_bed.py already sets the
# song 18 dB under the voice, so 0 there; the generated bed uses -20).
# Voice EQ: high-pass 80 Hz, +2 dB at 4 kHz. Then -14 LUFS integrated, true peak -1.5 dBTP.
# usage: scripts/mix.sh <duration_s> <music.wav> <out.wav>
set -e
cd "$(dirname "$0")/.."
MUSIC_DB=${MUSIC_DB:-0}
ffmpeg -v error -y -i public/voiceover.wav -i "$2" -filter_complex \
 "[0:a]aresample=48000,highpass=f=80,equalizer=f=4000:t=q:w=1.2:g=2,aformat=channel_layouts=stereo,apad[v];[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MUSIC_DB}dB[m];[v][m]amix=inputs=2:duration=longest:normalize=0[mx]" \
 -map "[mx]" -t "$1" out/premix.wav
J=$(ffmpeg -hide_banner -i out/premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
gi() { echo "$J" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i out/premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gi input_i):measured_TP=$(gi input_tp):measured_LRA=$(gi input_lra):measured_thresh=$(gi input_thresh):offset=$(gi target_offset):linear=true,aresample=48000" "$3"
ffmpeg -hide_banner -i "$3" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
