# usage: python3 prep_inputs.py idea.json
# Before the build: turns the idea's media (downloaded into media/ as <assetId>.<ext>) into media/m<i>.*,
# writes media/index.json, and if the idea has a voiceover, transcribes it to media/voice.json + media/voice.wav.
import json, sys, os, glob, base64, subprocess
idea = json.load(open(sys.argv[1])); items = idea.get("media") or []
os.makedirs("media", exist_ok=True); index = []
def ff(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)
for i, m in enumerate(items):
    hits = [f for f in glob.glob(f"media/{m.get('id')}.*")]
    if not hits: print("missing media", i, m.get("name")); index.append({"kind": m.get("kind"), "file": "", "image": ""}); continue
    src = hits[0]; kind = m.get("kind"); ext = os.path.splitext(src)[1].lower()
    if kind == "audio":
        out = f"media/m{i}.wav"
        if ext == ".txt":
            raw = base64.b64decode(open(src, "rb").read().split(b",")[-1].strip())
            tmp = f"media/m{i}.raw"; open(tmp, "wb").write(raw); ff("-i", tmp, "-ac", "1", "-ar", "24000", out); os.remove(tmp)
        else: ff("-i", src, "-vn", "-ac", "1", "-ar", "24000", out)
        index.append({"kind": "audio", "file": f"m{i}.wav", "image": ""})
    elif kind == "video":
        out = f"media/m{i}.mp4"; os.replace(src, out); poster = f"media/p{i}.jpg"
        try: ff("-ss", str(float((idea.get("storyboard") or {}).get("thumbnail", {}).get("start") or 0.5)), "-i", out, "-frames:v", "1", "-vf", "scale='min(1080,iw)':-2", poster)
        except Exception: ff("-i", out, "-frames:v", "1", poster)
        index.append({"kind": "video", "file": f"m{i}.mp4", "image": f"p{i}.jpg"})
    else:
        out = f"media/m{i}{ext if ext in ('.png', '.jpg', '.jpeg', '.webp', '.gif') else '.jpg'}"
        if ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"): os.replace(src, out)
        else: ff("-i", src, out)
        index.append({"kind": "image", "file": os.path.basename(out), "image": os.path.basename(out)})
json.dump(index, open("media/index.json", "w"))
v = idea.get("voiceover")
if isinstance(v, int) and 0 <= v < len(index) and index[v]["file"] and index[v]["kind"] in ("audio", "video"):
    f = "media/" + index[v]["file"]
    ff("-i", f, "-vn", "-ac", "1", "-ar", "24000", "media/voice.wav")
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "transcribe.py"), "media/voice.wav", "media/voice.json"], check=True)
print("media ready:", len(index), "items", "voiceover" if os.path.exists("media/voice.json") else "")
