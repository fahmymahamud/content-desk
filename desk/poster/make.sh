#!/bin/bash
# Build the reel in the current folder. Needs: p/ (pieces + meta.json from your cut.py), script.json, scenes.js, plus the kit files.
#   bash make.sh voice            -> narration + tl.json only (do this before writing scenes.js timings)
#   bash make.sh preview [times]  -> prev/sheet*.jpg to look at (no video)
#   bash make.sh                  -> reel.mp4 + thumbnail.jpg       bash make.sh scene price cta -> re-render only those scenes, then rebuild reel.mp4
set -e
export npm_config_loglevel=error
[ -d node_modules/@fontsource/montserrat ] || npm i --no-save @fontsource/montserrat @fontsource/inter >/dev/null
MODE=${1:-all}
if [ "$MODE" = voice ] || [ ! -f tl.json ] || [ script.json -nt tl.json ]; then python3 vo.py script.json; fi
[ "$MODE" = voice ] && exit 0
if [ "$MODE" = preview ]; then node render.js prev $2; exit 0; fi
if [ "$MODE" = scene ]; then shift; node render.js scene "$@"; else rm -rf seg; node render.js scene all; fi
python3 audio.py script.json
python3 - <<'PY'
import json; open('list.txt','w').write(''.join(f"file 'seg/{s['name']}.mp4'\n" for s in json.load(open('tl.json'))['scenes']))
PY
ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy video.tmp.mp4
ffmpeg -v error -y -i video.tmp.mp4 -i audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -movflags +faststart -shortest reel.mp4 && rm video.tmp.mp4
TH=$(python3 -c "import json;s=json.load(open('script.json'));t=json.load(open('tl.json'));print(s.get('thumbnail_at',t['total']-1.5))")
ffmpeg -v error -y -ss $TH -i reel.mp4 -frames:v 1 -q:v 2 thumbnail.jpg
ffmpeg -v error -y -i reel.mp4 -vf "fps=1/1.5,scale=216:384,tile=12x3" -frames:v 1 check.jpg
ffprobe -v error -show_entries format=duration,size -of default=nw=1 reel.mp4; echo "built reel.mp4, thumbnail.jpg, check.jpg (contact sheet to Read)"
