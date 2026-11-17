# usage: python3 look.py <file> [<file>...]   (for the find/media jobs)
# Audio/voice (.txt = base64 WAV from the desk, or any audio): prints the transcript.
# Video: prints transcript + seconds and writes <file>.sheet.jpg (a frame every ~2s) to look at with Read.
import sys, os, json, base64, subprocess
here = os.path.dirname(os.path.abspath(__file__))
for f in sys.argv[1:]:
    ext = os.path.splitext(f)[1].lower(); src = f
    if ext == ".txt":
        src = f + ".wav"; raw = base64.b64decode(open(f, "rb").read().split(b",")[-1].strip()); open(src, "wb").write(raw)
    if ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"): print(f"== {f}: image, open it with Read"); continue
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()
    has_v = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=index", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()
    print(f"== {f}: {'video' if has_v and ext != '.txt' else 'audio'}, {float(dur or 0):.1f} s")
    if has_v and ext != ".txt":
        n = max(1, min(12, int(float(dur or 2) / 2)))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"fps={n}/{max(float(dur or 1),1)},scale=240:-2,tile=4x3", "-frames:v", "1", f + ".sheet.jpg"])
        print("   contact sheet:", f + ".sheet.jpg")
    out = f + ".transcript.json"
    r = subprocess.run([sys.executable, os.path.join(here, "transcribe.py"), src, out], capture_output=True, text=True)
    print("  ", r.stdout.strip() or ("no speech found " + r.stderr[-300:]))
