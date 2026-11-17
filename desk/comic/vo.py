# usage: python3 vo.py script.json   -> vo/<i>.wav, tl.json (scene + line + word timings). Prints "unsayable:" words to fix.
# Free offline Kokoro voice (downloaded on first use). Narration timing drives the whole reel.
import json, sys, os, re, subprocess, numpy as np
try: import sherpa_onnx, soundfile as sf
except ImportError: subprocess.run([sys.executable,'-m','pip','install','--break-system-packages','-q','sherpa-onnx','soundfile'],check=True); import sherpa_onnx, soundfile as sf
sc=json.load(open(sys.argv[1])); M=os.environ.get('KOKORO','models/kokoro-multi-lang-v1_0')
if not os.path.isdir(M):
    os.makedirs('models',exist_ok=True); subprocess.run('curl -sSL -m 500 -o models/k.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2 && tar xjf models/k.tar.bz2 -C models && rm models/k.tar.bz2',shell=True,check=True)
lex=set(l.split(' ',1)[0] for l in open(M+'/lexicon-us-en.txt',encoding='utf8')); extra=sc.get('lexicon') or {}
open('extra-lexicon.txt','w',encoding='utf8').write(''.join(f'{k.lower()} {v}\n' for k,v in extra.items()))
oov=sorted(set(w for s in sc['scenes'] for l in s['lines'] for w in re.findall(r"[A-Za-z']+",l['say']) if w.lower() not in lex and w.lower() not in extra))
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=M+'/model.onnx',voices=M+'/voices.bin',tokens=M+'/tokens.txt',data_dir=M+'/espeak-ng-data',lexicon='extra-lexicon.txt,'+M+'/lexicon-us-en.txt',lang='en-us'),num_threads=2))
tts=sherpa_onnx.OfflineTts(cfg); SR=tts.sample_rate; os.makedirs('vo',exist_ok=True); sid=int(sc.get('voice',3)); speed=float(sc.get('speed',1.08)); gap=float(sc.get('gap',0.28))
spoken={k.lower():v for k,v in (sc.get('spoken') or {}).items()}   # caption word -> how it is said, e.g. "$60": "sixty dollars" (keeps captions in sync)
t=0.0; scenes=[]; lines=[]; i=0
for s in sc['scenes']:
    t0=t; t+=float(s.get('lead',0.45))
    for k,l in enumerate(s['lines']):
        if k: t+=gap
        a=tts.generate(l['say'],sid=sid,speed=speed); x=np.array(a.samples,dtype=np.float32); nz=np.where(np.abs(x)>0.01)[0]; x=x[max(0,nz[0]-400):nz[-1]+2400] if len(nz) else x
        sf.write(f'vo/{i}.wav',x,SR); d=len(x)/SR; cap=l.get('cap') or l['say']; ws=cap.split()
        wt=[len(spoken.get(w.strip('.,?!').lower(),w))+1+(2 if re.search(r'[.?!,]$',w) else 0) for w in ws]; tot=sum(wt); pos=0.04; words=[]
        for w,kk in zip(ws,wt): dd=kk/tot*max(d-0.15,0.3); words.append({'w':w,'s':round(t+pos,3),'e':round(t+pos+dd,3)}); pos+=dd
        lines.append({'scene':s['name'],'cap':cap,'s':round(t,3),'d':round(d,3),'words':words}); t+=d; i+=1
    t+=float(s.get('tail',0.5)); scenes.append({'name':s['name'],'t0':round(t0,3),'d':round(t-t0,3)})
json.dump({'sr':SR,'scenes':scenes,'lines':lines,'total':round(t,3)},open('tl.json','w'),indent=1)
print('total',round(t,2),'s;',' '.join(f"{s['name']}@{s['t0']}" for s in scenes)); print('unsayable:',oov or 'none')
