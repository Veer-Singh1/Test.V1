#!/usr/bin/env bash
# Mix voice + music bed: music 20 dB under the voice, voice EQ (high-pass 80 Hz, +2 dB at 4 kHz),
# then normalise to -14 LUFS integrated, true peak -1.5 dBTP. Output: public/soundtrack.wav
set -e
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i public/voiceover.wav -i public/music.wav -filter_complex \
 "[0:a]aresample=44100,highpass=f=80,equalizer=f=4000:t=q:w=1.2:g=2,apad[v];[1:a]volume=-20dB[m];[v][m]amix=inputs=2:duration=longest:normalize=0[mx]" \
 -map "[mx]" -t "$1" out/premix.wav
J=$(ffmpeg -hide_banner -i out/premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
gi() { echo "$J" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i out/premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gi input_i):measured_TP=$(gi input_tp):measured_LRA=$(gi input_lra):measured_thresh=$(gi input_thresh):offset=$(gi target_offset):linear=true,aresample=48000" public/soundtrack.wav
ffmpeg -hide_banner -i public/soundtrack.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
