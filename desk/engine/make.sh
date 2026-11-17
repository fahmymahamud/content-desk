#!/bin/bash
# Build a reel from storyboard.json in the current folder (which holds video.html, scenes.js, render.js, build_audio.py, av/).
# Optional: idea.json + media/<assetId>.* (the idea's photos, clips, voice notes) -> used in media scenes / as the voiceover.
set -e
export npm_config_loglevel=error
[ -d node_modules/@fontsource/inter ] || npm i --no-save @fontsource/montserrat @fontsource/inter >/dev/null
python3 -c "import sherpa_onnx, soundfile" 2>/dev/null || pip install --break-system-packages -q sherpa-onnx soundfile
[ -f idea.json ] && python3 prep_inputs.py idea.json
if [ ! -f media/voice.json ] && [ ! -d models/kokoro-multi-lang-v1_0 ]; then mkdir -p models; curl -sSL -o models/k.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2; tar xjf models/k.tar.bz2 -C models; rm models/k.tar.bz2; fi
python3 build_audio.py storyboard.json
[ -f media/index.json ] && python3 prep_media.py storyboard.json
rm -rf out; node render.js storyboard.json
ffmpeg -v error -y -framerate 30 -i out/f%04d.jpg -i audio.wav -c:v libx264 -preset medium -crf 23 -maxrate 3M -bufsize 6M -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -movflags +faststart -shortest reel.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 reel.mp4
