# usage: python3 prep_media.py storyboard.json   (after build_audio.py; needs tl.json, media/index.json)
# Cuts the frames each video scene needs into media/s<scene>/f00001.jpg... and writes media/frames.json.
import json, sys, os, subprocess, glob, shutil
sb = json.load(open(sys.argv[1])); tl = json.load(open("tl.json"))["tl"]; index = json.load(open("media/index.json")); fr = {}
for k, s in enumerate(sb["scenes"]):
    if s.get("kind") != "media": continue
    d = s.get("data") or {}; mi = int(d.get("media") or 0)
    if mi >= len(index) or index[mi]["kind"] != "video" or not index[mi]["file"]: continue
    out = f"media/s{k}"; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(float(d.get("start") or 0)), "-i", "media/" + index[mi]["file"], "-t", str(tl[k]["d"] + 0.2),
                    "-vf", "fps=30,scale='min(1080,iw)':-2", "-q:v", "3", out + "/f%05d.jpg"], check=True)
    fr[k] = len(glob.glob(out + "/f*.jpg"))
json.dump(fr, open("media/frames.json", "w")); print("video scenes:", fr)
