# usage: python3 audio.py [script.json]   needs tl.json, vo/*.wav, events.json (written by render.js from the sfx() calls in scenes.js) -> audio.wav
import json, sys, os, numpy as np, soundfile as sf
tl=json.load(open('tl.json')); sc=json.load(open(sys.argv[1])) if len(sys.argv)>1 else {}; ev=json.load(open('events.json')) if os.path.exists('events.json') else []
SR=tl.get('sr',24000); total=tl['total']; N=int(total*SR)+SR; rng=np.random.default_rng(7)
vo=np.zeros(N,np.float32); fx=np.zeros(N,np.float32); mu=np.zeros(N,np.float32)
def put(buf,t,x,g=1.0):
    a=int(max(0,t)*SR); x=x[:max(0,len(buf)-a)]; buf[a:a+len(x)]+=x*g
for i,l in enumerate(tl['lines']):
    x,_=sf.read(f'vo/{i}.wav',dtype='float32'); put(vo,l['s'],x/max(0.05,np.abs(x).max())*0.92)
def env(n,a=0.005,d=8): t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t*d)
def whoosh(d=0.38):
    n=int(d*SR); x=rng.standard_normal(n).astype(np.float32); t=np.arange(n)/SR; y=np.zeros(n,np.float32); lp=0; hp=0
    for k in range(n):
        fc=500+3500*np.sin(np.pi*k/n)**2; al=1-np.exp(-2*np.pi*fc/SR); lp+=al*(x[k]-lp); hp+=0.02*(lp-hp); y[k]=lp-hp
    return y*np.sin(np.pi*t/d)**2*0.5
def pop(f=700): n=int(.09*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*(f*t+f*2.2*t*t))*env(n,0.003,38)
def thud(f=None): n=int(.3*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*(110*t-120*t*t))*env(n,0.002,13)+0.25*rng.standard_normal(n)*env(n,0.001,60)).astype(np.float32)
def ding(f=1318.5): n=int(1.0*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f*t)+0.5*np.sin(2*np.pi*f*1.5*t)+0.25*np.sin(2*np.pi*f*2.76*t))*env(n,0.002,4.5)
def ring(f=None):
    n=int(.55*SR); t=np.arange(n)/SR; g=(np.sin(2*np.pi*22*t)>0); return (np.sin(2*np.pi*1400*t)*g+np.sin(2*np.pi*1750*t)*(1-g))*np.minimum(1,t/.01)*np.minimum(1,(.55-t)/.05)*0.25
W=whoosh(); WL=whoosh(.6)
MAKE={'whoosh':lambda f:W,'whoosh_long':lambda f:WL,'pop':lambda f:pop(f or 700)*0.9,'thud':thud,'ding':lambda f:ding(f or 1318.5)*0.28,'ring':ring}
for e in ev:
    if e['fx'] in MAKE: put(fx,e['t'],MAKE[e['fx']](e.get('f')),float(e.get('g') or 1))
    else: print('unknown sfx',e['fx'])
if sc.get('music',True):
    bpm=float(sc.get('bpm',104)); beat=60/bpm; bar=beat*4; drums_from=float(tl['scenes'][1]['t0']) if len(tl['scenes'])>1 else 0
    def note(f,d,dec=6): n=int(d*SR); t=np.arange(n)/SR; return ((np.sin(2*np.pi*f*t)+0.35*np.sin(4*np.pi*f*t)+0.12*np.sin(6*np.pi*f*t))*env(n,0.004,dec)).astype(np.float32)
    def kick(): n=int(.22*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*(95*t-150*t*t))*env(n,0.002,16)).astype(np.float32)
    def hat(): n=int(.05*SR); x=np.diff(rng.standard_normal(n).astype(np.float32),prepend=0); return x*env(n,0.001,90)
    mid=lambda m:440*2**((m-69)/12); chords=[[60,64,67,72],[55,59,62,67],[57,60,64,69],[53,57,60,65]]; t=0.0; b=0
    while t<total+1:
        ch=chords[b%4]; put(mu,t,note(mid(ch[0]-24),bar*.9,2.2),.5); put(mu,t+beat*2,note(mid(ch[0]-24),beat*1.5,3),.35)
        for k,pi in enumerate([0,2,1,3,2,1,3,2]): put(mu,t+k*beat/2,note(mid(ch[pi]+12),.5,7),.16+(.05 if k%2==0 else 0))
        if t>=drums_from-0.3:
            for k in range(4): put(mu,t+k*beat,kick(),.55); put(mu,t+k*beat+beat/2,hat(),.05)
        put(mu,t,note(mid(ch[1]),bar,1.2),.10); put(mu,t,note(mid(ch[2]),bar,1.2),.10); t+=bar; b+=1
    k=int(.12*SR); mu*=1-0.45*np.clip(np.convolve(np.abs(vo),np.ones(k)/k,'same')/0.08,0,1)
T=np.arange(N)/SR; fade=np.minimum(1,T/.4)*np.clip((total-T)/1.2,0,1)
mix=(vo*0.95+fx*0.55+mu*0.20*fade)[:int(total*SR)]; pk=float(np.abs(mix).max())
if pk>0.97: mix=np.tanh(mix/pk*1.2)/np.tanh(1.2)*0.97
sf.write('audio.wav',mix,SR); print('audio',round(len(mix)/SR,2),'s, sound effects',len(ev))
