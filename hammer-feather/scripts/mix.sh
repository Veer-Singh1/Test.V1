#!/usr/bin/env bash
# Soundtrack = voice (high-pass 80 Hz, normalised to -14 LUFS) + music bed 20 dB under it,
# then the whole mix to -14 LUFS integrated, true peak -1 dBTP. Output: public/soundtrack.wav
# usage: scripts/mix.sh <duration_s> [music_under_voice_db=20]
set -e
cd "$(dirname "$0")/.."
DUR=$1; UNDER=${2:-20}
meas() { ffmpeg -hide_banner -i "$1" -af "${2}loudnorm=I=-14:TP=-1:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p'; }
get() { python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ln2() { echo "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(echo "$1" | get input_i):measured_TP=$(echo "$1" | get input_tp):measured_LRA=$(echo "$1" | get input_lra):measured_thresh=$(echo "$1" | get input_thresh):offset=$(echo "$1" | get target_offset):linear=true"; }
J=$(meas assets/narration.mp3 "highpass=f=80,")
ffmpeg -v error -y -i assets/narration.mp3 -af "highpass=f=80,$(ln2 "$J"),aresample=48000" -ac 2 out/voice.wav
LV=$(meas out/voice.wav "" | get input_i); LM=$(meas assets/music.wav "" | get input_i)
G=$(python3 -c "print(round(($LV - $UNDER) - ($LM), 2))")
ffmpeg -v error -y -i out/voice.wav -i assets/music.wav -filter_complex "[0:a]apad[v];[1:a]aformat=channel_layouts=stereo,volume=${G}dB[m];[v][m]amix=inputs=2:duration=longest:normalize=0[mx]" -map "[mx]" -t "$DUR" out/premix.wav
J=$(meas out/premix.wav "")
ffmpeg -v error -y -i out/premix.wav -af "$(ln2 "$J"),aresample=48000" public/soundtrack.wav
echo "voice $LV LUFS, music $LM LUFS -> music gain $G dB (${UNDER} dB under the voice)"
ffmpeg -hide_banner -i public/soundtrack.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' '
