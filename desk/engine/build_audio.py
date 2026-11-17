# usage: python3 build_audio.py storyboard.json  -> audio.wav, tl.json, oov.txt (words the voice could not say)
# Narration: free Kokoro voice, or the creator's own recording when media/voice.json + media/voice.wav exist (prep_inputs.py).
# Media scenes with data.sound "original" play the clip's own sound (data.seconds long).
import json, sys, os, re, subprocess, numpy as np, soundfile as sf
sb=json.load(open(sys.argv[1])); M=os.environ.get("KOKORO","models/kokoro-multi-lang-v1_0"); SR=24000
INDEX=json.load(open("media/index.json")) if os.path.exists("media/index.json") else []
VOICE=os.path.exists("media/voice.json") and os.path.exists("media/voice.wav")
def load(p):
    d={}
    for l in open(p,encoding="utf8"):
        k,_,v=l.rstrip("\n").partition(" ")
        if k and k not in d: d[k]=v
    return d
def readwav(path,start=0.0,dur=None):
    tmp="media/_cut.wav"; a=["ffmpeg","-v","error","-y","-ss",str(start),"-i",path]+(["-t",str(dur)] if dur else [])+["-vn","-ac","1","-ar",str(SR),tmp]
    try: subprocess.run(a,check=True); x,_=sf.read(tmp,dtype="float32"); os.remove(tmp); return x
    except Exception: return np.zeros(0,dtype=np.float32)
def norm(x,peak=0.9):
    m=float(np.max(np.abs(x))) if len(x) else 0; return x*(peak/m) if m>0.05 else x
def orig(s):
    d=s.get("data") or {}; mi=int(d.get("media") or 0)
    if s.get("kind")!="media" or d.get("sound")!="original" or mi>=len(INDEX) or INDEX[mi]["kind"]!="video" or not INDEX[mi]["file"]: return None
    secs=max(1.0,min(12.0,float(d.get("seconds") or 5))); return readwav("media/"+INDEX[mi]["file"],float(d.get("start") or 0),secs),secs
def tone(f,d,k): tt=np.arange(int(d*SR))/SR; return np.sin(2*np.pi*f*tt)*np.exp(-tt*k)
tl=[]; clips=[]; oov=[]
if VOICE:
    W=json.load(open("media/voice.json"))["words"]; v=norm(readwav("media/voice.wav"))
    shown=[(s.get("narration") or "").strip().split() for s in sb["scenes"]]; N=sum(len(x) for x in shown) or 1; nW=len(W)
    if not nW: sys.exit("voiceover has no speech")
    a0=max(0.0,W[0]["s"]-0.15); cum=0; starts=[]
    for x in shown: starts.append(min(nW-1,round(cum*nW/N))); cum+=len(x)
    for k,x in enumerate(shown):
        t0=0.0 if k==0 else W[starts[k]]["s"]-a0-0.05
        t1=(W[starts[k+1]]["s"]-a0-0.05) if k+1<len(shown) else W[-1]["e"]-a0+0.9
        idx=starts[k]; m=(starts[k+1] if k+1<len(shown) else nW)-idx
        words=[{"w":w.strip(".,?!\"';:"),"s":round(max(0.0,W[min(nW-1,idx+int(j*max(m,1)/max(len(x),1)))]["s"]-a0-t0),3)} for j,w in enumerate(x)]
        tl.append({"t0":round(t0,3),"d":round(max(0.4,t1-t0),3),"words":words})
    for k in range(1,len(tl)): tl[k]["t0"]=round(tl[k-1]["t0"]+tl[k-1]["d"],3)
    t=tl[-1]["t0"]+tl[-1]["d"]; clips.append((0.0,v[int(a0*SR):]*0.95))
else:
    import sherpa_onnx
    US=load(M+"/lexicon-us-en.txt"); GB=load(M+"/lexicon-gb-en.txt")
    VOICELESS=set("ptkfθ")
    def guess(w):
        lw=w.lower()
        if lw in US: return None
        if lw in GB: return GB[lw]
        for suf,add in (("ies",None),("es",None),("s",None),("ed",None),("ing"," ɪ ŋ")):
            if lw.endswith(suf):
                base=lw[:-len(suf)]
                cands=[base+"y"] if suf=="ies" else [base,base+"e"]
                for c in cands:
                    if c in US:
                        ph=US[c]; last=ph.split()[-1] if ph.split() else ""
                        if suf in ("s","es","ies"): return ph+(" ɪ z" if suf=="es" and last in ("s","z","ʃ","ʧ","ʤ") else (" s" if last in VOICELESS else " z"))
                        if suf=="ed": return ph+(" ɪ d" if last in ("t","d") else (" t" if last in VOICELESS else " d"))
                        return ph+add
        return False
    extra={}
    def speakable(line):
        line=re.sub(r"(\d),(\d)",r"\1\2",line)
        def acr(m):
            w=m.group(0); return w if w.lower() in US else " ".join(w)
        line=re.sub(r"\b[A-Z]{2,5}\b",acr,line)
        for w in re.findall(r"[A-Za-z']+",line):
            if "'" in w: continue
            g=guess(w)
            if g: extra[w.lower()]=g
            elif g is False and not w.isdigit(): oov.append(w)
        return line
    lines=[speakable((s.get("narration") or "").strip()) for s in sb["scenes"]]
    with open("extra-lexicon.txt","w",encoding="utf8") as f:
        for k,v in extra.items(): f.write(f"{k} {v}\n")
    cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=M+"/model.onnx",voices=M+"/voices.bin",tokens=M+"/tokens.txt",data_dir=M+"/espeak-ng-data",lexicon="extra-lexicon.txt,"+M+"/lexicon-us-en.txt",lang="en-us"),num_threads=2))
    tts=sherpa_onnx.OfflineTts(cfg); SR=tts.sample_rate; t=0
    SID=int(sb.get("voice",16))   # narrator chosen on the desk; 16 = am_michael
    for i,s in enumerate(sb["scenes"]):
        line=lines[i]; shown=(s.get("narration") or "").strip(); o=orig(s); sd=1.3; words=[]
        if o is not None:
            ox,secs=o; clips.append((t,norm(ox,0.8)*(0.3 if line else 1.0))); sd=secs
        if line:
            a=tts.generate(line,sid=SID,speed=1.12); x=np.array(a.samples,dtype=np.float32)
            nz=np.where(np.abs(x)>0.01)[0]; x=x[max(0,nz[0]-400):nz[-1]+1600] if len(nz) else x
            d=len(x)/SR; clips.append((t+0.08,x))
            ws=re.sub(r"[,;:]","",shown).split(); tot=sum(len(w)+1 for w in ws); pos=0.08
            for w in ws: words.append({"w":w.strip(".?!\"'"),"s":round(pos,3)}); pos+=(len(w)+1)/tot*max(d-0.12,0.3)
            sd=max(sd,d+0.30,1.45)
        if i==len(sb["scenes"])-1: sd+=0.9
        tl.append({"t0":round(t,3),"d":round(sd,3),"words":words}); t+=sd
open("oov.txt","w").write("\n".join(sorted(set(oov))))
mix=np.zeros(int(t*SR)+SR,dtype=np.float32)
for st,x in clips: a=int(st*SR); x=x[:max(0,len(mix)-a)]; mix[a:a+len(x)]+=x*0.95
for s in tl[1:]: p=0.05*tone(220,0.08,45); a=int(s["t0"]*SR); mix[a:a+len(p)]+=p
sf.write("audio.wav",np.clip(mix[:int(t*SR)],-1,1),SR)
json.dump({"tl":tl,"total":t},open("tl.json","w")); print("total",round(t,2),"scenes",len(tl),"voice:","own recording" if VOICE else "Kokoro","unsayable:",sorted(set(oov)) or "none")
