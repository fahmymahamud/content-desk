# Cut a poster into animated pieces. Coordinates are always ORIGINAL poster pixels (x0,y0,x1,y1); the library works on poster_hi.png.
#   python3 cutlib.py grid          -> grid1.png, grid2.png ... (the poster with a labelled 50px grid; Read them to find coordinates)
# In your own cut.py:  from cutlib import Cutter; c=Cutter(); ...; c.finish()   -> p/<name>.png, p/meta.json, sheet.png (Read sheet.png to check)
import numpy as np, json, os, sys
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
class Cutter:
    def __init__(s,path='poster_hi.png',S=None,out='p'):
        s.S=S or json.load(open('scale.json'))['S']; s.out=out; os.makedirs(out,exist_ok=True)
        s.A=np.asarray(Image.open(path).convert('RGB')).astype(np.float32); s.R,s.G,s.B=s.A[...,0],s.A[...,1],s.A[...,2]
        s.lum=s.A@np.array([.299,.587,.114],dtype=np.float32); s.meta={}; s.yy,s.xx=np.mgrid[0:s.A.shape[0],0:s.A.shape[1]]
    def px(s,box): return [int(round(v*s.S)) for v in box]
    def region(s,box):
        z=np.zeros(s.lum.shape,bool); x0,y0,x1,y1=s.px(box); z[max(0,y0):y1,max(0,x0):x1]=True; return z
    def feather(s,m,r=1.2): return ndi.gaussian_filter(m.astype(np.float32),r*s.S/4)
    def grow(s,m,px=1.5): return ndi.binary_dilation(m>0.3,iterations=max(1,int(px*s.S)))
    def at(s,x,y): return s.A[int(y*s.S),int(x*s.S)]
    def save(s,name,box,mask=None,color=None,unwhite=False,floor=0.22):
        """Save one piece. mask: full-size 0..1 array (None = plain rectangle). color: paint the piece one flat colour (crisp text).
        unwhite: for art sitting on a WHITE card - turns the white into transparency so the piece works on any white surface."""
        x0,y0,x1,y1=s.px(box); rgb=s.A[y0:y1,x0:x1].copy()
        if unwhite:
            al=np.clip((255-rgb.min(axis=2))/255*1.6,0,1); al[al<floor]=0; rgb=255-(255-rgb)/np.maximum(al,0.06)[...,None]; m=al
        elif mask is None: m=np.ones(rgb.shape[:2],dtype=np.float32)
        else: m=mask[y0:y1,x0:x1].astype(np.float32)
        if color is not None: rgb[:]=np.array(color,dtype=np.float32)
        ys,xs=np.where(m>0.02)
        if len(ys): a,b,c,d=ys.min(),ys.max()+1,xs.min(),xs.max()+1; rgb=rgb[a:b,c:d]; m=m[a:b,c:d]; x0+=c; y0+=a
        out=np.dstack([rgb,m*255]).clip(0,255).astype(np.uint8); Image.fromarray(out,'RGBA').save(f'{s.out}/{name}.png')
        s.meta[name]={'x':x0/s.S,'y':y0/s.S,'w':out.shape[1]/s.S,'h':out.shape[0]/s.S}; return s.meta[name]
    def dark(s,lum_max=120,b_max=190): return (s.lum<lum_max)&(s.B<b_max)
    def darkfill(s,box,seeds=None,grow=3,exclude=None,dark=None,keep=0.05):
        """Outlined art on a lighter background (logos, mascots, outlined titles, dark pills): take the dark outline and fill its holes.
        seeds: [(x,y)] points on the wanted shape (keeps only those blobs). exclude: mask of neighbours to keep out."""
        m=(s.dark() if dark is None else dark)&s.region(box)
        if exclude is not None: m&=~exclude
        k=max(1,s.S//2); m=ndi.binary_fill_holes(ndi.binary_closing(m,iterations=k)); lab,n=ndi.label(m)
        if n==0: return m.astype(np.float32)
        if seeds: m=np.isin(lab,list(set(int(lab[int(y*s.S),int(x*s.S)]) for x,y in seeds)-{0}))
        else: sizes=ndi.sum(m,lab,range(1,n+1)); m=np.isin(lab,[i+1 for i,z in enumerate(sizes) if z>keep*sizes.max()])
        return s.feather(ndi.binary_dilation(m,iterations=max(1,grow*s.S//4)))
    def darkalpha(s,box,hi=175,span=80,r_max=120):
        """Plain dark text on a light background: alpha from darkness. Save with color=(r,g,b) of the text for crisp edges."""
        return np.clip((hi-s.lum)/span,0,1)*s.region(box)*(s.R<r_max)
    def blob(s,box,is_bg,seed,close=4):
        """A photo or shape sitting on a flat-ish background: everything in box that is NOT background and connected to seed (x,y)."""
        m=(~is_bg)&s.region(box); m=ndi.binary_opening(m,iterations=max(1,s.S//2)); lab,_=ndi.label(m); m=lab==lab[int(seed[1]*s.S),int(seed[0]*s.S)]
        return ndi.binary_fill_holes(ndi.binary_closing(m,iterations=close*s.S//4 or 1))
    def circle(s,cx,cy,r): return np.clip((r*s.S-np.hypot(s.xx-cx*s.S,s.yy-cy*s.S))/3+.5,0,1)
    def component(s,mask,box):
        """Largest blob of a boolean mask inside box -> (cx,cy,radius) in original px. Handy for round badges."""
        m=mask&s.region(box); lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); ys,xs=np.where(lab==int(np.argmax(sizes))+1)
        return xs.mean()/s.S,ys.mean()/s.S,max(xs.max()-xs.min(),ys.max()-ys.min())/2/s.S
    def whitealpha(s,name,box,bgbox):
        """Bubbles, sparkles, highlights that are LIGHTER than the background: saved as pure white with soft alpha (reusable decoration)."""
        x0,y0,x1,y1=s.px(bgbox); bg=np.median(s.lum[y0:y1,x0:x1]); x0,y0,x1,y1=s.px(box); r=min(x1-x0,y1-y0)/2
        al=np.clip((s.lum-bg-6)/(250-bg),0,1)*np.clip((r-np.hypot(s.xx-(x0+x1)/2,s.yy-(y0+y1)/2))/(2*s.S),0,1)
        return s.save(name,box,al,color=(255,255,255))
    def poster(s,box=None,width=1935):
        """The whole poster (optionally cropped) as p/poster.jpg for the final reveal."""
        im=Image.fromarray(s.A.astype(np.uint8));
        if box: im=im.crop(tuple(s.px(box)))
        im=im.resize((width,round(im.height*width/im.width)),Image.LANCZOS); im.save(f'{s.out}/poster.jpg',quality=93)
        b=box or (0,0,s.A.shape[1]/s.S,s.A.shape[0]/s.S); s.meta['poster']={'x':b[0],'y':b[1],'w':b[2]-b[0],'h':b[3]-b[1]}
    def finish(s):
        json.dump({k:{a:float(b) for a,b in v.items()} for k,v in s.meta.items()},open(f'{s.out}/meta.json','w'),indent=0)
        names=[k for k in s.meta if k!='poster']; ims=[Image.open(f'{s.out}/{k}.png') for k in names]; W=max(2400,max(i.width for i in ims)+20); x=y=rh=0; pos=[]
        for i in ims:
            if x+i.width>W: x=0; y+=rh+50; rh=0
            pos.append((x,y)); x+=i.width+20; rh=max(rh,i.height)
        sh=Image.new('RGB',(W,y+rh+40),(255,0,255)); d=ImageDraw.Draw(sh)
        for k,i,p in zip(names,ims,pos): sh.paste(i,p,i); d.text((p[0]+4,p[1]+i.height+4),k,fill=(255,255,255))
        sh.thumbnail((1800,4000)); sh.save('sheet.png'); print('pieces:',', '.join(names))
def grid(path='poster.png'):
    im=Image.open(path).convert('RGB'); k=2 if im.width<=1000 else 1; g=im.resize((im.width*k,im.height*k),Image.LANCZOS); d=ImageDraw.Draw(g)
    for x in range(0,im.width,50): d.line((x*k,0,x*k,g.height),fill=(255,0,0) if x%100==0 else (255,160,160)); d.text((x*k+2,2),str(x),fill=(255,0,0))
    for y in range(0,im.height,50):
        d.line((0,y*k,g.width,y*k),fill=(255,0,0) if y%100==0 else (255,160,160))
        for x in range(0,g.width,600): d.text((x+2,y*k+2),str(y),fill=(255,0,0))
    n=0
    for y in range(0,g.height,750): n+=1; g.crop((0,y,g.width,min(g.height,y+850))).save(f'grid{n}.png')
    print('wrote',n,'grid images; labels are ORIGINAL pixel coordinates; poster is',im.size)
if __name__=='__main__' and len(sys.argv)>1 and sys.argv[1]=='grid': grid(*(sys.argv[2:3]))
